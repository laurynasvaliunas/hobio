import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, View } from "react-native";
import { Send } from "lucide-react-native";
import { Colors } from "../../constants/colors";

const { width: W, height: H } = Dimensions.get("window");

interface Props {
  visible: boolean;
  onComplete?: () => void;
}

/**
 * Paper-plane animation that flies across the screen when a user joins a group.
 * Leaves a colored "squiggle trail" (fading dots) behind it.
 */
export function PaperPlaneAnimation({ visible, onComplete }: Props) {
  const posX = useRef(new Animated.Value(-60)).current;
  const posY = useRef(new Animated.Value(H * 0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const rotation = useRef(new Animated.Value(0)).current;
  const trailOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    // Reset
    posX.setValue(-60);
    posY.setValue(H * 0.6);
    opacity.setValue(1);
    rotation.setValue(0);
    trailOpacity.setValue(1);

    // Fly across diagonally
    Animated.parallel([
      Animated.timing(posX, {
        toValue: W + 80,
        duration: 1600,
        useNativeDriver: true,
      }),
      Animated.timing(posY, {
        toValue: H * 0.15,
        duration: 1600,
        useNativeDriver: true,
      }),
      Animated.timing(rotation, {
        toValue: -0.4,
        duration: 1600,
        useNativeDriver: true,
      }),
      // Fade trail
      Animated.sequence([
        Animated.delay(800),
        Animated.timing(trailOpacity, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      // Fade out plane at the end
      Animated.sequence([
        Animated.delay(1200),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      onComplete?.();
    });
  }, [visible]);

  if (!visible) return null;

  // Trail dots at fixed positions along the flight path
  const trailDots = Array.from({ length: 12 }).map((_, i) => {
    const progress = i / 12;
    const x = -60 + (W + 140) * progress;
    // Sine wave for squiggle effect
    const baseY = H * 0.6 + (H * 0.15 - H * 0.6) * progress;
    const squiggle = Math.sin(progress * Math.PI * 3) * 20;

    return (
      <Animated.View
        key={i}
        style={{
          position: "absolute",
          left: x,
          top: baseY + squiggle,
          width: 6 - i * 0.3,
          height: 6 - i * 0.3,
          borderRadius: 3,
          backgroundColor: i % 2 === 0 ? Colors.danger.DEFAULT : Colors.accent.DEFAULT,
          opacity: trailOpacity,
        }}
      />
    );
  });

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 9999 }]} pointerEvents="none">
      {/* Squiggle trail */}
      {trailDots}

      {/* Paper plane */}
      <Animated.View
        style={{
          position: "absolute",
          transform: [
            { translateX: posX },
            { translateY: posY },
            { rotate: rotation.interpolate({
                inputRange: [-1, 0],
                outputRange: ["-40deg", "0deg"],
              }),
            },
          ],
          opacity,
        }}
      >
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: Colors.accent.DEFAULT,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: Colors.accent.DEFAULT,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 6,
          }}
        >
          <Send size={24} color="#FFF" strokeWidth={2.5} />
        </View>
      </Animated.View>
    </View>
  );
}
