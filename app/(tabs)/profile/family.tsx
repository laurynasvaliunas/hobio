import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Baby, Plus, Trash2, ChevronRight, Calendar } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Avatar, Badge, Button, EmptyState } from "../../../src/components/ui";
import { useToast } from "../../../src/components/ui/Toast";
import { Colors } from "../../../src/constants/colors";
import { useAuthStore } from "../../../src/stores/authStore";
import { useChildren } from "../../../src/hooks/useChildren";

export default function FamilySettingsScreen() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const toast = useToast();
  const { children, removeChild } = useChildren(profile?.id ?? "");

  const handleRemove = (childId: string, name: string) => {
    Alert.alert(
      "Remove Child",
      `Are you sure you want to remove "${name}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await removeChild(childId);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              toast.show(`${name} removed`);
            } catch {
              toast.show("Failed to remove", "error");
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={["top"]}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          paddingVertical: 14,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: "700", color: Colors.text.primary }}>
            Family & Dependents
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/modals/add-child")}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: Colors.primary.DEFAULT,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Plus size={18} color="#FFF" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
      >
        {children.length === 0 ? (
          <View style={{ paddingTop: 40 }}>
            <EmptyState
              icon={<Baby size={48} color={Colors.accent.DEFAULT} strokeWidth={1.5} />}
              title="No children added"
              description="Add your children to manage their schedules, attendance, and payments."
            />
            <Button
              title="Add Your First Child"
              onPress={() => router.push("/modals/add-child")}
              style={{ marginTop: 20 }}
            />
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {children.map((child) => (
              <Card key={child.id}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                  <Avatar name={child.full_name} imageUrl={child.avatar_url} size={52} />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{ fontSize: 17, fontWeight: "600", color: Colors.text.primary }}
                    >
                      {child.full_name}
                    </Text>
                    <View
                      style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}
                    >
                      <Calendar size={12} color={Colors.text.secondary} />
                      <Text style={{ fontSize: 13, color: Colors.text.secondary }}>
                        Born: {child.date_of_birth}
                      </Text>
                    </View>
                    {child.medical_notes && (
                      <Text
                        style={{ fontSize: 12, color: Colors.text.secondary, marginTop: 2 }}
                        numberOfLines={1}
                      >
                        Notes: {child.medical_notes}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemove(child.id, child.full_name)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      backgroundColor: Colors.danger.DEFAULT + "15",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Trash2 size={16} color={Colors.danger.DEFAULT} />
                  </TouchableOpacity>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
