import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { X, Baby, Save } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Card, Button, Input, BirthDatePicker } from "../../src/components/ui";
import { useToast } from "../../src/components/ui/Toast";
import { useTheme } from "../../src/hooks/useTheme";
import { Fonts } from "../../src/constants/fonts";
import { useAuthStore } from "../../src/stores/authStore";
import { useChildren } from "../../src/hooks/useChildren";
import { childSchema } from "../../src/lib/validations";

export default function AddChildModal() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const toast = useToast();
  const { colors } = useTheme();
  const { addChild } = useChildren(profile?.id ?? "");

  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [medicalNotes, setMedicalNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    // Validate
    const result = childSchema.safeParse({
      full_name: fullName.trim(),
      date_of_birth: dateOfBirth.trim(),
      medical_notes: medicalNotes.trim() || undefined,
    });

    if (!result.success) {
      Alert.alert("Validation Error", result.error.issues[0]?.message ?? "Check your input");
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaving(true);
    try {
      await addChild({
        full_name: fullName.trim(),
        date_of_birth: dateOfBirth.trim(),
        medical_notes: medicalNotes.trim() || undefined,
      });

      toast.show(`${fullName} added successfully`);
      router.dismiss();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to add child";
      Alert.alert("Error", msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingVertical: 14,
          }}
        >
          <TouchableOpacity onPress={() => router.dismiss()}>
            <X size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontFamily: Fonts.bold, color: colors.text.primary }}>
            Add Child
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ alignItems: "center", marginVertical: 16 }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 18,
                backgroundColor: colors.accent.DEFAULT + "20",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Baby size={32} color={colors.accent.DEFAULT} />
            </View>
          </View>

          <Input
            label="Full Name *"
            placeholder="e.g. Alex Johnson"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            containerStyle={{ marginBottom: 16 }}
          />

          {/* Native Date Picker — defaults to ~7 years ago */}
          <View style={{ marginBottom: 16 }}>
            <BirthDatePicker
              value={dateOfBirth}
              onChange={setDateOfBirth}
              label="Date of Birth *"
              placeholder="Tap to select date"
            />
          </View>

          <Input
            label="Medical Notes"
            placeholder="Allergies, conditions, medication..."
            value={medicalNotes}
            onChangeText={setMedicalNotes}
            autoCapitalize="sentences"
            multiline
            numberOfLines={3}
            containerStyle={{ marginBottom: 24 }}
          />

          <Button
            title="Add Child"
            onPress={handleSave}
            loading={saving}
            disabled={!fullName.trim() || !dateOfBirth.trim()}
            icon={<Save size={18} color="#FFF" />}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
