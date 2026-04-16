import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTranslation } from "react-i18next";
import { addHours } from "date-fns";
import { Button } from "../../src/components/ui";
import { Colors } from "../../src/constants/colors";
import { getSessionSchema } from "../../src/lib/validations";
import { useSessions } from "../../src/hooks/useSessions";

export default function CreateSessionModal() {
  const router = useRouter();
  const { t } = useTranslation();
  const { groupId } = useLocalSearchParams<{ groupId?: string }>();
  const { createSession } = useSessions({ groupId });

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [starts, setStarts] = useState<Date>(() => {
    const d = new Date();
    d.setMinutes(0, 0, 0);
    return addHours(d, 1);
  });
  const [ends, setEnds] = useState<Date>(() => addHours(new Date(), 2));
  const [errors, setErrors] = useState<{ ends_at?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const onSubmit = async () => {
    if (!groupId) {
      Alert.alert(t("common.error"), t("announcements.missingGroup"));
      return;
    }
    const parsed = getSessionSchema().safeParse({
      group_id: groupId,
      title: title.trim() || undefined,
      starts_at: starts.toISOString(),
      ends_at: ends.toISOString(),
      notes: notes.trim() || undefined,
    });
    if (!parsed.success) {
      const next: { ends_at?: string } = {};
      for (const issue of parsed.error.issues) {
        if (issue.path[0] === "ends_at") next.ends_at = issue.message;
      }
      setErrors(next);
      return;
    }

    setSubmitting(true);
    try {
      await createSession({
        group_id: groupId,
        location_id: null,
        title: parsed.data.title ?? null,
        starts_at: parsed.data.starts_at,
        ends_at: parsed.data.ends_at,
        is_cancelled: false,
        cancellation_reason: null,
        notes: parsed.data.notes ?? null,
      });
      router.back();
    } catch (err) {
      const message = err instanceof Error ? err.message : t("common.error");
      Alert.alert(t("sessions.createFailed"), message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderBottomColor: Colors.border,
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: "700", color: Colors.text.primary }}>
            {t("sessions.newSession")}
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={t("common.close")}
            onPress={() => router.back()}
          >
            <X size={24} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
          <LabeledInput
            label={t("sessions.titleLabel")}
            value={title}
            onChangeText={setTitle}
            placeholder={t("sessions.titlePlaceholder")}
          />

          <DateRow
            label={t("sessions.startLabel")}
            value={starts}
            onPress={() => setShowStartPicker(true)}
          />
          {showStartPicker ? (
            <DateTimePicker
              value={starts}
              mode="datetime"
              onChange={(_, d) => {
                setShowStartPicker(Platform.OS === "ios");
                if (d) {
                  setStarts(d);
                  if (d.getTime() >= ends.getTime()) {
                    setEnds(addHours(d, 1));
                  }
                }
              }}
            />
          ) : null}

          <DateRow
            label={t("sessions.endLabel")}
            value={ends}
            onPress={() => setShowEndPicker(true)}
          />
          {showEndPicker ? (
            <DateTimePicker
              value={ends}
              mode="datetime"
              onChange={(_, d) => {
                setShowEndPicker(Platform.OS === "ios");
                if (d) setEnds(d);
              }}
            />
          ) : null}
          {errors.ends_at ? (
            <Text style={{ fontSize: 12, color: Colors.danger.DEFAULT }}>
              {errors.ends_at}
            </Text>
          ) : null}

          <LabeledInput
            label={t("sessions.notesLabel")}
            value={notes}
            onChangeText={setNotes}
            placeholder={t("sessions.notesPlaceholder")}
            multiline
          />

          <Button
            title={t("sessions.createCta")}
            onPress={onSubmit}
            disabled={!groupId}
            loading={submitting}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function LabeledInput({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <View>
      <Text
        style={{
          fontSize: 13,
          fontWeight: "600",
          color: Colors.text.secondary,
          marginBottom: 6,
        }}
      >
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.text.secondary}
        multiline={multiline}
        style={{
          borderWidth: 1,
          borderColor: Colors.border,
          borderRadius: 10,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontSize: 15,
          color: Colors.text.primary,
          backgroundColor: Colors.surface,
          minHeight: multiline ? 100 : undefined,
          textAlignVertical: multiline ? "top" : "auto",
        }}
      />
    </View>
  );
}

function DateRow({
  label,
  value,
  onPress,
}: {
  label: string;
  value: Date;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 14,
        backgroundColor: Colors.surface,
      }}
    >
      <Text style={{ fontSize: 12, color: Colors.text.secondary, marginBottom: 2 }}>
        {label}
      </Text>
      <Text style={{ fontSize: 15, color: Colors.text.primary, fontWeight: "600" }}>
        {value.toLocaleString()}
      </Text>
    </TouchableOpacity>
  );
}
