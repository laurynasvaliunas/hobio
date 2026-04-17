import React, { useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  StatusBar,
} from "react-native";
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
import Svg, {
  Defs,
  RadialGradient,
  Stop,
  Rect,
} from "react-native-svg";
import { useAuthStore } from "../src/stores/authStore";
import { useTranslation } from "react-i18next";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

/**
 * Hobio — branded intro / splash screen.
 *
 * Sequence (≈1.4s total):
 *   1. Warm terracotta radial glow blooms from behind the stage.
 *   2. Logo "stamps" in: slight rotation + spring scale + fade.
 *   3. Tagline slides up and fades in.
 *   4. A subtle breathing pulse keeps the logo alive while auth resolves.
 * Once the auth store settles, the user is routed to the correct entry screen.
 */
export default function Index() {
  const { t } = useTranslation();
  const router = useRouter();
  const { session, profile, isLoading, isOnboarded } = useAuthStore();

  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.55);
  const logoRotate = useSharedValue(-8);
  const glowOpacity = useSharedValue(0);
  const glowScale = useSharedValue(0.5);
  const taglineOpacity = useSharedValue(0);
  const taglineTranslate = useSharedValue(14);
  const breathing = useSharedValue(1);

  useEffect(() => {
    glowOpacity.value = withTiming(1, {
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
    transform: [{ scale: glowScale.value * breathing.value }],
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [
      { scale: logoScale.value * breathing.value },
      { rotate: `${logoRotate.value}deg` },
    ],
  }));

  const haloStyle = useAnimatedStyle(() => {
    const intensity = interpolate(breathing.value, [1, 1.03], [0.35, 0.55]);
    return {
      opacity: logoOpacity.value * intensity,
    };
  });

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineTranslate.value }],
  }));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      <Animated.View style={[styles.glowWrap, glowStyle]} pointerEvents="none">
        <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT}>
          <Defs>
            <RadialGradient
              id="hobioGlow"
              cx="50%"
              cy="50%"
              rx="55%"
              ry="55%"
              fx="50%"
              fy="50%"
            >
              <Stop offset="0%" stopColor="#D97758" stopOpacity="0.55" />
              <Stop offset="45%" stopColor="#D97758" stopOpacity="0.18" />
              <Stop offset="100%" stopColor="#D97758" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect
            x="0"
            y="0"
            width={SCREEN_WIDTH}
            height={SCREEN_HEIGHT}
            fill="url(#hobioGlow)"
          />
        </Svg>
      </Animated.View>

      <View style={styles.stage}>
        <Animated.View style={[styles.halo, haloStyle]} pointerEvents="none" />
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
  glowWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  stage: {
    alignItems: "center",
    justifyContent: "center",
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  halo: {
    position: "absolute",
    width: LOGO_SIZE * 1.35,
    height: LOGO_SIZE * 1.35,
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
    color: "rgba(255,255,255,0.75)",
    fontSize: 15,
    fontWeight: "500",
    letterSpacing: 0.4,
    textAlign: "center",
  },
});
