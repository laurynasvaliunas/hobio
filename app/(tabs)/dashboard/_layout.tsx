import { Stack } from "expo-router";
import { ErrorBoundary } from "../../../src/components/ErrorBoundary";

export default function DashboardLayout() {
  return (
    <ErrorBoundary scope="dashboard">
      <Stack screenOptions={{ headerShown: false }} />
    </ErrorBoundary>
  );
}
