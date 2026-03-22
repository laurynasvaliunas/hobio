import "../global.css";
import React, { useEffect } from "react";
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

// Create a React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export default function RootLayout() {
  const initialize = useAuthStore((s) => s.initialize);
  const isDark = useThemeStore((s) => s.isDark);

  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  useEffect(() => {
    // Network connectivity test (DEV only)
    if (__DEV__) {
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
      console.log("[Network Test] Starting...");
      // Test 1: Can the phone reach the internet at all?
      fetch("https://httpbin.org/get", { method: "GET" })
        .then((r) => console.log("[Network Test] Internet OK, status:", r.status))
        .catch((e) => console.error("[Network Test] Internet FAILED:", e.message));
      // Test 2: Can the phone reach Supabase specifically?
      fetch(`${supabaseUrl}/auth/v1/health`, { method: "GET" })
        .then((r) => console.log("[Network Test] Supabase OK, status:", r.status))
        .catch((e) => console.error("[Network Test] Supabase FAILED:", e.message));
    }

    initialize();
  }, []);

  // Log font errors in development
  useEffect(() => {
    if (fontError) {
      console.warn("Font loading error:", fontError);
    }
  }, [fontError]);

  // Show loading spinner while fonts load
  if (!fontsLoaded && !fontError) {
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
