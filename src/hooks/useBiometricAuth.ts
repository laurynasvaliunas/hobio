import { useState, useEffect, useCallback, useRef } from "react";
import { AppState, type AppStateStatus, Platform } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { supabase } from "../lib/supabase";

// Secure store keys
const BIOMETRIC_ENABLED_KEY = "hobio_biometric_enabled";
const REFRESH_TOKEN_KEY = "hobio_secure_refresh_token";
const LAST_UNLOCK_KEY = "hobio_last_unlock_timestamp";

// 2-minute grace period (in ms)
const GRACE_PERIOD_MS = 2 * 60 * 1000;

export type BiometricType = "fingerprint" | "facial" | "iris" | "none";

interface UseBiometricAuthReturn {
  /** Whether the device supports biometrics */
  isAvailable: boolean;
  /** Type of biometric hardware available */
  biometricType: BiometricType;
  /** Whether the user has enabled biometric login */
  isEnabled: boolean;
  /** Whether the app is currently locked */
  isLocked: boolean;
  /** Loading state during async operations */
  isLoading: boolean;

  /** Enroll biometrics: verify face/finger + store encrypted token */
  enroll: () => Promise<boolean>;
  /** Disable biometric login and clear stored credentials */
  unenroll: () => Promise<void>;
  /** Trigger the native biometric prompt to unlock */
  authenticate: () => Promise<boolean>;
  /** Use password fallback when biometric fails */
  authenticateWithPassword: (email: string, password: string) => Promise<boolean>;
  /** Reset lock state (called after successful auth) */
  clearLock: () => void;
}

export function useBiometricAuth(): UseBiometricAuthReturn {
  const [isAvailable, setIsAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<BiometricType>("none");
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const lastBackgroundTime = useRef<number | null>(null);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  // Check hardware capabilities
  const checkAvailability = useCallback(async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setIsAvailable(compatible && enrolled);

      if (compatible && enrolled) {
        const types =
          await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (
          types.includes(
            LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
          )
        ) {
          setBiometricType("facial");
        } else if (
          types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
        ) {
          setBiometricType("fingerprint");
        } else if (
          types.includes(
            LocalAuthentication.AuthenticationType.IRIS
          )
        ) {
          setBiometricType("iris");
        }
      }
    } catch (error) {
      console.error("Biometric availability check error:", error);
      setIsAvailable(false);
    }
  }, []);

  // Check if user has previously enabled biometrics
  const checkEnabled = useCallback(async () => {
    try {
      const stored = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
      const enabled = stored === "true";
      setIsEnabled(enabled);
      return enabled;
    } catch {
      setIsEnabled(false);
      return false;
    }
  }, []);

  // Grace period logic: check if we need to lock
  const shouldLock = useCallback(async (): Promise<boolean> => {
    try {
      const lastUnlock = await SecureStore.getItemAsync(LAST_UNLOCK_KEY);
      if (!lastUnlock) return true;
      const elapsed = Date.now() - parseInt(lastUnlock, 10);
      return elapsed > GRACE_PERIOD_MS;
    } catch {
      return true;
    }
  }, []);

  // Store the unlock timestamp
  const recordUnlock = useCallback(async () => {
    try {
      await SecureStore.setItemAsync(LAST_UNLOCK_KEY, Date.now().toString());
    } catch (error) {
      console.error("Record unlock error:", error);
    }
  }, []);

  // Initialize
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await checkAvailability();
      const enabled = await checkEnabled();

      if (enabled) {
        const needsLock = await shouldLock();
        setIsLocked(needsLock);
      }
      setIsLoading(false);
    };
    init();
  }, []);

  // App state listener: handle background -> foreground transitions
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      async (nextState: AppStateStatus) => {
        if (
          appState.current === "active" &&
          (nextState === "background" || nextState === "inactive")
        ) {
          // Going to background: record timestamp
          lastBackgroundTime.current = Date.now();
        } else if (
          (appState.current === "background" ||
            appState.current === "inactive") &&
          nextState === "active"
        ) {
          // Coming back to foreground
          if (isEnabled && lastBackgroundTime.current) {
            const elapsed = Date.now() - lastBackgroundTime.current;
            if (elapsed > GRACE_PERIOD_MS) {
              setIsLocked(true);
            }
          }
        }
        appState.current = nextState;
      }
    );

    return () => subscription.remove();
  }, [isEnabled]);

  // Enroll: enable biometric login + save encrypted token to Keychain/Keystore
  const enroll = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      // First verify the user's identity
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Verify your identity to enable biometric login",
        cancelLabel: "Cancel",
        disableDeviceFallback: false,
        fallbackLabel: "Use Passcode",
      });

      if (!result.success) {
        setIsLoading(false);
        return false;
      }

      // Get the current refresh token from Supabase session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.refresh_token) {
        throw new Error("No active session found");
      }

      // Store encrypted refresh token in Secure Storage (Keychain/Keystore)
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, session.refresh_token, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });

      // Mark biometrics as enabled
      await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, "true");
      await recordUnlock();

      setIsEnabled(true);
      setIsLocked(false);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("Biometric enroll error:", error);
      setIsLoading(false);
      return false;
    }
  }, []);

  // Unenroll: disable biometric login and wipe stored credentials
  const unenroll = useCallback(async () => {
    try {
      await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(LAST_UNLOCK_KEY);
      setIsEnabled(false);
      setIsLocked(false);
    } catch (error) {
      console.error("Biometric unenroll error:", error);
    }
  }, []);

  // Authenticate: prompt FaceID/Fingerprint and refresh session
  const authenticate = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock Hobio",
        cancelLabel: "Use Password",
        disableDeviceFallback: false,
        fallbackLabel: "Use Passcode",
      });

      if (!result.success) {
        setIsLoading(false);
        return false;
      }

      // Retrieve the stored refresh token from Secure Storage
      const storedToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);

      if (storedToken) {
        // Refresh the Supabase session with the stored token
        const { data, error } = await supabase.auth.refreshSession({
          refresh_token: storedToken,
        });

        if (!error && data.session?.refresh_token) {
          // Update stored token with the new one
          await SecureStore.setItemAsync(
            REFRESH_TOKEN_KEY,
            data.session.refresh_token,
            {
              keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
            }
          );
        }
      }

      await recordUnlock();
      setIsLocked(false);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("Biometric authenticate error:", error);
      setIsLoading(false);
      return false;
    }
  }, []);

  // Password fallback when biometric fails
  const authenticateWithPassword = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      setIsLoading(true);
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setIsLoading(false);
          return false;
        }

        // Update the stored refresh token
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.refresh_token) {
          await SecureStore.setItemAsync(
            REFRESH_TOKEN_KEY,
            session.refresh_token,
            {
              keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
            }
          );
        }

        await recordUnlock();
        setIsLocked(false);
        setIsLoading(false);
        return true;
      } catch (error) {
        console.error("Password fallback error:", error);
        setIsLoading(false);
        return false;
      }
    },
    []
  );

  const clearLock = useCallback(() => {
    setIsLocked(false);
    recordUnlock();
  }, []);

  return {
    isAvailable,
    biometricType,
    isEnabled,
    isLocked,
    isLoading,
    enroll,
    unenroll,
    authenticate,
    authenticateWithPassword,
    clearLock,
  };
}
