import 'react-native-url-polyfill/auto';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

if (__DEV__) {
  console.log("[Supabase] URL:", supabaseUrl);
  console.log("[Supabase] Key present:", !!supabaseAnonKey);
}

// Use React Native's native fetch to avoid whatwg-fetch XHR polyfill issues
const nativeFetch: typeof globalThis.fetch = (...args) => {
  return globalThis.fetch(...args);
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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
