import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Switch } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Bell, Clock, Mail, Smartphone } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);
  const toast = useToast();
  const { notifications, updateNotifications } = usePreferences(profile?.id ?? "");

  const handleToggle = async (
    key: keyof typeof notifications,
    value: boolean
  ) => {
    try {
      await updateNotifications({ [key]: value });
      toast.show(t("profile.prefSaved"));
    } catch {
      toast.show(t("profile.saveFailed"), "error");
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
          {t("profile.notificationsScreen")}
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
          {t("profile.alertTypes")}
        </Text>
        <Card style={{ marginBottom: 20 }}>
          <ToggleRow
            icon={<Bell size={18} color={Colors.primary.DEFAULT} />}
            title={t("profile.sessionReminders")}
            subtitle={t("profile.sessionRemindersSub")}
            value={notifications.session_reminders}
            onToggle={(v) => handleToggle("session_reminders", v)}
          />
          <View style={{ height: 1, backgroundColor: Colors.border, marginVertical: 2 }} />
          <ToggleRow
            icon={<Bell size={18} color={Colors.warning.dark} />}
            title={t("profile.billingAlerts")}
            subtitle={t("profile.billingAlertsSub")}
            value={notifications.billing_alerts}
            onToggle={(v) => handleToggle("billing_alerts", v)}
          />
          <View style={{ height: 1, backgroundColor: Colors.border, marginVertical: 2 }} />
          <ToggleRow
            icon={<Bell size={18} color={Colors.secondary.DEFAULT} />}
            title={t("profile.coachAnnouncements")}
            subtitle={t("profile.coachAnnouncementsSub")}
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
          {t("profile.channels")}
        </Text>
        <Card style={{ marginBottom: 20 }}>
          <ToggleRow
            icon={<Mail size={18} color={Colors.primary.DEFAULT} />}
            title={t("profile.emailNotifications")}
            subtitle={t("profile.emailNotificationsSub")}
            value={notifications.email_notifications}
            onToggle={(v) => handleToggle("email_notifications", v)}
          />
          <View style={{ height: 1, backgroundColor: Colors.border, marginVertical: 2 }} />
          <ToggleRow
            icon={<Smartphone size={18} color={Colors.primary.DEFAULT} />}
            title={t("profile.pushNotifications")}
            subtitle={t("profile.pushNotificationsSub")}
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
          {t("profile.quietHours")}
        </Text>
        <Card>
          <ToggleRow
            icon={<Clock size={18} color={Colors.text.secondary} />}
            title={t("profile.quietHours")}
            subtitle={t("profile.quietHoursSub")}
            value={notifications.quiet_hours_enabled}
            onToggle={(v) => handleToggle("quiet_hours_enabled", v)}
          />
          {notifications.quiet_hours_enabled && (
            <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
              <Input
                label={t("profile.from")}
                value={notifications.quiet_hours_start}
                onChangeText={(v) => updateNotifications({ quiet_hours_start: v })}
                placeholder="22:00"
                containerStyle={{ flex: 1 }}
              />
              <Input
                label={t("profile.to")}
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
