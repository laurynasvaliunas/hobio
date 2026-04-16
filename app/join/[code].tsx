import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, LogIn, CheckCircle, Clock } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Input, Card, PaperPlaneAnimation } from "../../src/components/ui";
import { Colors } from "../../src/constants/colors";
import { Fonts } from "../../src/constants/fonts";
import { useAuthStore } from "../../src/stores/authStore";
import { supabase } from "../../src/lib/supabase";
import { normalizeInviteCode } from "../../src/lib/authGuards";
import { createLogger } from "../../src/lib/logger";
import type { Group } from "../../src/types/database.types";

const log = createLogger("Join");

type JoinResult = { group: Group; status: "active" | "pending" };

export default function JoinGroupScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);

  const [inviteCode, setInviteCode] = useState(
    code !== "enter" ? code ?? "" : ""
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<JoinResult | null>(null);
  const [showPlane, setShowPlane] = useState(false);

  const handleJoin = async () => {
    const code = normalizeInviteCode(inviteCode);
    if (!code) {
      Alert.alert(t("common.error"), t("groups.invalidCode"));
      return;
    }
    if (!profile) return;

    setLoading(true);
    try {
      // All join validation (code exists, not full, idempotent for already-joined,
      // parent/child ownership) is enforced atomically by the RPC + RLS.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).rpc("join_group_by_invite", {
        p_code: code,
        p_child_id: null,
      });

      if (error) {
        log.warn("rpc_failed", { code: error.code });
        throw new Error(mapJoinError(error.code, error.message));
      }
      if (!data) throw new Error(t("groups.joinUnknown"));

      // Fetch the group via RLS (caller is now a member).
      const { data: group } = await supabase
        .from("groups")
        .select("*")
        .eq("id", (data as { group_id: string }).group_id)
        .single();
      if (!group) throw new Error(t("groups.joinUnknown"));

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowPlane(true);
      setResult({
        group: group as Group,
        status: (data as { status: "active" | "pending" }).status ?? "active",
      });
    } catch (err: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const message = err instanceof Error ? err.message : t("groups.joinUnknown");
      Alert.alert(t("groups.joinFailed"), message);
    } finally {
      setLoading(false);
    }
  };

  function mapJoinError(code: string | undefined, fallback: string): string {
    switch (code) {
      case "02000":
        return t("groups.invalidCode");
      case "22023":
        return t("groups.invalidCodeLength");
      case "23514":
        return t("groups.groupFull");
      case "42501":
        return t("groups.notAuthorized");
      case "28000":
        return t("groups.notSignedIn");
      default:
        return fallback;
    }
  }

  // Success state
  if (result) {
    const isPending = result.status === "pending";

    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: Colors.background }}
        edges={["top", "bottom"]}
      >
        {/* Paper-plane celebration animation */}
        <PaperPlaneAnimation
          visible={showPlane}
          onComplete={() => setShowPlane(false)}
        />

        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 32,
            gap: 16,
          }}
        >
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: isPending
                ? Colors.warning.DEFAULT + "20"
                : Colors.secondary.DEFAULT + "20",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 8,
            }}
          >
            {isPending ? (
              <Clock size={40} color={Colors.warning.dark} />
            ) : (
              <CheckCircle size={40} color={Colors.secondary.DEFAULT} />
            )}
          </View>
          <Text
            style={{
              fontSize: 24,
              fontFamily: Fonts.extraBold,
              color: Colors.text.primary,
              textAlign: "center",
            }}
          >
            {isPending ? "Request Sent!" : "You're In!"}
          </Text>
          <Text
            style={{
              fontSize: 16,
              fontFamily: Fonts.regular,
              color: Colors.text.secondary,
              textAlign: "center",
              lineHeight: 24,
            }}
          >
            {isPending
              ? `Your request to join "${result.group.name}" has been sent. The organizer will review and approve it.`
              : `You've successfully joined "${result.group.name}"`}
          </Text>
          <Button
            title={t("groups.joinBackHome")}
            onPress={() => {
              router.dismiss();
              router.replace("/(tabs)/home");
            }}
            style={{ marginTop: 16 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: Colors.background }}
      edges={["top"]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, paddingHorizontal: 20 }}>
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 14,
              gap: 14,
            }}
          >
            <TouchableOpacity
              onPress={() => router.back()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ArrowLeft size={24} color={Colors.text.primary} />
            </TouchableOpacity>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "700",
                color: Colors.text.primary,
              }}
            >
              Join a Group
            </Text>
          </View>

          <View style={{ flex: 1, justifyContent: "center", paddingBottom: 80 }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 18,
                backgroundColor: Colors.secondary.DEFAULT + "20",
                alignItems: "center",
                justifyContent: "center",
                alignSelf: "center",
                marginBottom: 24,
              }}
            >
              <LogIn size={30} color={Colors.secondary.DEFAULT} />
            </View>

            <Text
              style={{
                fontSize: 22,
                fontWeight: "700",
                color: Colors.text.primary,
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              Enter Invite Code
            </Text>
            <Text
              style={{
                fontSize: 15,
                color: Colors.text.secondary,
                textAlign: "center",
                marginBottom: 8,
                lineHeight: 22,
              }}
            >
              Ask your group organizer for the 6-character code.
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: Colors.text.secondary,
                textAlign: "center",
                marginBottom: 32,
              }}
            >
              Your request will be sent for approval.
            </Text>

            <Input
              placeholder="e.g. ABC123"
              value={inviteCode}
              onChangeText={(text) => setInviteCode(text.toUpperCase())}
              autoCapitalize="characters"
              maxLength={6}
              style={{
                fontSize: 24,
                fontWeight: "700",
                letterSpacing: 6,
                textAlign: "center",
              }}
              containerStyle={{ marginBottom: 24 }}
            />

            <Button
              title={t("groups.requestJoin")}
              onPress={handleJoin}
              loading={loading}
              disabled={inviteCode.length < 6}
              variant="secondary"
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
