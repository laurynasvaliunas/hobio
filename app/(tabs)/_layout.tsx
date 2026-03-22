import React, { useEffect, useRef } from "react";
import { Tabs, useRouter } from "expo-router";
import { Animated, View } from "react-native";
import {
  Compass,
  Calendar,
  Users,
  User,
  LayoutDashboard,
} from "lucide-react-native";
import { useTheme } from "../../src/hooks/useTheme";
import { Fonts } from "../../src/constants/fonts";
import { useAuthStore } from "../../src/stores/authStore";
import { useNotificationStore } from "../../src/stores/notificationStore";

/**
 * Animated tab icon that "bounces" when it becomes active.
 */
function BouncyTabIcon({
  IconComp,
  color,
  size,
  focused,
}: {
  IconComp: React.ComponentType<{ size: number; color: string; strokeWidth: number }>;
  color: string;
  size: number;
  focused: boolean;
}) {
  const bounceAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (focused) {
      Animated.sequence([
        Animated.spring(bounceAnim, {
          toValue: 1.25,
          tension: 300,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.spring(bounceAnim, {
          toValue: 1,
          tension: 200,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      bounceAnim.setValue(1);
    }
  }, [focused]);

  return (
    <Animated.View style={{ transform: [{ scale: bounceAnim }] }}>
      <IconComp size={size} color={color} strokeWidth={focused ? 2.5 : 2} />
    </Animated.View>
  );
}

/**
 * RBAC Tab Layout — "Two Apps in One"
 *
 * Organizer sees:  Dashboard, Groups, Schedule, Settings
 * Participant/Parent sees:  Home, Discover, Schedule, My Hobbies, Settings
 */
export default function TabsLayout() {
  const { colors, shadows } = useTheme();
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const session = useAuthStore((s) => s.session);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);

  const isOrganizer = profile?.role === "organizer";

  // Guard: redirect to auth if session is lost (e.g. token expires, sign-out)
  useEffect(() => {
    if (!session) {
      router.replace("/(auth)/welcome");
    }
  }, [session]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary.DEFAULT,
        tabBarInactiveTintColor: colors.text.secondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 0,
          height: 88,
          paddingTop: 8,
          paddingBottom: 28,
          ...shadows.tabBar,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: Fonts.semiBold,
          marginTop: 2,
        },
      }}
    >
      {/* ── Organizer: Studio Dashboard (replaces Home) ── */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          href: isOrganizer ? undefined : null,
          tabBarIcon: ({ color, size, focused }) => (
            <BouncyTabIcon
              IconComp={LayoutDashboard}
              color={color}
              size={size}
              focused={focused}
            />
          ),
        }}
      />

      {/* ── Participant/Parent: Home ── */}
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          href: isOrganizer ? null : undefined,
          tabBarIcon: ({ color, size, focused }) => (
            <BouncyTabIcon
              IconComp={({ size: s, color: c, strokeWidth }) => {
                const LucideHome = require("lucide-react-native").Home;
                return <LucideHome size={s} color={c} strokeWidth={strokeWidth} />;
              }}
              color={color}
              size={size}
              focused={focused}
            />
          ),
        }}
      />

      {/* ── Participant/Parent: Discover (Map) ── */}
      <Tabs.Screen
        name="discover"
        options={{
          title: "Discover",
          href: isOrganizer ? null : undefined,
          tabBarIcon: ({ color, size, focused }) => (
            <BouncyTabIcon
              IconComp={Compass}
              color={color}
              size={size}
              focused={focused}
            />
          ),
        }}
      />

      {/* ── Shared: Schedule ── */}
      <Tabs.Screen
        name="schedule"
        options={{
          title: "Schedule",
          tabBarIcon: ({ color, size, focused }) => (
            <BouncyTabIcon
              IconComp={Calendar}
              color={color}
              size={size}
              focused={focused}
            />
          ),
        }}
      />

      {/* ── Groups (Organizer: "Groups", Participant: "My Hobbies") ── */}
      <Tabs.Screen
        name="groups"
        options={{
          title: isOrganizer ? "Groups" : "My Hobbies",
          tabBarIcon: ({ color, size, focused }) => (
            <BouncyTabIcon
              IconComp={Users}
              color={color}
              size={size}
              focused={focused}
            />
          ),
        }}
      />

      {/* ── Settings ── */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size, focused }) => (
            <BouncyTabIcon
              IconComp={User}
              color={color}
              size={size}
              focused={focused}
            />
          ),
        }}
      />

      {/* Hidden screens — accessible via navigation only */}
      <Tabs.Screen name="notifications" options={{ href: null }} />
    </Tabs>
  );
}
