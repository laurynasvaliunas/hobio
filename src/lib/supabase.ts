import "react-native-url-polyfill/auto";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { createClient } from "@supabase/supabase-js";
// NOTE: `Database` is intentionally imported as a type-only alias but NOT
// passed as the `createClient` generic. The generated file in
// `../types/supabase` lags behind our latest migration (documents,
// achievements, user_stats, push_tokens, etc. are missing), and enforcing
// the stale schema would surface false-positive type errors across hooks.
// Re-tighten this once `npm run db:types` is executed against a linked
// Supabase project.
import type { Database } from "../types/supabase";
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

/**
 * Session storage adapter.
 *
 * Native: `expo-secure-store` (Keychain on iOS, EncryptedSharedPreferences on
 *         Android). SecureStore has a 2KB value-size limit; Supabase session
 *         JSON occasionally exceeds it, so we chunk on write and reassemble on
 *         read. Unchunked legacy values are also honoured for migration.
 *
 * Web:    AsyncStorage fallback. (SecureStore is not available on web.)
 */
const SECURE_STORE_CHUNK = 1800;

const nativeStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      const meta = await SecureStore.getItemAsync(`${key}::chunks`);
      if (meta) {
        const total = parseInt(meta, 10);
        if (!Number.isFinite(total) || total <= 0) return null;
        const parts: string[] = [];
        for (let i = 0; i < total; i += 1) {
          const part = await SecureStore.getItemAsync(`${key}::${i}`);
          if (part == null) return null;
          parts.push(part);
        }
        return parts.join("");
      }
      return await SecureStore.getItemAsync(key);
    } catch (err) {
      log.warn("secureStore getItem failed", { name: (err as Error)?.name });
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (value.length <= SECURE_STORE_CHUNK) {
        await SecureStore.setItemAsync(key, value, {
          keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
        });
        await SecureStore.deleteItemAsync(`${key}::chunks`).catch(() => {});
        return;
      }
      const total = Math.ceil(value.length / SECURE_STORE_CHUNK);
      for (let i = 0; i < total; i += 1) {
        const chunk = value.slice(i * SECURE_STORE_CHUNK, (i + 1) * SECURE_STORE_CHUNK);
        await SecureStore.setItemAsync(`${key}::${i}`, chunk, {
          keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
        });
      }
      await SecureStore.setItemAsync(`${key}::chunks`, String(total));
      await SecureStore.deleteItemAsync(key).catch(() => {});
    } catch (err) {
      log.error("secureStore setItem failed", { name: (err as Error)?.name });
    }
  },
  async removeItem(key: string): Promise<void> {
    try {
      const meta = await SecureStore.getItemAsync(`${key}::chunks`);
      if (meta) {
        const total = parseInt(meta, 10);
        for (let i = 0; i < total; i += 1) {
          await SecureStore.deleteItemAsync(`${key}::${i}`).catch(() => {});
        }
        await SecureStore.deleteItemAsync(`${key}::chunks`).catch(() => {});
      }
      await SecureStore.deleteItemAsync(key).catch(() => {});
    } catch (err) {
      log.warn("secureStore removeItem failed", { name: (err as Error)?.name });
    }
  },
};

const authStorage = Platform.OS === "web" ? AsyncStorage : nativeStorage;

// Use React Native's native fetch to avoid whatwg-fetch XHR polyfill issues
const nativeFetch: typeof globalThis.fetch = (...args) => globalThis.fetch(...args);

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: authStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    fetch: nativeFetch,
  },
});
