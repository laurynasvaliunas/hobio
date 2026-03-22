/**
 * Test utilities — wraps components with required providers.
 * All jest.mock() calls are in jest.setup.js (runs before framework).
 */
import React from "react";
import { render, type RenderOptions } from "@testing-library/react-native";

/**
 * Wrapper with providers needed by most screens.
 */
function AllProviders({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

/**
 * Custom render that wraps component in providers.
 */
function customRender(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// Re-export everything from @testing-library/react-native
export * from "@testing-library/react-native";

// Override render
export { customRender as render };
