import React, { useEffect } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  useAnimatedStyle,
  Easing,
} from "react-native-reanimated";

const { width: W, height: H } = Dimensions.get("window");

const BLOBS = [
  { color: "#D97758", size: 320, x: W * 0.05, y: H * 0.08, duration: 7000 },
  { color: "#7AAF8A", size: 280, x: W * 0.55, y: H * 0.45, duration: 9000 },
  { color: "#E8B86D", size: 240, x: W * 0.2,  y: H * 0.65, duration: 11000 },
];

function Blob({
  color, size, x, y, duration,
}: {
  color: string; size: number; x: number; y: number; duration: number;
}) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    translateX.value = withRepeat(
      withSequence(
        withTiming(30,  { duration, easing: Easing.inOut(Easing.ease) }),
        withTiming(-30, { duration, easing: Easing.inOut(Easing.ease) }),
        withTiming(0,   { duration, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
    translateY.value = withRepeat(
      withSequence(
        withTiming(-40, { duration: duration * 1.1, easing: Easing.inOut(Easing.ease) }),
        withTiming(40,  { duration: duration * 1.1, easing: Easing.inOut(Easing.ease) }),
        withTiming(0,   { duration: duration * 1.1, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
    scale.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: duration * 0.8, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.90, { duration: duration * 0.8, easing: Easing.inOut(Easing.ease) }),
        withTiming(1,    { duration: duration * 0.8, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          left: x - size / 2,
          top:  y - size / 2,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity: 0.18,
        },
        animStyle,
      ]}
    />
  );
}

/**
 * Floating warm-colour blobs — identical visual to the Figma AnimatedBackground.
 * Drop this into any full-screen auth / welcome layout as an absolute layer.
 */
export function AnimatedBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {BLOBS.map((blob, i) => (
        <Blob key={i} {...blob} />
      ))}
    </View>
  );
}
