import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Switch } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Bell, Clock, Mail, Smartphone } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Input } from "../../../src/components/ui";
import { useToast } from "../../../src/components/ui/Toast";
import { Colors } from "../../../src/constants/colors";
import { useAuthStore } from "../../../src/stores/authStore";
import { usePreferences } from "../../../src/hooks/usePreferences";

interface ToggleRowProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}

function ToggleRow({ icon, title, subtitle, value, onToggle }: ToggleRowProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        gap: 14,
      }}
    >
      {icon && (
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: Colors.primary.light + "15",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: "500", color: Colors.text.primary }}>
          {title}
        </Text>
        {subtitle && (
          <Text style={{ fontSize: 13, color: Colors.text.secondary, marginTop: 2 }}>
            {subtitle}
          </Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={(v) => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onToggle(v);
        }}
        trackColor={{ false: Colors.border, true: Colors.primary.DEFAULT + "60" }}
        thumbColor={value ? Colors.primary.DEFAULT : Colors.surface}
      />
    </View>
  );
}

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const toast = useToast();
  const { notifications, updateNotifications } = usePreferences(profile?.id ?? "");

  const handleToggle = async (
    key: keyof typeof notifications,
    value: boolean
  ) => {
    try {
      await updateNotifications({ [key]: value });
      toast.show("Preference saved");
    } catch {
      toast.show("Failed to save", "error");
    }
  };

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
        <Text style={{ fontSize: 20, fontWeight: "700", color: Colors.text.primary }}>
          Notifications
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
      >
        {/* Alert Types */}
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
          Alert Types
        </Text>
        <Card style={{ marginBottom: 20 }}>
          <ToggleRow
            icon={<Bell size={18} color={Colors.primary.DEFAULT} />}
            title="Session Reminders"
            subtitle="Get notified before scheduled sessions"
            value={notifications.session_reminders}
            onToggle={(v) => handleToggle("session_reminders", v)}
          />
          <View style={{ height: 1, backgroundColor: Colors.border, marginVertical: 2 }} />
          <ToggleRow
            icon={<Bell size={18} color={Colors.warning.dark} />}
            title="Billing Alerts"
            subtitle="Invoices, payment due dates"
            value={notifications.billing_alerts}
            onToggle={(v) => handleToggle("billing_alerts", v)}
          />
          <View style={{ height: 1, backgroundColor: Colors.border, marginVertical: 2 }} />
          <ToggleRow
            icon={<Bell size={18} color={Colors.secondary.DEFAULT} />}
            title="Coach Announcements"
            subtitle="Group announcements and updates"
            value={notifications.announcements}
            onToggle={(v) => handleToggle("announcements", v)}
          />
        </Card>

        {/* Channels */}
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
          Channels
        </Text>
        <Card style={{ marginBottom: 20 }}>
          <ToggleRow
            icon={<Mail size={18} color={Colors.primary.DEFAULT} />}
            title="Email Notifications"
            subtitle="Receive alerts via email"
            value={notifications.email_notifications}
            onToggle={(v) => handleToggle("email_notifications", v)}
          />
          <View style={{ height: 1, backgroundColor: Colors.border, marginVertical: 2 }} />
          <ToggleRow
            icon={<Smartphone size={18} color={Colors.primary.DEFAULT} />}
            title="Push Notifications"
            subtitle="Receive alerts on your device"
            value={notifications.push_notifications}
            onToggle={(v) => handleToggle("push_notifications", v)}
          />
        </Card>

        {/* Quiet Hours */}
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
          Quiet Hours
        </Text>
        <Card>
          <ToggleRow
            icon={<Clock size={18} color={Colors.text.secondary} />}
            title="Quiet Hours"
            subtitle="Mute notifications during set times"
            value={notifications.quiet_hours_enabled}
            onToggle={(v) => handleToggle("quiet_hours_enabled", v)}
          />
          {notifications.quiet_hours_enabled && (
            <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
              <Input
                label="From"
                value={notifications.quiet_hours_start}
                onChangeText={(v) => updateNotifications({ quiet_hours_start: v })}
                placeholder="22:00"
                containerStyle={{ flex: 1 }}
              />
              <Input
                label="To"
                value={notifications.quiet_hours_end}
                onChangeText={(v) => updateNotifications({ quiet_hours_end: v })}
                placeholder="07:00"
                containerStyle={{ flex: 1 }}
              />
            </View>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
