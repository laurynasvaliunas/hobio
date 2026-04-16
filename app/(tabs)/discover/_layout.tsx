import React from "react";
import { Stack } from "expo-router";
import { ErrorBoundary } from "../../../src/components/ErrorBoundary";

export default function DiscoverLayout() {
  return (
    <ErrorBoundary scope="discover">
      <Stack screenOptions={{ headerShown: false }} />
    </ErrorBoundary>
  );
}
