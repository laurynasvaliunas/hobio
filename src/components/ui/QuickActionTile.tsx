import React, { useEffect } from "react";
import { TouchableWithoutFeedback, View, Text, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  withRepeat,
  withTiming,
  withSpring,
  useAnimatedStyle,
  Easing,
} from "react-native-reanimated";
import { Fonts } from "../../constants/fonts";
import { Shadows } from "../../constants/colors";

const { width: W } = Dimensions.get("window");

interface Props {
  icon: React.ReactNode;
  label: string;
  color: string;
  onPress?: () => void;
}

/**
 * Quick-action tile with a repeating shine sweep effect — matches the Figma QuickAction design.
 * The shine is a white semi-transparent stripe that travels left→right endlessly.
 */
export function QuickActionTile({ icon, label, color, onPress }: Props) {
  const shineX   = useSharedValue(-W);
  const tileScale = useSharedValue(1);

  useEffect(() => {
    shineX.value = withRepeat(
      withTiming(W * 2, { duration: 2800, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    );
  }, []);

  const shineStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shineX.value }],
  }));

  const tileStyle = useAnimatedStyle(() => ({
    transform: [{ scale: tileScale.value }],
  }));

  const handlePressIn = () => {
    tileScale.value = withSpring(0.95, { damping: 20, stiffness: 400 });
  };
  const handlePressOut = () => {
    tileScale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return (
    <TouchableWithoutFeedback
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.tile,
          { backgroundColor: color, ...Shadows.button },
          tileStyle,
        ]}
      >
        {/* Sweep shine */}
        <Animated.View pointerEvents="none" style={[styles.shine, shineStyle]} />

        <View style={styles.inner}>
          <View style={styles.iconWrapper}>{icon}</View>
          <Text style={styles.label}>{label}</Text>
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    borderRadius: 16,
    height: 88,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  shine: {
    position: "absolute",
    top: 0,
    width: 60,
    height: "100%",
    backgroundColor: "rgba(255,255,255,0.18)",
    transform: [{ skewX: "-15deg" }],
  },
  inner: {
    alignItems: "center",
    gap: 8,
    zIndex: 1,
  },
  iconWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    color: "#FFFFFF",
  },
});
