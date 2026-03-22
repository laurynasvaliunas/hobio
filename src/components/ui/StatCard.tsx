import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  withDelay,
  useAnimatedStyle,
  Easing,
} from "react-native-reanimated";
import { useTheme } from "../../hooks/useTheme";
import { Fonts } from "../../constants/fonts";

interface Props {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  tint: string;
  subLabel?: string;
  trend?: "up" | "down";
}

/**
 * Stat card with an animated pulsing gradient-blob background — identical
 * to the Figma StatCard design. Uses theme-aware surface colour.
 */
export function StatCard({ icon, value, label, tint, subLabel, trend }: Props) {
  const { colors, shadows } = useTheme();

  // Pulsing blob in the background
  const blobScale   = useSharedValue(1);
  const blobOpacity = useSharedValue(0.05);

  // Value counter spring entrance
  const valueScale   = useSharedValue(0.5);
  const valueOpacity = useSharedValue(0);

  useEffect(() => {
    // Continuous blob pulse
    blobScale.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.9, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1,   { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
    blobOpacity.value = withRepeat(
      withSequence(
        withTiming(0.10, { duration: 2000 }),
        withTiming(0.04, { duration: 2000 }),
        withTiming(0.05, { duration: 1000 }),
      ),
      -1,
      false,
    );

    // Value pop-in
    valueScale.value   = withDelay(200, withSpring(1, { damping: 14, stiffness: 200 }));
    valueOpacity.value = withDelay(200, withTiming(1, { duration: 300 }));
  }, []);

  const blobStyle = useAnimatedStyle(() => ({
    transform: [{ scale: blobScale.value }],
    opacity: blobOpacity.value,
  }));

  const valueStyle = useAnimatedStyle(() => ({
    transform: [{ scale: valueScale.value }],
    opacity: valueOpacity.value,
  }));

  const trendLabel = trend === "up" ? "↑ " : trend === "down" ? "↓ " : "";

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, ...shadows.card }]}>
      {/* Pulsing blob */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.blob,
          { backgroundColor: tint },
          blobStyle,
        ]}
      />

      <View style={styles.content}>
        {/* Icon */}
        <View style={[styles.iconBox, { backgroundColor: tint + "18" }]}>
          {icon}
        </View>

        {/* Value */}
        <Animated.Text style={[styles.value, { color: colors.text.primary }, valueStyle]}>
          {value}
        </Animated.Text>

        {/* Label */}
        <Text style={[styles.label, { color: colors.text.secondary }]}>{label}</Text>

        {/* Sub-label with trend arrow */}
        {subLabel && (
          <Text style={[styles.subLabel, { color: tint }]}>
            {trendLabel}{subLabel}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
    padding: 16,
  },
  blob: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  content: {
    gap: 6,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  value: {
    fontSize: 24,
    fontFamily: Fonts.extraBold,
  },
  label: {
    fontSize: 12,
    fontFamily: Fonts.medium,
  },
  subLabel: {
    fontSize: 11,
    fontFamily: Fonts.semiBold,
    marginTop: 2,
  },
});
