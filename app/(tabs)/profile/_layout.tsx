import React from "react";
import { Stack } from "expo-router";
import { ErrorBoundary } from "../../../src/components/ErrorBoundary";

export default function ProfileLayout() {
  return (
    <ErrorBoundary scope="profile">
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      >
      <Stack.Screen name="index" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="account" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="security" />
      <Stack.Screen name="appearance" />
      <Stack.Screen name="family" />
      <Stack.Screen name="switch-role" />
      <Stack.Screen name="organizer-prefs" />
      <Stack.Screen name="data-export" />
      <Stack.Screen name="delete-account" />
      <Stack.Screen name="emergency-contact" />
    </Stack>
  );
}
