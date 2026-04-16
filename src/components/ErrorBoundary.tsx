import React from "react";
import { View, Text, Pressable } from "react-native";
import { createLogger } from "../lib/logger";

const log = createLogger("ErrorBoundary");

interface Props {
  children: React.ReactNode;
  fallback?: (error: Error, reset: () => void) => React.ReactNode;
  scope?: string;
}

interface State {
  error: Error | null;
}

/**
 * Top-level React error boundary. Catches render/lifecycle errors, reports to
 * Sentry if it is loaded, and shows a reload CTA.
 *
 * Does not catch: event handlers, async errors, or errors thrown inside
 * setTimeout/setInterval. Those must be wrapped manually.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    log.error(`Render error in ${this.props.scope ?? "root"}`, {
      name: error.name,
      message: error.message,
      componentStack: info.componentStack,
    });
    try {
      const Sentry = require("@sentry/react-native");
      if (Sentry && typeof Sentry.captureException === "function") {
        Sentry.captureException(error, {
          tags: { boundary: this.props.scope ?? "root" },
        });
      }
    } catch {
      // Sentry not installed in this environment — safe to ignore.
    }
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback(this.state.error, this.reset);
      return <DefaultFallback error={this.state.error} reset={this.reset} />;
    }
    return this.props.children;
  }
}

function DefaultFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        backgroundColor: "#FBF6F3",
      }}
    >
      <Text
        style={{
          fontSize: 20,
          fontWeight: "700",
          color: "#2D3436",
          marginBottom: 8,
          textAlign: "center",
        }}
      >
        Something went wrong
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: "#636E72",
          marginBottom: 24,
          textAlign: "center",
        }}
      >
        {__DEV__ ? error.message : "Please try again. The team has been notified."}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Try again"
        onPress={reset}
        style={{
          backgroundColor: "#D97758",
          paddingHorizontal: 24,
          paddingVertical: 14,
          borderRadius: 12,
        }}
      >
        <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 16 }}>
          Try again
        </Text>
      </Pressable>
    </View>
  );
}
