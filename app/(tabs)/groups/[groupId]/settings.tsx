import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Trash2, Save, Power } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Button, Input, Card } from "../../../../src/components/ui";
import { Colors } from "../../../../src/constants/colors";
import { GROUP_COLORS, SKILL_LEVELS } from "../../../../src/constants/categories";
import { useGroupStore } from "../../../../src/stores/groupStore";
import { useAuthStore } from "../../../../src/stores/authStore";
import { getGroupSchema } from "../../../../src/lib/validations";
import { createLogger } from "../../../../src/lib/logger";

const log = createLogger("GroupSettings");

export default function GroupSettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const profile = useAuthStore((s) => s.profile);
  const { groups, organizations, updateGroup, deleteGroup } = useGroupStore();

  const group = useMemo(
    () => groups.find((g) => g.id === groupId),
    [groups, groupId]
  );
  const isOwner = useMemo(() => {
    if (!group || !profile) return false;
    return organizations.some(
      (o) => o.id === group.organization_id && o.owner_id === profile.id
    );
  }, [group, organizations, profile]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [skill, setSkill] = useState<string>("all");
  const [color, setColor] = useState<string>(GROUP_COLORS[0]);
  const [maxParticipants, setMaxParticipants] = useState("");
  const [pricePerMonth, setPricePerMonth] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!group) return;
    setName(group.name);
    setDescription(group.description ?? "");
    setAgeGroup(group.age_group ?? "");
    setSkill((group.skill_level as string) ?? "all");
    setColor(group.color ?? GROUP_COLORS[0]);
    setMaxParticipants(
      group.max_participants ? String(group.max_participants) : ""
    );
    setPricePerMonth(
      group.price_per_month ? String(group.price_per_month) : ""
    );
    setIsActive(group.is_active ?? true);
  }, [group]);

  if (!group) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: Colors.background }}
        edges={["top"]}
      >
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: Colors.text.secondary }}>
            {t("groups.notFound")}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isOwner) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: Colors.background }}
        edges={["top"]}
      >
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 20 }}>
          <Text style={{ fontSize: 16, color: Colors.text.secondary, textAlign: "center" }}>
            {t("groups.settingsOwnerOnly")}
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ marginTop: 20, paddingHorizontal: 18, paddingVertical: 10 }}
          >
            <Text style={{ color: Colors.primary.DEFAULT, fontWeight: "600" }}>
              {t("common.back")}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleSave = async () => {
    const parsed = getGroupSchema().safeParse({
      name: name.trim(),
      description: description.trim() || undefined,
      age_group: ageGroup.trim() || undefined,
      skill_level: skill as "beginner" | "intermediate" | "advanced" | "all",
      max_participants: maxParticipants ? Number(maxParticipants) : undefined,
      price_per_month: pricePerMonth ? Number(pricePerMonth) : undefined,
      currency: group.currency ?? "EUR",
      color,
      location_id: group.location_id ?? null,
    });

    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string") nextErrors[key] = issue.message;
      }
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      await updateGroup(group.id, {
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        age_group: parsed.data.age_group ?? null,
        skill_level: parsed.data.skill_level ?? null,
        max_participants: parsed.data.max_participants ?? null,
        price_per_month: parsed.data.price_per_month ?? null,
        color: parsed.data.color,
        is_active: isActive,
      });
      router.back();
    } catch (err) {
      log.error("Group update failed", { error: err });
      const msg = err instanceof Error ? err.message : t("common.error");
      Alert.alert(t("groups.updateFailed"), msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      t("groups.deleteTitle"),
      t("groups.deleteConfirm", { name: group.name }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteGroup(group.id);
              router.replace("/(tabs)/groups" as never);
            } catch (err) {
              log.error("Group delete failed", { error: err });
              const msg = err instanceof Error ? err.message : t("common.error");
              Alert.alert(t("groups.deleteFailed"), msg);
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: Colors.background }}
      edges={["top"]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderBottomColor: Colors.border,
          }}
        >
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={t("common.back")}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: "700", color: Colors.text.primary }}>
            {t("groups.settingsTitle")}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
          <Input
            label={t("groups.nameLabel")}
            value={name}
            onChangeText={setName}
            error={errors.name}
          />
          <Input
            label={t("groups.descriptionLabel")}
            value={description}
            onChangeText={setDescription}
            multiline
            error={errors.description}
          />
          <Input
            label={t("groups.ageGroupLabel")}
            value={ageGroup}
            onChangeText={setAgeGroup}
            placeholder={t("groups.ageGroupPlaceholder")}
          />

          <Card>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: Colors.text.secondary,
                marginBottom: 10,
              }}
            >
              {t("groups.skillLevelLabel")}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {SKILL_LEVELS.map((s) => {
                const active = skill === s.key;
                return (
                  <TouchableOpacity
                    key={s.key}
                    onPress={() => setSkill(s.key)}
                    accessibilityRole="button"
                    accessibilityLabel={s.label}
                    accessibilityState={{ selected: active }}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: active
                        ? Colors.primary.DEFAULT
                        : Colors.border,
                      backgroundColor: active
                        ? Colors.primary.light + "20"
                        : Colors.surface,
                    }}
                  >
                    <Text
                      style={{
                        color: active
                          ? Colors.primary.DEFAULT
                          : Colors.text.primary,
                        fontWeight: active ? "700" : "500",
                        fontSize: 13,
                      }}
                    >
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>

          <Card>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: Colors.text.secondary,
                marginBottom: 10,
              }}
            >
              {t("groups.colorLabel")}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {GROUP_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setColor(c)}
                  accessibilityRole="button"
                  accessibilityLabel={c}
                  accessibilityState={{ selected: color === c }}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: c,
                    borderWidth: color === c ? 3 : 0,
                    borderColor: Colors.text.primary,
                  }}
                />
              ))}
            </View>
          </Card>

          <Input
            label={t("groups.maxParticipantsLabel")}
            value={maxParticipants}
            onChangeText={setMaxParticipants}
            keyboardType="number-pad"
            placeholder="—"
          />
          <Input
            label={t("groups.pricePerMonthLabel")}
            value={pricePerMonth}
            onChangeText={setPricePerMonth}
            keyboardType="decimal-pad"
            placeholder="0.00"
          />

          <Card>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "700",
                    color: Colors.text.primary,
                  }}
                >
                  {t("groups.activeLabel")}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: Colors.text.secondary,
                    marginTop: 2,
                  }}
                >
                  {t("groups.activeHint")}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsActive((v) => !v)}
                accessibilityRole="switch"
                accessibilityState={{ checked: isActive }}
                style={{
                  width: 52,
                  height: 30,
                  borderRadius: 15,
                  padding: 3,
                  backgroundColor: isActive
                    ? Colors.primary.DEFAULT
                    : Colors.border,
                }}
              >
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: "#FFFFFF",
                    transform: [{ translateX: isActive ? 22 : 0 }],
                  }}
                />
              </TouchableOpacity>
            </View>
          </Card>

          <Button
            title={t("common.save")}
            loading={saving}
            onPress={handleSave}
            icon={<Save size={18} color="#FFFFFF" />}
          />

          <TouchableOpacity
            onPress={handleDelete}
            disabled={deleting}
            accessibilityRole="button"
            accessibilityLabel={t("groups.deleteGroup")}
            style={{
              marginTop: 8,
              paddingVertical: 14,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: Colors.danger.DEFAULT,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
              opacity: deleting ? 0.6 : 1,
            }}
          >
            <Trash2 size={18} color={Colors.danger.DEFAULT} />
            <Text style={{ color: Colors.danger.DEFAULT, fontWeight: "700" }}>
              {t("groups.deleteGroup")}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

void Power;
