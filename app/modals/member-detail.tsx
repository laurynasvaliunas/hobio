import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { X, Mail, Phone, Calendar, AlertCircle, UserMinus } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { differenceInYears, format, parseISO } from "date-fns";
import { supabase } from "../../src/lib/supabase";
import { Colors } from "../../src/constants/colors";
import { Avatar, Badge, Button } from "../../src/components/ui";
import { createLogger } from "../../src/lib/logger";

const log = createLogger("MemberDetail");

interface MemberData {
  id: string;
  group_id: string;
  status: string;
  joined_at: string | null;
  role: string | null;
  profile?: {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
  } | null;
  child?: {
    id: string;
    full_name: string;
    date_of_birth: string;
    medical_notes: string | null;
    avatar_url: string | null;
  } | null;
}

export default function MemberDetailModal() {
  const router = useRouter();
  const { t } = useTranslation();
  const { memberId, canManage } = useLocalSearchParams<{
    memberId?: string;
    canManage?: string;
  }>();

  const [data, setData] = useState<MemberData | null>(null);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!memberId) {
        setError(t("common.error"));
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("group_members")
          .select(
            "id, group_id, status, joined_at, role, profile:profiles(id, full_name, email, phone, avatar_url), child:children(id, full_name, date_of_birth, medical_notes, avatar_url)"
          )
          .eq("id", memberId)
          .single();
        if (error) throw error;
        if (!cancelled) {
          setData((data as unknown) as MemberData);
        }
      } catch (err) {
        log.error("Load member failed", { err });
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t("common.error"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [memberId]);

  const onRemove = () => {
    if (!data) return;
    Alert.alert(t("members.remove"), t("members.removeConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("members.remove"),
        style: "destructive",
        onPress: async () => {
          setRemoving(true);
          try {
            const { error } = await supabase
              .from("group_members")
              .delete()
              .eq("id", data.id);
            if (error) throw error;
            router.back();
          } catch (err) {
            const message = err instanceof Error ? err.message : t("common.error");
            Alert.alert(t("members.removeFailed"), message);
          } finally {
            setRemoving(false);
          }
        },
      },
    ]);
  };

  const displayName =
    data?.profile?.full_name ?? data?.child?.full_name ?? t("members.detailTitle");
  const avatarUrl = data?.profile?.avatar_url ?? data?.child?.avatar_url ?? undefined;
  const isChild = !!data?.child;
  const age = data?.child?.date_of_birth
    ? differenceInYears(new Date(), parseISO(data.child.date_of_birth))
    : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={["top"]}>
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
          {t("members.detailTitle")}
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t("common.close")}
          onPress={() => router.back()}
        >
          <X size={24} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={Colors.primary.DEFAULT} />
        </View>
      ) : error || !data ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text style={{ color: Colors.danger.DEFAULT, textAlign: "center" }}>
            {error ?? t("common.error")}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
          <View style={{ alignItems: "center", gap: 10, marginBottom: 8 }}>
            <Avatar size={96} name={displayName} imageUrl={avatarUrl ?? null} />
            <Text
              style={{
                fontSize: 22,
                fontWeight: "800",
                color: Colors.text.primary,
              }}
            >
              {displayName}
            </Text>
            <View style={{ flexDirection: "row", gap: 6 }}>
              <Badge
                label={data.status}
                variant={data.status === "active" ? "secondary" : "warning"}
              />
              {isChild ? <Badge label={t("profile.child")} variant="primary" /> : null}
            </View>
          </View>

          {data.profile?.email ? (
            <DetailRow
              icon={<Mail size={18} color={Colors.text.secondary} />}
              label={t("members.email")}
              value={data.profile.email}
            />
          ) : null}
          {data.profile?.phone ? (
            <DetailRow
              icon={<Phone size={18} color={Colors.text.secondary} />}
              label={t("members.phone")}
              value={data.profile.phone}
            />
          ) : null}
          {data.joined_at ? (
            <DetailRow
              icon={<Calendar size={18} color={Colors.text.secondary} />}
              label={t("members.joined")}
              value={format(parseISO(data.joined_at), "PP")}
            />
          ) : null}
          {isChild && age !== null ? (
            <DetailRow
              icon={<Calendar size={18} color={Colors.text.secondary} />}
              label={t("members.age")}
              value={`${age}`}
            />
          ) : null}
          {isChild && data.child?.medical_notes ? (
            <DetailRow
              icon={<AlertCircle size={18} color={Colors.danger.DEFAULT} />}
              label={t("members.medicalNotes")}
              value={data.child.medical_notes}
              tint={Colors.danger.DEFAULT}
            />
          ) : null}

          {canManage === "1" ? (
            <Button
              title={t("members.remove")}
              variant="danger"
              onPress={onRemove}
              loading={removing}
              icon={<UserMinus size={18} color="#fff" />}
              style={{ marginTop: 16 }}
            />
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function DetailRow({
  icon,
  label,
  value,
  tint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tint?: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        padding: 14,
        borderRadius: 12,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
      }}
    >
      <View style={{ marginTop: 2 }}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, color: Colors.text.secondary, marginBottom: 2 }}>
          {label}
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: tint ?? Colors.text.primary,
            fontWeight: "600",
          }}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}
