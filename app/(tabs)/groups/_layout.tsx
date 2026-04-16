import React from "react";
import { Stack } from "expo-router";
import { ErrorBoundary } from "../../../src/components/ErrorBoundary";

export default function GroupsLayout() {
  return (
    <ErrorBoundary scope="groups">
      <Stack screenOptions={{ headerShown: false }} />
    </ErrorBoundary>
  );
}
