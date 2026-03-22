import React from "react";
import { Stack } from "expo-router";

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="select-role" />
      <Stack.Screen name="organizer-setup" />
      <Stack.Screen name="family-setup" />
    </Stack>
  );
}
