import React from "react";
import { Stack } from "expo-router";
import { ErrorBoundary } from "../../../src/components/ErrorBoundary";

export default function NotificationsLayout() {
  return (
    <ErrorBoundary scope="notifications">
      <Stack screenOptions={{ headerShown: false }} />
    </ErrorBoundary>
  );
}
