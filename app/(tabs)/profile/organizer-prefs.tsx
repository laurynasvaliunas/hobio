import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Switch } from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Clock,
  MessageCircle,
  Mail,
  Smartphone,
  UserPlus,
  Check,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Input } from "../../../src/components/ui";
import { useToast } from "../../../src/components/ui/Toast";
import { Colors } from "../../../src/constants/colors";
import { useAuthStore } from "../../../src/stores/authStore";
import { usePreferences } from "../../../src/hooks/usePreferences";
import type { ContactMethod } from "../../../src/types/database.types";

const CONTACT_METHODS: { value: ContactMethod; label: string; icon: React.ComponentType<{ size: number; color: string }> }[] = [
  { value: "in_app", label: "In-App Messages", icon: MessageCircle },
  { value: "email", label: "Email", icon: Mail },
  { value: "phone", label: "Phone", icon: Smartphone },
];

export default function OrganizerPrefsScreen() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const toast = useToast();
  const { organizerSettings, updateOrganizerSettings } = usePreferences(profile?.id ?? "");

  const handleContactMethod = async (method: ContactMethod) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await updateOrganizerSettings({ contact_method: method });
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
          Organizer Preferences
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
      >
        {/* Business Hours */}
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
          Business Hours
        </Text>
        <Card style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: Colors.primary.light + "15",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Clock size={20} color={Colors.primary.DEFAULT} />
            </View>
            <Text style={{ fontSize: 15, color: Colors.text.secondary, flex: 1 }}>
              Set when participants can reach you
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Input
              label="Start"
              value={organizerSettings.business_hours_start}
              onChangeText={(v) => updateOrganizerSettings({ business_hours_start: v })}
              placeholder="09:00"
              containerStyle={{ flex: 1 }}
            />
            <Input
              label="End"
              value={organizerSettings.business_hours_end}
              onChangeText={(v) => updateOrganizerSettings({ business_hours_end: v })}
              placeholder="18:00"
              containerStyle={{ flex: 1 }}
            />
          </View>
        </Card>

        {/* Contact Method */}
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
          Preferred Contact Method
        </Text>
        <Card style={{ marginBottom: 20 }}>
          {CONTACT_METHODS.map((method, index) => {
            const isSelected = organizerSettings.contact_method === method.value;
            return (
              <React.Fragment key={method.value}>
                {index > 0 && (
                  <View style={{ height: 1, backgroundColor: Colors.border, marginVertical: 2 }} />
                )}
                <TouchableOpacity
                  onPress={() => handleContactMethod(method.value)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 14,
                    gap: 14,
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: isSelected
                        ? Colors.primary.DEFAULT + "15"
                        : Colors.border + "60",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <method.icon
                      size={18}
                      color={isSelected ? Colors.primary.DEFAULT : Colors.text.secondary}
                    />
                  </View>
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 16,
                      fontWeight: "500",
                      color: Colors.text.primary,
                    }}
                  >
                    {method.label}
                  </Text>
                  {isSelected && (
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        backgroundColor: Colors.primary.DEFAULT,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Check size={13} color="#FFF" strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>
              </React.Fragment>
            );
          })}
        </Card>

        {/* Auto-approve */}
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
          Membership
        </Text>
        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: Colors.secondary.DEFAULT + "15",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <UserPlus size={20} color={Colors.secondary.DEFAULT} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: "500", color: Colors.text.primary }}>
                Auto-approve Members
              </Text>
              <Text style={{ fontSize: 13, color: Colors.text.secondary, marginTop: 2 }}>
                Automatically accept join requests
              </Text>
            </View>
            <Switch
              value={organizerSettings.auto_approve_members}
              onValueChange={(v) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                updateOrganizerSettings({ auto_approve_members: v });
              }}
              trackColor={{ false: Colors.border, true: Colors.primary.DEFAULT + "60" }}
              thumbColor={organizerSettings.auto_approve_members ? Colors.primary.DEFAULT : Colors.surface}
            />
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
