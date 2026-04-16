import React from "react";
import { Stack } from "expo-router";
import { ErrorBoundary } from "../../../src/components/ErrorBoundary";

export default function HomeLayout() {
  return (
    <ErrorBoundary scope="home">
      <Stack screenOptions={{ headerShown: false }} />
    </ErrorBoundary>
  );
}
