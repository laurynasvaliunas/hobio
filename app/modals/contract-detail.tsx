import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { X, FileText, Calendar, Euro, CheckCircle } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { format, parseISO } from "date-fns";
import { supabase } from "../../src/lib/supabase";
import { Colors } from "../../src/constants/colors";
import { Badge, Button } from "../../src/components/ui";
import { createLogger } from "../../src/lib/logger";
import { useAuthStore } from "../../src/stores/authStore";

const log = createLogger("ContractDetail");

interface ContractData {
  id: string;
  group_id: string;
  member_id: string;
  title: string;
  description: string | null;
  document_url: string | null;
  price: number;
  currency: string;
  billing_period: "one_time" | "monthly" | "quarterly" | "yearly";
  starts_at: string;
  ends_at: string | null;
  status: "pending" | "signed" | "expired" | "cancelled";
  signed_at: string | null;
  signed_by: string | null;
}

export default function ContractDetailModal() {
  const router = useRouter();
  const { t } = useTranslation();
  const { contractId } = useLocalSearchParams<{ contractId?: string }>();
  const session = useAuthStore((s) => s.session);

  const [data, setData] = useState<ContractData | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!contractId) {
        setError(t("common.error"));
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("contracts")
          .select("*")
          .eq("id", contractId)
          .single();
        if (error) throw error;
        if (!cancelled) setData((data as unknown) as ContractData);
      } catch (err) {
        log.error("Load contract failed", { err });
        if (!cancelled) setError(err instanceof Error ? err.message : t("common.error"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [contractId]);

  const billingLabel = useMemo(() => {
    if (!data) return "";
    switch (data.billing_period) {
      case "one_time":
        return t("contracts.billingOneTime");
      case "monthly":
        return t("contracts.billingMonthly");
      case "quarterly":
        return t("contracts.billingQuarterly");
      case "yearly":
        return t("contracts.billingYearly");
    }
  }, [data, t]);

  const statusBadge = (status: ContractData["status"]) => {
    switch (status) {
      case "signed":
        return { variant: "secondary" as const, label: t("contracts.signed") };
      case "expired":
        return { variant: "warning" as const, label: t("contracts.expired") };
      case "cancelled":
        return { variant: "danger" as const, label: t("contracts.cancelled") };
      default:
        return { variant: "warning" as const, label: t("contracts.pending") };
    }
  };

  const onSign = async () => {
    if (!data) return;
    if (!session?.user?.id) {
      Alert.alert(t("common.error"), t("groups.notSignedIn"));
      return;
    }
    setSigning(true);
    try {
      const { error } = await supabase
        .from("contracts")
        .update({
          status: "signed",
          signed_at: new Date().toISOString(),
          signed_by: session.user.id,
        })
        .eq("id", data.id);
      if (error) throw error;
      setData({ ...data, status: "signed", signed_at: new Date().toISOString(), signed_by: session.user.id });
    } catch (err) {
      const message = err instanceof Error ? err.message : t("common.error");
      Alert.alert(t("contracts.signFailed"), message);
    } finally {
      setSigning(false);
    }
  };

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
          {t("contracts.detailTitle")}
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
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <FileText size={24} color={Colors.primary.DEFAULT} />
              <Text
                style={{
                  flex: 1,
                  fontSize: 22,
                  fontWeight: "800",
                  color: Colors.text.primary,
                }}
              >
                {data.title}
              </Text>
            </View>
            <Badge {...statusBadge(data.status)} />
          </View>

          {data.description ? (
            <View
              style={{
                padding: 14,
                backgroundColor: Colors.surface,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: Colors.border,
              }}
            >
              <Text style={{ fontSize: 14, color: Colors.text.primary, lineHeight: 20 }}>
                {data.description}
              </Text>
            </View>
          ) : null}

          <DetailRow
            icon={<Euro size={18} color={Colors.text.secondary} />}
            label={`${data.price.toFixed(2)} ${data.currency} · ${billingLabel}`}
          />
          <DetailRow
            icon={<Calendar size={18} color={Colors.text.secondary} />}
            label={
              data.ends_at
                ? `${format(parseISO(data.starts_at), "PP")} – ${format(
                    parseISO(data.ends_at),
                    "PP"
                  )}`
                : format(parseISO(data.starts_at), "PP")
            }
          />
          {data.status === "signed" && data.signed_at ? (
            <DetailRow
              icon={<CheckCircle size={18} color={Colors.secondary.DEFAULT} />}
              label={`${t("contracts.signed")} · ${format(parseISO(data.signed_at), "PPp")}`}
            />
          ) : null}

          {data.status === "pending" ? (
            <>
              <Text
                style={{
                  fontSize: 12,
                  color: Colors.text.secondary,
                  lineHeight: 18,
                  marginTop: 8,
                }}
              >
                {t("contracts.termsNote")}
              </Text>
              <Button
                title={signing ? t("contracts.signing") : t("contracts.signCta")}
                onPress={onSign}
                loading={signing}
              />
            </>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function DetailRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 14,
        borderRadius: 12,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
      }}
    >
      {icon}
      <Text style={{ flex: 1, fontSize: 14, color: Colors.text.primary, fontWeight: "600" }}>
        {label}
      </Text>
    </View>
  );
}
