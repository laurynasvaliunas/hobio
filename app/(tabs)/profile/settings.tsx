import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  User,
  Bell,
  Shield,
  Palette,
  Baby,
  Building2,
  Download,
  Trash2,
  RefreshCw,
  ChevronRight,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card } from "../../../src/components/ui";
import { Colors, Shadows } from "../../../src/constants/colors";
import { useAuthStore } from "../../../src/stores/authStore";

interface SettingsItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
  danger?: boolean;
  iconBg?: string;
}

function SettingsItem({ icon, title, subtitle, onPress, danger, iconBg }: SettingsItemProps) {
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
          width: 42,
          height: 42,
          borderRadius: 12,
          backgroundColor: iconBg ?? (danger ? Colors.danger.DEFAULT + "15" : Colors.primary.light + "15"),
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
            fontWeight: "600",
            color: danger ? Colors.danger.DEFAULT : Colors.text.primary,
          }}
        >
          {title}
        </Text>
        <Text style={{ fontSize: 13, color: Colors.text.secondary, marginTop: 2 }}>
          {subtitle}
        </Text>
      </View>
      <ChevronRight size={18} color={Colors.text.secondary} />
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const isOrganizer = profile?.role === "organizer";
  const isParent = profile?.role === "parent";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={["top"]}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingVertical: 14,
          gap: 14,
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: "700", color: Colors.text.primary }}>
          Settings
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
      >
        {/* Identity Section */}
        <Text
          style={{
            fontSize: 13,
            fontWeight: "600",
            color: Colors.text.secondary,
            textTransform: "uppercase",
            letterSpacing: 0.8,
            marginBottom: 8,
            marginTop: 4,
            marginLeft: 4,
          }}
        >
          Identity
        </Text>
        <Card style={{ marginBottom: 20 }}>
          <SettingsItem
            icon={<User size={20} color={Colors.primary.DEFAULT} />}
            title="Account"
            subtitle="Name, email, profile picture, password"
            onPress={() => router.push("/(tabs)/profile/account" as never)}
          />
          {(isParent) && (
            <SettingsItem
              icon={<Baby size={20} color={Colors.accent.DEFAULT} />}
              iconBg={Colors.accent.DEFAULT + "15"}
              title="Family & Dependents"
              subtitle="Manage your children's profiles"
              onPress={() => router.push("/(tabs)/profile/family" as never)}
            />
          )}
          {isOrganizer && (
            <SettingsItem
              icon={<Building2 size={20} color={Colors.secondary.DEFAULT} />}
              iconBg={Colors.secondary.DEFAULT + "15"}
              title="Organizer Preferences"
              subtitle="Business hours, contact method"
              onPress={() => router.push("/(tabs)/profile/organizer-prefs" as never)}
            />
          )}
        </Card>

        {/* Alerts Section */}
        <Text
          style={{
            fontSize: 13,
            fontWeight: "600",
            color: Colors.text.secondary,
            textTransform: "uppercase",
            letterSpacing: 0.8,
            marginBottom: 8,
            marginLeft: 4,
          }}
        >
          Alerts
        </Text>
        <Card style={{ marginBottom: 20 }}>
          <SettingsItem
            icon={<Bell size={20} color={Colors.warning.dark} />}
            iconBg={Colors.warning.DEFAULT + "20"}
            title="Notifications"
            subtitle="Reminders, billing, quiet hours"
            onPress={() => router.push("/(tabs)/profile/notifications" as never)}
          />
        </Card>

        {/* Security Section */}
        <Text
          style={{
            fontSize: 13,
            fontWeight: "600",
            color: Colors.text.secondary,
            textTransform: "uppercase",
            letterSpacing: 0.8,
            marginBottom: 8,
            marginLeft: 4,
          }}
        >
          Security
        </Text>
        <Card style={{ marginBottom: 20 }}>
          <SettingsItem
            icon={<Shield size={20} color={Colors.primary.DEFAULT} />}
            title="Security"
            subtitle="Biometric lock, sign out all devices"
            onPress={() => router.push("/(tabs)/profile/security" as never)}
          />
          <SettingsItem
            icon={<Palette size={20} color={Colors.accent.DEFAULT} />}
            iconBg={Colors.accent.DEFAULT + "15"}
            title="Appearance"
            subtitle="Light, dark, or system theme"
            onPress={() => router.push("/(tabs)/profile/appearance" as never)}
          />
        </Card>

        {/* Role switcher */}
        {(isOrganizer || isParent) && (
          <>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: Colors.text.secondary,
                textTransform: "uppercase",
                letterSpacing: 0.8,
                marginBottom: 8,
                marginLeft: 4,
              }}
            >
              Workspace
            </Text>
            <Card style={{ marginBottom: 20 }}>
              <SettingsItem
                icon={<RefreshCw size={20} color={Colors.secondary.DEFAULT} />}
                iconBg={Colors.secondary.DEFAULT + "15"}
                title="Switch Workspace"
                subtitle="Toggle between Coach and Participant tools"
                onPress={() => router.push("/(tabs)/profile/switch-role" as never)}
              />
            </Card>
          </>
        )}

        {/* Data & Privacy Section */}
        <Text
          style={{
            fontSize: 13,
            fontWeight: "600",
            color: Colors.text.secondary,
            textTransform: "uppercase",
            letterSpacing: 0.8,
            marginBottom: 8,
            marginLeft: 4,
          }}
        >
          Data & Privacy
        </Text>
        <Card>
          <SettingsItem
            icon={<Download size={20} color={Colors.primary.DEFAULT} />}
            title="Download My Data"
            subtitle="Export schedules, payments as JSON"
            onPress={() => router.push("/(tabs)/profile/data-export" as never)}
          />
          <SettingsItem
            icon={<Trash2 size={20} color={Colors.danger.DEFAULT} />}
            title="Delete Account"
            subtitle="Permanently remove all your data"
            onPress={() => router.push("/(tabs)/profile/delete-account" as never)}
            danger
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
