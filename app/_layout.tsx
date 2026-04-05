import "../global.css";
import "../src/i18n";
import i18n from "../src/i18n";
import * as Sentry from "@sentry/react-native";
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
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAuthStore } from "../src/stores/authStore";
import { useThemeStore } from "../src/stores/themeStore";
import { ToastContainer } from "../src/components/ui/Toast";

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enabled: !__DEV__,
  tracesSampleRate: 0.2,
});

// Create a React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function RootLayout() {
  const initialize = useAuthStore((s) => s.initialize);
  const isDark = useThemeStore((s) => s.isDark);

  const [i18nReady, setI18nReady] = useState(false);

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

  // Log font errors in development
  useEffect(() => {
    if (fontError) {
      console.warn("Font loading error:", fontError);
    }
  }, [fontError]);

  // Block until fonts and i18n are ready (avoids flash of missing translation keys)
  const fontsPending = !fontsLoaded && !fontError;
  if (fontsPending || !i18nReady) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FBF6F3" }}>
        <ActivityIndicator size="large" color="#D97758" />
      </View>
    );
  }

  return (
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
                  name="join/[code]"
                  options={{ presentation: "modal" }}
                />
              </Stack>
            </GestureHandlerRootView>
        </PaperProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
