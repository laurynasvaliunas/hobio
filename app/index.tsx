import React, { useEffect, useRef } from "react";
import { View, Animated, Text, Image } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../src/stores/authStore";
import { Colors, Shadows } from "../src/constants/colors";

/**
 * Splash / routing screen.
 * Shows an animated branded splash while auth state loads,
 * then routes to the correct screen.
 */
export default function Index() {
  const router = useRouter();
  const { session, profile, isLoading, isOnboarded } = useAuthStore();

  // Pulse animation on the logo
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Gentle pulse while loading
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(logoScale, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    const timer = setTimeout(() => pulse.start(), 800);
    return () => {
      clearTimeout(timer);
      pulse.stop();
    };
  }, []);

  useEffect(() => {
    if (isLoading) return;

    if (!session) {
      router.replace("/(auth)/welcome");
      return;
    }

    // Session exists but profile is still being fetched — wait.
    if (!profile) return;

    if (!isOnboarded) {
      router.replace("/(onboarding)/select-role");
      return;
    }

    // RBAC: Route organizers to Studio Dashboard, others to Home
    if (profile.role === "organizer") {
      router.replace("/(tabs)/dashboard");
    } else {
      router.replace("/(tabs)/home");
    }
  }, [isLoading, session, profile, isOnboarded]);

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: Colors.primary.DEFAULT,
        gap: 12,
      }}
    >
      <Animated.View
        style={{
          opacity: logoOpacity,
          transform: [{ scale: logoScale }],
        }}
      >
        <Image
          source={require("../assets/hobio-brand-logo.png")}
          style={{ width: 160, height: 160 }}
          resizeMode="contain"
        />
      </Animated.View>
      <Animated.View style={{ opacity: subtitleOpacity, alignItems: "center", gap: 4 }}>
        <Text
          style={{
            fontSize: 14,
            color: "rgba(255,255,255,0.7)",
            fontWeight: "500",
          }}
        >
          All your hobbies, one place
        </Text>
      </Animated.View>
    </View>
  );
}
