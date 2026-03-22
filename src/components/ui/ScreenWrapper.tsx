import React from "react";
import { View, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../hooks/useTheme";
import { PlayfulBackground } from "./PlayfulBackground";

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  noPadding?: boolean;
  edges?: ("top" | "bottom" | "left" | "right")[];
  /** Set false to hide the dot-pattern texture */
  showTexture?: boolean;
  /** "professional" removes playful textures for a cleaner business feel */
  variant?: "joyful" | "professional";
}

export function ScreenWrapper({
  children,
  style,
  noPadding = false,
  edges = ["top"],
  showTexture = true,
  variant = "joyful",
}: Props) {
  const { colors } = useTheme();

  const shouldShowTexture = showTexture && variant !== "professional";

  return (
    <SafeAreaView
      edges={edges}
      style={[{ flex: 1, backgroundColor: colors.background }, style]}
    >
      {shouldShowTexture && <PlayfulBackground />}
      <View style={[{ flex: 1 }, !noPadding && { paddingHorizontal: 20 }]}>
        {children}
      </View>
    </SafeAreaView>
  );
}
