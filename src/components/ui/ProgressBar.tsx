import React, { useEffect, useRef } from "react";
import { View, Animated } from "react-native";
import { Colors } from "../../constants/colors";

interface ProgressBarProps {
  /** Number of total steps */
  steps: number;
  /** Current step (0-indexed) */
  currentStep: number;
  /** Height of the bar */
  height?: number;
  /** Active color */
  activeColor?: string;
  /** Inactive color */
  inactiveColor?: string;
}

/**
 * Segmented progress bar for multi-step flows.
 * Each segment animates its fill independently with smooth spring transitions.
 */
export function ProgressBar({
  steps,
  currentStep,
  height = 4,
  activeColor = Colors.primary.DEFAULT,
  inactiveColor = Colors.border,
}: ProgressBarProps) {
  const animations = useRef(
    Array.from({ length: steps }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    animations.forEach((anim, index) => {
      Animated.spring(anim, {
        toValue: index <= currentStep ? 1 : 0,
        tension: 80,
        friction: 12,
        useNativeDriver: false,
      }).start();
    });
  }, [currentStep]);

  return (
    <View
      style={{
        flexDirection: "row",
        gap: 6,
        paddingHorizontal: 4,
      }}
    >
      {animations.map((anim, index) => (
        <View
          key={index}
          style={{
            flex: 1,
            height,
            borderRadius: height / 2,
            backgroundColor: inactiveColor,
            overflow: "hidden",
          }}
        >
          <Animated.View
            style={{
              height: "100%",
              borderRadius: height / 2,
              backgroundColor: activeColor,
              width: anim.interpolate({
                inputRange: [0, 1],
                outputRange: ["0%", "100%"],
              }),
            }}
          />
        </View>
      ))}
    </View>
  );
}
