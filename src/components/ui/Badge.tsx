import React from "react";
import { View, Text } from "react-native";
import { Colors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";

interface Props {
  label: string;
  variant?: "primary" | "secondary" | "warning" | "danger" | "neutral";
  size?: "sm" | "md";
}

const variantStyles = {
  primary: {
    bg: Colors.primary.light + "30",
    text: Colors.primary.DEFAULT,
  },
  secondary: {
    bg: Colors.secondary.light + "30",
    text: Colors.secondary.DEFAULT,
  },
  warning: {
    bg: Colors.warning.DEFAULT + "30",
    text: Colors.warning.dark,
  },
  danger: {
    bg: Colors.danger.DEFAULT + "20",
    text: Colors.danger.DEFAULT,
  },
  neutral: {
    bg: Colors.border,
    text: Colors.text.secondary,
  },
};

export function Badge({ label, variant = "primary", size = "sm" }: Props) {
  const colors = variantStyles[variant];

  return (
    <View
      style={{
        backgroundColor: colors.bg,
        paddingHorizontal: size === "sm" ? 8 : 12,
        paddingVertical: size === "sm" ? 3 : 5,
        borderRadius: 20,
        alignSelf: "flex-start",
      }}
    >
      <Text
        style={{
          color: colors.text,
          fontSize: size === "sm" ? 11 : 13,
          fontFamily: Fonts.semiBold,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
