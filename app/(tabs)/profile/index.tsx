import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import {
  Settings,
  LogOut,
  ChevronRight,
  Building2,
  Baby,
  Shield,
  HelpCircle,
  RefreshCw,
} from "lucide-react-native";
import { ScreenWrapper, Card, Avatar, Badge } from "../../../src/components/ui";
import { useTheme } from "../../../src/hooks/useTheme";
import { Fonts } from "../../../src/constants/fonts";
import { useAuthStore } from "../../../src/stores/authStore";
import { useChildren } from "../../../src/hooks/useChildren";
import { usePreferences } from "../../../src/hooks/usePreferences";

interface MenuItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress: () => void;
  danger?: boolean;
  rightElement?: React.ReactNode;
  iconBg?: string;
}

function MenuItem({ icon, title, subtitle, onPress, danger, rightElement, iconBg }: MenuItemProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.6}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        gap: 14,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          backgroundColor: iconBg ?? (danger
            ? colors.danger.DEFAULT + "15"
            : colors.primary.light + "15"),
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 16,
            fontFamily: Fonts.medium,
            color: danger ? colors.danger.DEFAULT : colors.text.primary,
          }}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={{
              fontSize: 13,
              fontFamily: Fonts.regular,
              color: colors.text.secondary,
              marginTop: 1,
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement ?? (!danger && <ChevronRight size={18} color={colors.text.secondary} />)}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { profile, signOut } = useAuthStore();
  const router = useRouter();

  const isParent = profile?.role === "parent";
  const isOrganizer = profile?.role === "organizer";
  const { children } = useChildren(isParent ? profile?.id ?? "" : "");
  const { activeRole } = usePreferences(profile?.id ?? "");

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
          } catch {
            Alert.alert("Error", "Failed to sign out. Please try again.");
          }
        },
      },
    ]);
  };

  const roleLabel =
    profile?.role === "organizer"
      ? "Organizer"
      : profile?.role === "parent"
      ? "Parent"
      : "Participant";

  const activeWorkspace = activeRole
    ? activeRole === "organizer" ? "Coach Mode" : "Participant Mode"
    : null;


  return (
    <ScreenWrapper>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40, paddingTop: 8 }}
      >
        {/* Header */}
        <Text
          style={{
            fontSize: 26,
            fontFamily: Fonts.extraBold,
            color: colors.text.primary,
            marginBottom: 24,
          }}
        >
          Profile
        </Text>

        {/* Profile card */}
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/profile/account" as never)}
          activeOpacity={0.7}
        >
          <Card style={{ marginBottom: 20, alignItems: "center", paddingVertical: 28 }}>
            <Avatar
              name={profile?.full_name ?? "User"}
              imageUrl={profile?.avatar_url}
              size={80}
            />
            <Text
              style={{
                fontSize: 22,
                fontFamily: Fonts.bold,
                color: colors.text.primary,
                marginTop: 14,
              }}
            >
              {profile?.full_name}
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontFamily: Fonts.regular,
                color: colors.text.secondary,
                marginTop: 4,
              }}
            >
              {profile?.email}
            </Text>
            <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
              <Badge label={roleLabel} variant="primary" size="md" />
              {activeWorkspace && (
                <Badge label={activeWorkspace} variant="secondary" size="md" />
              )}
            </View>
            <Text
              style={{
                fontSize: 13,
                color: colors.primary.DEFAULT,
                fontFamily: Fonts.semiBold,
                marginTop: 10,
              }}
            >
              Tap to edit profile
            </Text>
          </Card>
        </TouchableOpacity>


        {/* Children quick view */}
        {isParent && children.length > 0 && (
          <Card style={{ marginBottom: 16 }}>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/profile/family" as never)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Baby size={18} color={colors.accent.DEFAULT} />
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: Fonts.bold,
                    color: colors.text.primary,
                  }}
                >
                  My Children ({children.length})
                </Text>
              </View>
              <ChevronRight size={18} color={colors.text.secondary} />
            </TouchableOpacity>
          </Card>
        )}

        {/* Quick actions */}
        <Card style={{ marginBottom: 16 }}>
          <MenuItem
            icon={<Settings size={20} color={colors.primary.DEFAULT} />}
            title="Settings"
            subtitle="Account, notifications, security, theme"
            onPress={() => router.push("/(tabs)/profile/settings" as never)}
          />
          {isOrganizer && (
            <MenuItem
              icon={<Building2 size={20} color={colors.secondary.DEFAULT} />}
              iconBg={colors.secondary.DEFAULT + "15"}
              title="My Organizations"
              subtitle="Manage your clubs and studios"
              onPress={() => router.push("/(tabs)/groups" as never)}
            />
          )}
          {(isOrganizer || isParent) && (
            <MenuItem
              icon={<RefreshCw size={20} color={colors.primary.DEFAULT} />}
              title="Switch Workspace"
              subtitle={activeWorkspace ?? "Toggle Coach / Participant view"}
              onPress={() => router.push("/(tabs)/profile/switch-role" as never)}
            />
          )}
          <MenuItem
            icon={<Shield size={20} color={colors.primary.DEFAULT} />}
            title="Privacy & Data"
            subtitle="Download data, manage account"
            onPress={() => router.push("/(tabs)/profile/data-export" as never)}
          />
          <MenuItem
            icon={<HelpCircle size={20} color={colors.primary.DEFAULT} />}
            title="Help & Support"
            subtitle="FAQ, contact us"
            onPress={() => {}}
          />
        </Card>

        <Card>
          <MenuItem
            icon={<LogOut size={20} color={colors.danger.DEFAULT} />}
            title="Sign Out"
            onPress={handleSignOut}
            danger
          />
        </Card>

        <Text
          style={{
            textAlign: "center",
            fontSize: 12,
            fontFamily: Fonts.regular,
            color: colors.text.secondary,
            marginTop: 24,
          }}
        >
          Hobio v1.0.0
        </Text>
      </ScrollView>
    </ScreenWrapper>
  );
}
