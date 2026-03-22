import React from "react";
import { View, Dimensions, StyleSheet } from "react-native";
import { useTheme } from "../../hooks/useTheme";

const { width: W, height: H } = Dimensions.get("window");

/**
 * Subtle playful dot-pattern overlay for that "scrapbook / hobbyist" feel.
 * Theme-aware — dots become lighter/subtler in dark mode.
 */
export function PlayfulBackground() {
  const { colors, isDark } = useTheme();

  const dotOpacityBase = isDark ? 0.06 : 0.04;
  const dotOpacityAccent = isDark ? 0.1 : 0.08;
  const squiggleOpacity = isDark ? 0.04 : 0.06;

  const dots: { x: number; y: number; size: number; opacity: number }[] = [];
  const spacing = 48;
  for (let row = 0; row < Math.ceil(H / spacing); row++) {
    for (let col = 0; col < Math.ceil(W / spacing); col++) {
      const offsetX = row % 2 === 0 ? 0 : spacing / 2;
      dots.push({
        x: col * spacing + offsetX,
        y: row * spacing,
        size: (row + col) % 3 === 0 ? 4 : 3,
        opacity: (row + col) % 5 === 0 ? dotOpacityAccent : dotOpacityBase,
      });
    }
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {dots.map((dot, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            left: dot.x,
            top: dot.y,
            width: dot.size,
            height: dot.size,
            borderRadius: dot.size / 2,
            backgroundColor: colors.primary.DEFAULT,
            opacity: dot.opacity,
          }}
        />
      ))}
      <View
        style={{
          position: "absolute",
          right: 20,
          top: 120,
          width: 40,
          height: 40,
          borderRadius: 20,
          borderWidth: 1.5,
          borderColor: colors.accent.DEFAULT,
          opacity: squiggleOpacity,
          borderTopLeftRadius: 0,
        }}
      />
      <View
        style={{
          position: "absolute",
          left: 30,
          top: H * 0.4,
          width: 24,
          height: 24,
          borderRadius: 12,
          borderWidth: 1.5,
          borderColor: colors.secondary.DEFAULT,
          opacity: squiggleOpacity,
          borderBottomRightRadius: 0,
        }}
      />
      <View
        style={{
          position: "absolute",
          right: 50,
          top: H * 0.7,
          width: 32,
          height: 32,
          borderRadius: 16,
          borderWidth: 1.5,
          borderColor: colors.danger.DEFAULT,
          opacity: squiggleOpacity * 0.8,
          borderTopRightRadius: 0,
        }}
      />
    </View>
  );
}
