import React, { useEffect, useRef } from "react";
import { View, Animated } from "react-native";

interface PulseMarkerProps {
  color: string;
  isSelected: boolean;
  isMember: boolean;
}

/**
 * Custom map marker with an optional pulse animation for "My Groups."
 * - Members get a pulsing outer ring.
 * - Selected markers scale up.
 */
export function PulseMarker({ color, isSelected, isMember }: PulseMarkerProps) {
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(isSelected ? 1.3 : 1)).current;

  // Pulse loop for member markers
  useEffect(() => {
    if (isMember) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [isMember, pulseAnim]);

  // Selection scale
  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isSelected ? 1.4 : 1,
      tension: 120,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [isSelected, scaleAnim]);

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.2],
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0.4, 0.15, 0],
  });

  return (
    <Animated.View
      style={{
        width: 44,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
        transform: [{ scale: scaleAnim }],
      }}
    >
      {/* Pulse ring (members only) */}
      {isMember && (
        <Animated.View
          style={{
            position: "absolute",
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: color,
            opacity: pulseOpacity,
            transform: [{ scale: pulseScale }],
          }}
        />
      )}

      {/* Outer ring */}
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: color + "30",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Inner dot */}
        <View
          style={{
            width: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: color,
            borderWidth: 2.5,
            borderColor: "#FFFFFF",
            shadowColor: color,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.4,
            shadowRadius: 4,
            elevation: 4,
          }}
        />
      </View>
    </Animated.View>
  );
}
