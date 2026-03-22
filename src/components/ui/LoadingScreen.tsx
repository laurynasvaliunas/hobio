import React, { useEffect } from "react";
import { View, Image, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { Colors } from "../../constants/colors";

/**
 * Full-screen loading screen: animated Hobio wordmark + 3 bouncing dots.
 * Matches the Figma LoadingScreen design exactly.
 */
export function LoadingScreen() {
  const logoScale  = useSharedValue(0);
  const logoRotate = useSharedValue(-30);
  const textOpacity = useSharedValue(0);

  // Per-dot animations
  const dot0 = useSharedValue(1);
  const dot1 = useSharedValue(1);
  const dot2 = useSharedValue(1);

  useEffect(() => {
    // Logo spring entrance
    logoScale.value  = withSpring(1, { damping: 12, stiffness: 180 });
    logoRotate.value = withSpring(0, { damping: 14, stiffness: 160 });

    // Dots fade in after logo
    textOpacity.value = withDelay(400, withTiming(1, { duration: 300 }));

    // Bouncing dots — staggered pulse
    const pulse = (sv: Animated.SharedValue<number>, delay: number) => {
      sv.value = withDelay(
        delay + 600,
        withRepeat(
          withSequence(
            withTiming(1.6, { duration: 350 }),
            withTiming(0.6, { duration: 350 }),
            withTiming(1,   { duration: 300 }),
          ),
          -1,
          false,
        ),
      );
    };
    pulse(dot0, 0);
    pulse(dot1, 200);
    pulse(dot2, 400);
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: logoScale.value },
      { rotate: `${logoRotate.value}deg` },
    ],
  }));

  const dotsStyle = useAnimatedStyle(() => ({ opacity: textOpacity.value }));

  const d0Style = useAnimatedStyle(() => ({ transform: [{ scale: dot0.value }], opacity: dot0.value > 1 ? 1 : 0.5 + dot0.value * 0.3 }));
  const d1Style = useAnimatedStyle(() => ({ transform: [{ scale: dot1.value }], opacity: dot1.value > 1 ? 1 : 0.5 + dot1.value * 0.3 }));
  const d2Style = useAnimatedStyle(() => ({ transform: [{ scale: dot2.value }], opacity: dot2.value > 1 ? 1 : 0.5 + dot2.value * 0.3 }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoWrapper, logoStyle]}>
        <Image
          source={require("../../../assets/hobio-logo.png")}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.View style={[styles.dotsRow, dotsStyle]}>
        <Animated.View style={[styles.dot, d0Style]} />
        <Animated.View style={[styles.dot, d1Style]} />
        <Animated.View style={[styles.dot, d2Style]} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
  },
  logoWrapper: {
    alignItems: "center",
  },
  logoImage: {
    width: 180,
    height: 72,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary.DEFAULT,
  },
});
