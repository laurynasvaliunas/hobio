import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Briefcase,
  User,
  Check,
  RefreshCw,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card } from "../../../src/components/ui";
import { useToast } from "../../../src/components/ui/Toast";
import { Colors, Shadows } from "../../../src/constants/colors";
import { useAuthStore } from "../../../src/stores/authStore";
import { usePreferences } from "../../../src/hooks/usePreferences";

interface WorkspaceOption {
  role: string;
  icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;
  title: string;
  description: string;
  color: string;
  features: string[];
}

const WORKSPACES: WorkspaceOption[] = [
  {
    role: "organizer",
    icon: Briefcase,
    title: "Coach Tools",
    description: "Manage groups, take attendance, handle billing",
    color: Colors.primary.DEFAULT,
    features: ["Roster Management", "Attendance Tracking", "Revenue Dashboard", "Announcements"],
  },
  {
    role: "participant",
    icon: User,
    title: "Participant Tools",
    description: "View schedule, track payments, see announcements",
    color: Colors.secondary.DEFAULT,
    features: ["My Schedule", "Payment History", "Group Feed", "Documents"],
  },
];

export default function SwitchRoleScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const toast = useToast();
  const { activeRole, updateActiveRole } = usePreferences(profile?.id ?? "");

  const currentActive = activeRole ?? profile?.role ?? "participant";

  const handleSwitch = async (role: string) => {
    if (role === currentActive) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      await updateActiveRole(role);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.show(`Switched to ${role === "organizer" ? "Coach" : "Participant"} mode`);
    } catch {
      toast.show("Failed to switch", "error");
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
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: "700", color: Colors.text.primary }}>
            Switch Workspace
          </Text>
        </View>
        <RefreshCw size={20} color={Colors.text.secondary} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
      >
        <Text
          style={{
            fontSize: 15,
            color: Colors.text.secondary,
            lineHeight: 22,
            marginBottom: 24,
          }}
        >
          Some users are both coaches and participants. Switch between views to see different tools and navigation.
        </Text>

        <View style={{ gap: 14 }}>
          {WORKSPACES.map((ws) => {
            const isActive = currentActive === ws.role;
            return (
              <TouchableOpacity
                key={ws.role}
                onPress={() => handleSwitch(ws.role)}
                activeOpacity={0.8}
              >
                <Card
                  style={{
                    borderWidth: 2.5,
                    borderColor: isActive ? ws.color : "transparent",
                    ...(isActive
                      ? {
                          shadowColor: ws.color,
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.15,
                          shadowRadius: 12,
                          elevation: 5,
                        }
                      : {}),
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 14 }}>
                    <View
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 16,
                        backgroundColor: isActive ? ws.color : ws.color + "15",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <ws.icon
                        size={24}
                        color={isActive ? "#FFF" : ws.color}
                        strokeWidth={2}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{ fontSize: 18, fontWeight: "700", color: Colors.text.primary }}
                      >
                        {ws.title}
                      </Text>
                      <Text style={{ fontSize: 13, color: Colors.text.secondary, marginTop: 2 }}>
                        {ws.description}
                      </Text>
                    </View>
                    {isActive && (
                      <View
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          backgroundColor: ws.color,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Check size={16} color="#FFF" strokeWidth={3} />
                      </View>
                    )}
                  </View>

                  {/* Feature tags */}
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                    {ws.features.map((feat) => (
                      <View
                        key={feat}
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderRadius: 8,
                          backgroundColor: isActive ? ws.color + "15" : Colors.border + "60",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "600",
                            color: isActive ? ws.color : Colors.text.secondary,
                          }}
                        >
                          {feat}
                        </Text>
                      </View>
                    ))}
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
