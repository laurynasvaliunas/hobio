import React, { useRef, useCallback } from "react";
import { Animated, TouchableWithoutFeedback, type ViewStyle } from "react-native";
import { useTheme } from "../../hooks/useTheme";

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  noPadding?: boolean;
  /** Elevated card uses a stronger shadow (e.g. for banners, featured content) */
  elevated?: boolean;
  /** If provided, card is tappable with a spring bounce */
  onPress?: () => void;
}

/**
 * Pill-shaped card (24px border radius) with a springy bounce on tap.
 * Theme-aware — adapts to light/dark mode automatically.
 */
export function Card({ children, style, noPadding = false, elevated = false, onPress }: Props) {
  const { colors, shadows } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 200,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const cardContent = (
    <Animated.View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: 24,
          ...(elevated ? {
            shadowColor: shadows.card.shadowColor,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: (shadows.card.shadowOpacity ?? 0.08) * 1.5,
            shadowRadius: 24,
            elevation: (shadows.card.elevation ?? 4) + 4,
          } : shadows.card),
          transform: [{ scale: scaleAnim }],
        },
        !noPadding && { padding: 16 },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );

  if (onPress) {
    return (
      <TouchableWithoutFeedback
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {cardContent}
      </TouchableWithoutFeedback>
    );
  }

  return (
    <TouchableWithoutFeedback onPressIn={handlePressIn} onPressOut={handlePressOut}>
      {cardContent}
    </TouchableWithoutFeedback>
  );
}
