import React from "react";
import { View, Text } from "react-native";
import { Colors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";
import { Button } from "./Button";

interface Props {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: Props) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 40,
        paddingVertical: 60,
        gap: 16,
      }}
    >
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: Colors.primary.light + "20",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 8,
        }}
      >
        {icon}
      </View>
      <Text
        style={{
          fontSize: 20,
          fontFamily: Fonts.bold,
          color: Colors.text.primary,
          textAlign: "center",
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontSize: 15,
          fontFamily: Fonts.regular,
          color: Colors.text.secondary,
          textAlign: "center",
          lineHeight: 22,
        }}
      >
        {description}
      </Text>
      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          fullWidth={false}
          size="sm"
          style={{ marginTop: 8, paddingHorizontal: 32 }}
        />
      )}
    </View>
  );
}
