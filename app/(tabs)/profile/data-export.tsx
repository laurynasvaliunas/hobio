import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Download, FileJson, FileText, Check } from "lucide-react-native";
import * as LegacyFileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as Haptics from "expo-haptics";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Button } from "../../../src/components/ui";
import { useToast } from "../../../src/components/ui/Toast";
import { Colors } from "../../../src/constants/colors";
import { useAuthStore } from "../../../src/stores/authStore";
import { supabase } from "../../../src/lib/supabase";

export default function DataExportScreen() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const toast = useToast();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!profile) return;
    setExporting(true);
    try {
      // Fetch all user data
      const [
        { data: profileData },
        { data: children },
        { data: memberships },
        { data: invoices },
        { data: contracts },
        { data: notifications },
      ] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", profile.id).single(),
        supabase.from("children").select("*").eq("parent_id", profile.id),
        supabase.from("group_members").select("*, groups(*)").eq("profile_id", profile.id),
        supabase.from("invoices").select("*").eq("profile_id", profile.id),
        supabase.from("contracts").select("*").or(`signed_by.eq.${profile.id}`),
        supabase.from("notifications").select("*").eq("recipient_id", profile.id).order("created_at", { ascending: false }).limit(100),
      ]);

      const exportData = {
        exported_at: new Date().toISOString(),
        profile: profileData,
        children: children ?? [],
        memberships: memberships ?? [],
        invoices: invoices ?? [],
        contracts: contracts ?? [],
        recent_notifications: notifications ?? [],
      };

      const json = JSON.stringify(exportData, null, 2);
      const filePath = `${LegacyFileSystem.cacheDirectory}hobio-data-export.json`;
      await LegacyFileSystem.writeAsStringAsync(filePath, json);

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(filePath, {
          mimeType: "application/json",
          dialogTitle: "Your Hobio Data",
        });
      } else {
        Alert.alert("Export Complete", "Your data has been saved to the app's documents folder.");
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.show("Data exported!");
    } catch (err) {
      console.error("Export error:", err);
      toast.show("Export failed", "error");
    } finally {
      setExporting(false);
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
          Download My Data
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
      >
        <Card style={{ alignItems: "center", paddingVertical: 28, marginBottom: 24 }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 22,
              backgroundColor: Colors.primary.light + "20",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <FileJson size={36} color={Colors.primary.DEFAULT} />
          </View>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: Colors.text.primary,
              marginBottom: 8,
            }}
          >
            Your Data, Your Way
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: Colors.text.secondary,
              textAlign: "center",
              lineHeight: 20,
              paddingHorizontal: 16,
            }}
          >
            Download a full export of your Hobio data as a JSON file. Includes your profile, memberships, invoices, and more.
          </Text>
        </Card>

        {/* What's included */}
        <Text
          style={{
            fontSize: 13,
            fontWeight: "600",
            color: Colors.text.secondary,
            textTransform: "uppercase",
            letterSpacing: 0.8,
            marginBottom: 10,
            marginLeft: 4,
          }}
        >
          What's Included
        </Text>
        <Card style={{ marginBottom: 24 }}>
          {[
            "Profile & contact information",
            "Children profiles (if parent)",
            "Group memberships",
            "Invoices & payment history",
            "Contracts & signed documents",
            "Recent notifications",
          ].map((item, i) => (
            <View
              key={i}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                paddingVertical: 8,
              }}
            >
              <Check size={16} color={Colors.secondary.DEFAULT} strokeWidth={2.5} />
              <Text style={{ fontSize: 15, color: Colors.text.primary }}>{item}</Text>
            </View>
          ))}
        </Card>

        <Button
          title="Export My Data"
          onPress={handleExport}
          loading={exporting}
          icon={<Download size={18} color="#FFF" />}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
