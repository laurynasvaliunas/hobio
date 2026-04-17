import "../global.css";
import "../src/i18n";
import i18n from "../src/i18n";
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useFonts } from "expo-font";
import {
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from "@expo-google-fonts/nunito";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../src/lib/queryClient";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAuthStore } from "../src/stores/authStore";
import { useThemeStore } from "../src/stores/themeStore";
import { ToastContainer } from "../src/components/ui/Toast";
import { usePushNotifications } from "../src/hooks/usePushNotifications";
import { StripeProvider } from "@stripe/stripe-react-native";
import { ErrorBoundary } from "../src/components/ErrorBoundary";
import { createLogger } from "../src/lib/logger";

const log = createLogger("Root");

// Sentry is only active in production builds (not in Expo Go / dev)
let Sentry: typeof import("@sentry/react-native") | null = null;
if (!__DEV__) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Sentry = require("@sentry/react-native");
  Sentry!.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.2,
    // Strip PII before sending events to Sentry.
    beforeSend(event) {
      if (event.user) {
        delete event.user.email;
        delete (event.user as { phone?: unknown }).phone;
      }
      if (event.request?.headers) {
        delete event.request.headers["Authorization"];
        delete event.request.headers["Cookie"];
      }
      return event;
    },
  });
}

function RootLayout() {
  const initialize = useAuthStore((s) => s.initialize);
  const session = useAuthStore((s) => s.session);
  const isDark = useThemeStore((s) => s.isDark);

  usePushNotifications(session?.user?.id);

  const [i18nReady, setI18nReady] = useState(() => i18n.isInitialized);

  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  useEffect(() => {
    const onInitialized = () => setI18nReady(true);
    i18n.on("initialized", onInitialized);
    if (i18n.isInitialized) setI18nReady(true);
    return () => {
      i18n.off("initialized", onInitialized);
    };
  }, []);

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (fontError) {
      log.warn("font_loading_error", { name: (fontError as Error)?.name });
    }
  }, [fontError]);

  // Block until fonts and i18n are ready (avoids flash of missing translation keys)
  const fontsPending = !fontsLoaded && !fontError;
  if (fontsPending || !i18nReady) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#000000" }}>
        <ActivityIndicator size="large" color="#D97758" />
      </View>
    );
  }

  return (
    <ErrorBoundary scope="root">
      <StripeProvider
        publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ""}
        urlScheme="hobio"
      >
        <QueryClientProvider client={queryClient}>
          <SafeAreaProvider>
            <PaperProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <StatusBar style={isDark ? "light" : "dark"} />
                <ToastContainer />
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="index" />
                  <Stack.Screen name="(auth)" />
                  <Stack.Screen name="(onboarding)" />
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen
                    name="modals/create-group"
                    options={{ presentation: "modal" }}
                  />
                  <Stack.Screen
                    name="modals/create-announcement"
                    options={{ presentation: "modal" }}
                  />
                  <Stack.Screen
                    name="modals/add-child"
                    options={{ presentation: "modal" }}
                  />
                  <Stack.Screen
                    name="modals/create-session"
                    options={{ presentation: "modal" }}
                  />
                  <Stack.Screen
                    name="modals/contract-detail"
                    options={{ presentation: "modal" }}
                  />
                  <Stack.Screen
                    name="modals/member-detail"
                    options={{ presentation: "modal" }}
                  />
                  <Stack.Screen
                    name="modals/invite-qr"
                    options={{ presentation: "modal" }}
                  />
                  <Stack.Screen
                    name="join/[code]"
                    options={{ presentation: "modal" }}
                  />
                </Stack>
              </GestureHandlerRootView>
            </PaperProvider>
          </SafeAreaProvider>
        </QueryClientProvider>
      </StripeProvider>
    </ErrorBoundary>
  );
}

export default Sentry ? Sentry.wrap(RootLayout) : RootLayout;
