import React from "react";
import { View, Text } from "react-native";
import { Image } from "expo-image";
import { Colors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";
import { getInitials } from "../../lib/helpers";

interface Props {
  name: string;
  imageUrl?: string | null;
  size?: number;
  color?: string;
}

export function Avatar({
  name,
  imageUrl,
  size = 48,
  color = Colors.primary.DEFAULT,
}: Props) {
  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: Colors.border,
        }}
        contentFit="cover"
        transition={200}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color + "20",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          fontSize: size * 0.38,
          fontFamily: Fonts.bold,
          color,
        }}
      >
        {getInitials(name)}
      </Text>
    </View>
  );
}
