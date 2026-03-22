import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, AlertTriangle, Trash2 } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Button, Input } from "../../../src/components/ui";
import { useToast } from "../../../src/components/ui/Toast";
import { Colors } from "../../../src/constants/colors";
import { useAuthStore } from "../../../src/stores/authStore";
import { supabase } from "../../../src/lib/supabase";

export default function DeleteAccountScreen() {
  const router = useRouter();
  const { profile, signOut } = useAuthStore();
  const toast = useToast();

  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);

  const canDelete = confirmation === "DELETE";

  const handleDelete = async () => {
    if (!canDelete || !profile) return;

    Alert.alert(
      "Final Confirmation",
      "This is your last chance. Once deleted, ALL your data will be permanently removed. This cannot be reversed.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Forever",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              // Delete user data (cascades from profiles)
              // The Supabase RLS + CASCADE should handle children, memberships, etc.
              const { error } = await supabase
                .from("profiles")
                .delete()
                .eq("id", profile.id);

              if (error) throw error;

              // Sign out after deletion
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              toast.show("Account deleted");
              await signOut();
            } catch (err) {
              console.error("Delete account error:", err);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              toast.show("Failed to delete account", "error");
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
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
          <Text style={{ fontSize: 20, fontWeight: "700", color: Colors.danger.DEFAULT }}>
            Delete Account
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Warning banner */}
          <Card
            style={{
              marginBottom: 24,
              backgroundColor: Colors.danger.DEFAULT + "08",
              borderWidth: 1.5,
              borderColor: Colors.danger.DEFAULT + "30",
            }}
          >
            <View style={{ alignItems: "center", paddingVertical: 16, gap: 12 }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: Colors.danger.DEFAULT + "15",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AlertTriangle size={32} color={Colors.danger.DEFAULT} />
              </View>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                  color: Colors.danger.DEFAULT,
                  textAlign: "center",
                }}
              >
                This action is irreversible
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: Colors.text.secondary,
                  textAlign: "center",
                  lineHeight: 20,
                  paddingHorizontal: 8,
                }}
              >
                Deleting your account will permanently remove all your data, including profile information, group memberships, invoices, contracts, and notifications.
              </Text>
            </View>
          </Card>

          {/* What gets deleted */}
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
            What Will Be Deleted
          </Text>
          <Card style={{ marginBottom: 24 }}>
            {[
              "Your profile and personal information",
              "All children/dependent profiles",
              "Group memberships and history",
              "Invoices and payment records",
              "Signed contracts and documents",
              "All notifications",
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
                <Trash2 size={14} color={Colors.danger.DEFAULT} />
                <Text style={{ fontSize: 14, color: Colors.text.primary }}>{item}</Text>
              </View>
            ))}
          </Card>

          {/* Confirmation input */}
          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: Colors.text.primary,
              marginBottom: 8,
            }}
          >
            Type <Text style={{ fontWeight: "800", color: Colors.danger.DEFAULT }}>DELETE</Text> to confirm
          </Text>
          <Input
            placeholder='Type "DELETE" here'
            value={confirmation}
            onChangeText={setConfirmation}
            autoCapitalize="characters"
            containerStyle={{ marginBottom: 20 }}
            error={
              confirmation.length > 0 && !canDelete
                ? `Type "DELETE" exactly to proceed`
                : undefined
            }
            success={canDelete ? "Ready to proceed" : undefined}
          />

          <Button
            title="Permanently Delete My Account"
            onPress={handleDelete}
            loading={deleting}
            disabled={!canDelete}
            variant="danger"
            icon={<Trash2 size={18} color="#FFF" />}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
