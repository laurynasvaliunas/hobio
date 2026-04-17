import React, { useEffect } from "react";
import { View, Text, Image, StyleSheet, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  withRepeat,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { useAuthStore } from "../src/stores/authStore";
import { useTranslation } from "react-i18next";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GLOW_SIZE = SCREEN_WIDTH * 1.4;

/**
 * Hobio — branded intro / splash screen.
 *
 * Sequence (≈1.4s total):
 *   1. Warm terracotta glow blooms behind the stage.
 *   2. Logo stamps in: slight rotation + spring scale + fade.
 *   3. A single breathing pulse keeps the logo "alive" while auth resolves.
 *   4. Tagline slides up and fades in.
 * Once the auth store settles, the user is routed to the correct entry screen.
 */
export default function Index() {
  const { t } = useTranslation();
  const router = useRouter();
  const { session, profile, isLoading, isOnboarded } = useAuthStore();

  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.5);
  const logoRotate = useSharedValue(-8);
  const glowOpacity = useSharedValue(0);
  const glowScale = useSharedValue(0.6);
  const taglineOpacity = useSharedValue(0);
  const taglineTranslate = useSharedValue(12);
  const breathing = useSharedValue(1);

  useEffect(() => {
    glowOpacity.value = withTiming(0.55, {
      duration: 700,
      easing: Easing.out(Easing.quad),
    });
    glowScale.value = withTiming(1, {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });

    logoOpacity.value = withDelay(
      150,
      withTiming(1, { duration: 450, easing: Easing.out(Easing.quad) })
    );
    logoScale.value = withDelay(
      150,
      withSequence(
        withSpring(1.08, { damping: 9, stiffness: 140, mass: 0.9 }),
        withSpring(1, { damping: 14, stiffness: 160 })
      )
    );
    logoRotate.value = withDelay(
      150,
      withSpring(0, { damping: 10, stiffness: 120 })
    );

    taglineOpacity.value = withDelay(
      750,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) })
    );
    taglineTranslate.value = withDelay(
      750,
      withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) })
    );

    breathing.value = withDelay(
      1400,
      withRepeat(
        withSequence(
          withTiming(1.03, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
          withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        false
      )
    );
  }, []);

  useEffect(() => {
    if (isLoading) return;

    if (!session) {
      router.replace("/(auth)/welcome");
      return;
    }

    if (!profile) return;

    if (!isOnboarded) {
      router.replace("/(onboarding)/select-role");
      return;
    }

    if (profile.role === "organizer") {
      router.replace("/(tabs)/dashboard");
    } else {
      router.replace("/(tabs)/home");
    }
  }, [isLoading, session, profile, isOnboarded]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [
      { scale: logoScale.value * breathing.value },
      { rotate: `${logoRotate.value}deg` },
    ],
  }));

  const haloStyle = useAnimatedStyle(() => {
    const intensity = interpolate(breathing.value, [1, 1.03], [0.25, 0.45]);
    return {
      opacity: logoOpacity.value * intensity,
      transform: [{ scale: breathing.value * 1.15 }],
    };
  });

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineTranslate.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.glow, glowStyle]} />

      <View style={styles.stage}>
        <Animated.View style={[styles.halo, haloStyle]} />
        <Animated.View style={logoStyle}>
          <Image
            source={require("../assets/hobio-intro-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
      </View>

      <Animated.View style={[styles.taglineWrap, taglineStyle]}>
        <Text style={styles.tagline}>{t("splash.tagline")}</Text>
      </Animated.View>
    </View>
  );
}

const LOGO_SIZE = 220;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
    width: GLOW_SIZE,
    height: GLOW_SIZE,
    borderRadius: GLOW_SIZE / 2,
    backgroundColor: "#D97758",
    opacity: 0,
    // Soft, diffused bloom behind the logo.
    shadowColor: "#D97758",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 120,
    elevation: 0,
  },
  stage: {
    alignItems: "center",
    justifyContent: "center",
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  halo: {
    position: "absolute",
    width: LOGO_SIZE * 1.4,
    height: LOGO_SIZE * 1.4,
    borderRadius: LOGO_SIZE,
    backgroundColor: "#D97758",
    opacity: 0,
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  taglineWrap: {
    position: "absolute",
    bottom: 120,
    alignItems: "center",
    paddingHorizontal: 32,
  },
  tagline: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 15,
    fontWeight: "500",
    letterSpacing: 0.3,
    textAlign: "center",
  },
});
