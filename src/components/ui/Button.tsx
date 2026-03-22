import React, { useRef, useCallback } from "react";
import {
  TouchableWithoutFeedback,
  Animated,
  Text,
  ActivityIndicator,
  type ViewStyle,
  type TextStyle,
} from "react-native";
import { Colors, Shadows } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";

interface Props {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
  fullWidth = true,
}: Props) {
  const isDisabled = disabled || loading;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
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

  const sizeStyles: Record<string, ViewStyle> = {
    sm: { height: 40, paddingHorizontal: 16, borderRadius: 16 },
    md: { height: 52, paddingHorizontal: 24, borderRadius: 20 },
    lg: { height: 56, paddingHorizontal: 32, borderRadius: 24 },
  };

  const variantStyles: Record<string, ViewStyle> = {
    primary: {
      backgroundColor: Colors.primary.DEFAULT,
      ...Shadows.button,
    },
    secondary: {
      backgroundColor: Colors.secondary.DEFAULT,
      ...Shadows.button,
    },
    outline: {
      backgroundColor: "transparent",
      borderWidth: 1.5,
      borderColor: Colors.primary.DEFAULT,
    },
    ghost: {
      backgroundColor: "transparent",
    },
    danger: {
      backgroundColor: Colors.danger.DEFAULT,
      ...Shadows.button,
    },
  };

  const textVariantStyles: Record<string, TextStyle> = {
    primary: { color: "#FFFFFF", fontFamily: Fonts.bold },
    secondary: { color: "#FFFFFF", fontFamily: Fonts.bold },
    outline: { color: Colors.primary.DEFAULT, fontFamily: Fonts.semiBold },
    ghost: { color: Colors.primary.DEFAULT, fontFamily: Fonts.medium },
    danger: { color: "#FFFFFF", fontFamily: Fonts.bold },
  };

  const textSizeStyles: Record<string, TextStyle> = {
    sm: { fontSize: 14 },
    md: { fontSize: 16 },
    lg: { fontSize: 18 },
  };

  return (
    <TouchableWithoutFeedback
      onPress={isDisabled ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <Animated.View
        style={[
          {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            transform: [{ scale: scaleAnim }],
          },
          fullWidth ? { width: "100%" } : {},
          sizeStyles[size],
          variantStyles[variant],
          isDisabled && { opacity: 0.5 },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator
            color={
              variant === "outline" || variant === "ghost"
                ? Colors.primary.DEFAULT
                : "#FFFFFF"
            }
            size="small"
          />
        ) : (
          <>
            {icon}
            <Text style={[textVariantStyles[variant], textSizeStyles[size], textStyle]}>
              {title}
            </Text>
          </>
        )}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}
