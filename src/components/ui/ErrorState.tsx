import React from "react";
import { View, Text, Pressable } from "react-native";
import { AlertTriangle, RefreshCw } from "lucide-react-native";
import { Colors } from "../../constants/colors";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void | Promise<void>;
  retryLabel?: string;
}

/**
 * Inline error panel used by list/detail screens when a fetch fails.
 * Keeps the screen chrome while explaining what happened and offering a retry.
 */
export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
  retryLabel = "Try again",
}: ErrorStateProps) {
  return (
    <View
      accessibilityRole="alert"
      style={{
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        gap: 12,
      }}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: Colors.danger.DEFAULT + "20",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AlertTriangle size={28} color={Colors.danger.DEFAULT} />
      </View>
      <Text
        style={{
          fontSize: 16,
          fontWeight: "700",
          color: Colors.text.primary,
          textAlign: "center",
        }}
      >
        {title}
      </Text>
      {description ? (
        <Text
          style={{
            fontSize: 14,
            color: Colors.text.secondary,
            textAlign: "center",
            maxWidth: 320,
          }}
        >
          {description}
        </Text>
      ) : null}
      {onRetry ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={retryLabel}
          onPress={onRetry}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 12,
            backgroundColor: Colors.primary.DEFAULT,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <RefreshCw size={16} color="#FFF" />
          <Text style={{ color: "#FFF", fontWeight: "600", fontSize: 14 }}>
            {retryLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
