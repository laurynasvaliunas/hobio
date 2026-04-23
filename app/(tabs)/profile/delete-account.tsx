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
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Button, Input } from "../../../src/components/ui";
import { useToast } from "../../../src/components/ui/Toast";
import { Colors } from "../../../src/constants/colors";
import { useAuthStore } from "../../../src/stores/authStore";
import { supabase } from "../../../src/lib/supabase";

export default function DeleteAccountScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { profile, signOut } = useAuthStore();
  const toast = useToast();

  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);

  const canDelete = confirmation === "DELETE";

  const handleDelete = async () => {
    if (!canDelete || !profile) return;

    Alert.alert(
      t("profile.finalConfirmation"),
      t("profile.finalConfirmationBody"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("profile.deleteForever"),
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
              toast.show(t("profile.accountDeleted"));
              await signOut();
            } catch (err) {
              if (__DEV__) {
                // eslint-disable-next-line no-console
                console.error("Delete account error", err);
              }
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              toast.show(t("profile.deleteAccountFailed"), "error");
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
            {t("profile.deleteAccountScreen")}
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
                {t("profile.deleteIrreversible")}
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
                {t("profile.deleteDescription")}
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
            {t("profile.whatWillBeDeleted")}
          </Text>
          <Card style={{ marginBottom: 24 }}>
            {[
              t("profile.deleteItemProfile"),
              t("profile.deleteItemChildren"),
              t("profile.deleteItemGroups"),
              t("profile.deleteItemInvoices"),
              t("profile.deleteItemContracts"),
              t("profile.deleteItemNotifications"),
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
            {t("profile.typeDeleteToConfirm").split("<1>")[0]}
            <Text style={{ fontWeight: "800", color: Colors.danger.DEFAULT }}>DELETE</Text>
            {t("profile.typeDeleteToConfirm").split("</1>")[1] ?? ""}
          </Text>
          <Input
            placeholder={t("profile.deletePlaceholder")}
            value={confirmation}
            onChangeText={setConfirmation}
            autoCapitalize="characters"
            containerStyle={{ marginBottom: 20 }}
            error={
              confirmation.length > 0 && !canDelete
                ? t("profile.typeDeleteError")
                : undefined
            }
            success={canDelete ? t("profile.readyToProceed") : undefined}
          />

          <Button
            title={t("profile.deleteConfirm")}
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
