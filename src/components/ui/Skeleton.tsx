import React, { useEffect, useRef } from "react";
import { View, Animated, type ViewStyle } from "react-native";
import { Colors } from "../../constants/colors";

interface Props {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  /** "blue" | "orange" | "green" | "neutral" */
  tint?: "blue" | "orange" | "green" | "neutral";
}

const TINT_COLORS = {
  blue: Colors.primary.light + "25",
  orange: Colors.accent.light + "30",
  green: Colors.secondary.light + "25",
  neutral: Colors.border,
} as const;

/**
 * Pulsing skeleton with brand-colored tints for a playful loading experience.
 */
export function Skeleton({
  width = "100%",
  height = 16,
  borderRadius = 10,
  style,
  tint = "blue",
}: Props) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.9,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width: width as number,
          height,
          borderRadius,
          backgroundColor: TINT_COLORS[tint],
          opacity,
        },
        style,
      ]}
    />
  );
}

/**
 * Card-shaped skeleton wrapper to match real Card component shapes.
 */
function SkeletonCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View
      style={[
        {
          backgroundColor: Colors.surface,
          borderRadius: 24,
          padding: 16,
          shadowColor: Colors.primary.DEFAULT,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 2,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/**
 * Matches the Home screen layout: greeting + avatar, quick actions,
 * announcements, today's schedule cards, my groups cards, quick stats.
 */
export function HomeScreenSkeleton() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors.background,
        paddingHorizontal: 20,
        paddingTop: 60,
      }}
    >
      {/* Greeting + avatar */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 28,
        }}
      >
        <View style={{ gap: 8 }}>
          <Skeleton width={100} height={14} tint="neutral" />
          <Skeleton width={160} height={28} borderRadius={6} tint="blue" />
        </View>
        <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
          <Skeleton width={24} height={24} borderRadius={12} tint="orange" />
          <Skeleton width={48} height={48} borderRadius={24} tint="blue" />
        </View>
      </View>

      {/* Quick actions */}
      <View style={{ flexDirection: "row", gap: 12, marginBottom: 28 }}>
        <SkeletonCard style={{ flex: 1, alignItems: "center", paddingVertical: 20 }}>
          <Skeleton width={24} height={24} borderRadius={12} tint="blue" />
          <Skeleton width={60} height={12} style={{ marginTop: 8 }} tint="neutral" />
        </SkeletonCard>
        <SkeletonCard style={{ flex: 1, alignItems: "center", paddingVertical: 20 }}>
          <Skeleton width={24} height={24} borderRadius={12} tint="orange" />
          <Skeleton width={60} height={12} style={{ marginTop: 8 }} tint="neutral" />
        </SkeletonCard>
      </View>

      {/* Section: Today's Schedule */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <Skeleton width={140} height={20} tint="blue" />
        <Skeleton width={50} height={16} tint="neutral" />
      </View>

      {/* Session cards */}
      {[1, 2].map((i) => (
        <SkeletonCard key={`sched-${i}`} style={{ marginBottom: 10 }}>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Skeleton width={4} height={44} borderRadius={2} tint="green" />
            <View style={{ flex: 1, gap: 6 }}>
              <Skeleton width="70%" height={16} tint="blue" />
              <View style={{ flexDirection: "row", gap: 6 }}>
                <Skeleton width={13} height={13} borderRadius={7} tint="orange" />
                <Skeleton width={100} height={13} tint="neutral" />
              </View>
            </View>
          </View>
        </SkeletonCard>
      ))}

      {/* Section: My Groups */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 14,
          marginTop: 18,
        }}
      >
        <Skeleton width={100} height={20} tint="green" />
        <Skeleton width={50} height={16} tint="neutral" />
      </View>

      {/* Group cards */}
      {[1, 2].map((i) => (
        <SkeletonCard key={`group-${i}`} style={{ marginBottom: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <Skeleton width={44} height={44} borderRadius={14} tint="blue" />
            <View style={{ flex: 1, gap: 4 }}>
              <Skeleton width="60%" height={16} tint="blue" />
              <Skeleton width="40%" height={12} tint="neutral" />
            </View>
            <Skeleton width={20} height={20} borderRadius={10} tint="orange" />
          </View>
        </SkeletonCard>
      ))}
    </View>
  );
}

/**
 * Matches the Schedule screen layout.
 */
export function ScheduleSkeleton() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors.background,
        paddingHorizontal: 20,
        paddingTop: 60,
      }}
    >
      <Skeleton width={120} height={28} style={{ marginBottom: 24 }} tint="blue" />

      <SkeletonCard style={{ marginBottom: 20 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Skeleton width={24} height={24} borderRadius={12} tint="neutral" />
          <Skeleton width={140} height={18} tint="blue" />
          <Skeleton width={24} height={24} borderRadius={12} tint="neutral" />
        </View>
        <View style={{ flexDirection: "row", marginBottom: 8 }}>
          {Array.from({ length: 7 }).map((_, i) => (
            <View key={i} style={{ flex: 1, alignItems: "center" }}>
              <Skeleton width={24} height={12} tint="neutral" />
            </View>
          ))}
        </View>
        {Array.from({ length: 5 }).map((_, row) => (
          <View key={row} style={{ flexDirection: "row", marginBottom: 4 }}>
            {Array.from({ length: 7 }).map((_, col) => (
              <View
                key={col}
                style={{
                  flex: 1,
                  height: 40,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Skeleton width={28} height={28} borderRadius={14} tint={(row + col) % 3 === 0 ? "orange" : "blue"} />
              </View>
            ))}
          </View>
        ))}
      </SkeletonCard>

      <Skeleton width={160} height={18} style={{ marginBottom: 14 }} tint="neutral" />

      {[1, 2, 3].map((i) => (
        <SkeletonCard key={i} style={{ marginBottom: 10 }}>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Skeleton width={4} height={44} borderRadius={2} tint="green" />
            <View style={{ flex: 1, gap: 6 }}>
              <Skeleton width="65%" height={16} tint="blue" />
              <Skeleton width={120} height={13} tint="neutral" />
            </View>
          </View>
        </SkeletonCard>
      ))}
    </View>
  );
}

/**
 * Matches the Members/Roster screen layout.
 */
export function RosterSkeleton() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors.background,
        paddingHorizontal: 20,
        paddingTop: 60,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
          marginBottom: 20,
        }}
      >
        <Skeleton width={24} height={24} borderRadius={12} tint="neutral" />
        <View style={{ flex: 1, gap: 4 }}>
          <Skeleton width={100} height={20} tint="blue" />
          <Skeleton width={140} height={13} tint="neutral" />
        </View>
      </View>

      <Skeleton width={180} height={14} style={{ marginBottom: 12 }} tint="neutral" />

      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonCard key={i} style={{ marginBottom: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <Skeleton width={44} height={44} borderRadius={22} tint={i % 2 === 0 ? "blue" : "green"} />
            <View style={{ flex: 1, gap: 4 }}>
              <Skeleton width="55%" height={16} tint="blue" />
              <Skeleton width="40%" height={12} tint="neutral" />
            </View>
            <Skeleton width={60} height={24} borderRadius={12} tint="orange" />
          </View>
        </SkeletonCard>
      ))}
    </View>
  );
}
