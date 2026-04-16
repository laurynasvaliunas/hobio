import 'react-native-url-polyfill/auto';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Database } from "../types/supabase";
import { createLogger } from "./logger";

const log = createLogger("Supabase");

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

if (__DEV__) {
  log.debug("client configured", {
    urlConfigured: supabaseUrl.length > 0,
    keyConfigured: supabaseAnonKey.length > 0,
  });
}

if (!supabaseUrl || !supabaseAnonKey) {
  log.error("Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY");
}

// Use React Native's native fetch to avoid whatwg-fetch XHR polyfill issues
const nativeFetch: typeof globalThis.fetch = (...args) => {
  return globalThis.fetch(...args);
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    fetch: nativeFetch,
  },
});
