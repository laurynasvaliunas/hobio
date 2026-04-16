import React from "react";
import { Stack } from "expo-router";
import { ErrorBoundary } from "../../../src/components/ErrorBoundary";

export default function ScheduleLayout() {
  return (
    <ErrorBoundary scope="schedule">
      <Stack screenOptions={{ headerShown: false }} />
    </ErrorBoundary>
  );
}
