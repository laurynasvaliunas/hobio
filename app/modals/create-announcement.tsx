import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Bell, Megaphone, Siren, X } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Button } from "../../src/components/ui";
import { Colors } from "../../src/constants/colors";
import { getAnnouncementSchema, type AnnouncementFormData } from "../../src/lib/validations";
import { useAnnouncements } from "../../src/hooks/useAnnouncements";

type Priority = AnnouncementFormData["priority"];

const PRIORITY_OPTIONS: Array<{
  key: Priority;
  labelKey: string;
  tint: string;
  Icon: typeof Bell;
}> = [
  { key: "normal", labelKey: "announcements.priorityNormal", tint: Colors.primary.DEFAULT, Icon: Bell },
  { key: "important", labelKey: "announcements.priorityImportant", tint: Colors.warning.DEFAULT, Icon: Megaphone },
  { key: "urgent", labelKey: "announcements.priorityUrgent", tint: Colors.danger.DEFAULT, Icon: Siren },
];

export default function CreateAnnouncementModal() {
  const router = useRouter();
  const { t } = useTranslation();
  const { groupId } = useLocalSearchParams<{ groupId?: string }>();
  const { create } = useAnnouncements({ groupId });

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState<Priority>("normal");
  const [errors, setErrors] = useState<{ title?: string; body?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(
    () => !!groupId && title.trim().length > 0 && body.trim().length > 0,
    [groupId, title, body]
  );

  const onSubmit = async () => {
    if (!groupId) {
      Alert.alert(t("common.error"), t("announcements.missingGroup"));
      return;
    }
    const parsed = getAnnouncementSchema().safeParse({
      group_id: groupId,
      title: title.trim(),
      body: body.trim(),
      priority,
    });
    if (!parsed.success) {
      const next: { title?: string; body?: string } = {};
      for (const issue of parsed.error.issues) {
        if (issue.path[0] === "title") next.title = issue.message;
        if (issue.path[0] === "body") next.body = issue.message;
      }
      setErrors(next);
      return;
    }

    setSubmitting(true);
    try {
      await create(parsed.data);
      router.back();
    } catch (err) {
      const message = err instanceof Error ? err.message : t("common.error");
      Alert.alert(t("announcements.sendFailed"), message);
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
            {t("announcements.newAnnouncement")}
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={t("common.close")}
            onPress={() => router.back()}
          >
            <X size={24} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 20, gap: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          <View>
            <Text style={styles.label}>{t("announcements.titleLabel")}</Text>
            <TextInput
              value={title}
              onChangeText={(v) => {
                setTitle(v);
                if (errors.title) setErrors((e) => ({ ...e, title: undefined }));
              }}
              placeholder={t("announcements.titlePlaceholder")}
              placeholderTextColor={Colors.text.secondary}
              maxLength={120}
              style={[styles.input, errors.title && styles.inputError]}
              accessibilityLabel={t("announcements.titleLabel")}
            />
            {errors.title ? <Text style={styles.error}>{errors.title}</Text> : null}
          </View>

          <View>
            <Text style={styles.label}>{t("announcements.bodyLabel")}</Text>
            <TextInput
              value={body}
              onChangeText={(v) => {
                setBody(v);
                if (errors.body) setErrors((e) => ({ ...e, body: undefined }));
              }}
              placeholder={t("announcements.bodyPlaceholder")}
              placeholderTextColor={Colors.text.secondary}
              multiline
              numberOfLines={6}
              maxLength={4000}
              style={[styles.input, styles.textarea, errors.body && styles.inputError]}
              accessibilityLabel={t("announcements.bodyLabel")}
            />
            {errors.body ? <Text style={styles.error}>{errors.body}</Text> : null}
          </View>

          <View>
            <Text style={styles.label}>{t("announcements.priorityLabel")}</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {PRIORITY_OPTIONS.map((opt) => {
                const active = priority === opt.key;
                const Icon = opt.Icon;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    onPress={() => setPriority(opt.key)}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      borderRadius: 12,
                      borderWidth: 1.5,
                      borderColor: active ? opt.tint : Colors.border,
                      backgroundColor: active ? opt.tint + "15" : Colors.surface,
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Icon size={18} color={opt.tint} />
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: active ? opt.tint : Colors.text.primary,
                      }}
                    >
                      {t(opt.labelKey)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <Button
            title={t("announcements.sendCta")}
            onPress={onSubmit}
            disabled={!canSubmit}
            loading={submitting}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = {
  label: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.text.secondary,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text.primary,
    backgroundColor: Colors.surface,
  },
  textarea: {
    minHeight: 120,
    textAlignVertical: "top" as const,
  },
  inputError: {
    borderColor: Colors.danger.DEFAULT,
  },
  error: {
    marginTop: 6,
    fontSize: 12,
    color: Colors.danger.DEFAULT,
  },
};
