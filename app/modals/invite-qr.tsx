import React from "react";
import { View, Text, TouchableOpacity, Share, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { X, Share2, Copy } from "lucide-react-native";
import * as Clipboard from "expo-clipboard";
import QRCode from "react-native-qrcode-svg";
import { useTranslation } from "react-i18next";
import { Card } from "../../src/components/ui";
import { Colors } from "../../src/constants/colors";

export default function InviteQrModal() {
  const router = useRouter();
  const { t } = useTranslation();
  const { code, name } = useLocalSearchParams<{ code?: string; name?: string }>();

  const inviteCode = (code ?? "").toUpperCase();
  const deepLink = `hobio://join/${inviteCode}`;

  const handleShare = async () => {
    if (!inviteCode) return;
    try {
      await Share.share({
        message: t("groups.inviteQrDesc", { name: name ?? "Hobio" }) + "\n" + deepLink,
      });
    } catch {
      /* user cancelled */
    }
  };

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(inviteCode);
      Alert.alert(t("common.copy"), t("common.copiedToClipboard"));
    } catch {
      /* ignore */
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: Colors.background }}
      edges={["top"]}
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
        <View style={{ width: 24 }} />
        <Text
          style={{ fontSize: 18, fontWeight: "700", color: Colors.text.primary }}
        >
          {t("groups.inviteQrTitle")}
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t("common.close")}
          onPress={() => router.back()}
        >
          <X size={24} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>

      <View
        style={{
          flex: 1,
          padding: 20,
          alignItems: "center",
          justifyContent: "flex-start",
          gap: 18,
        }}
      >
        {name ? (
          <Text
            style={{
              fontSize: 20,
              fontWeight: "800",
              color: Colors.text.primary,
              textAlign: "center",
            }}
          >
            {name}
          </Text>
        ) : null}
        <Text
          style={{
            fontSize: 14,
            color: Colors.text.secondary,
            textAlign: "center",
            paddingHorizontal: 16,
          }}
        >
          {t("groups.inviteQrDesc", { name: name ?? "Hobio" })}
        </Text>

        <Card padding={24} style={{ alignItems: "center" }}>
          {inviteCode ? (
            <QRCode
              value={deepLink}
              size={220}
              color={Colors.text.primary}
              backgroundColor={Colors.surface}
            />
          ) : (
            <Text style={{ color: Colors.text.secondary }}>
              {t("groups.invalidCode")}
            </Text>
          )}
          {inviteCode ? (
            <Text
              style={{
                marginTop: 16,
                fontSize: 28,
                fontWeight: "800",
                letterSpacing: 6,
                color: Colors.primary.DEFAULT,
              }}
              accessibilityLabel={inviteCode.split("").join(" ")}
            >
              {inviteCode}
            </Text>
          ) : null}
        </Card>

        <View style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
          <TouchableOpacity
            onPress={handleCopy}
            accessibilityRole="button"
            accessibilityLabel={t("common.copy")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 18,
              paddingVertical: 12,
              borderRadius: 12,
              backgroundColor: Colors.primary.light + "20",
            }}
          >
            <Copy size={18} color={Colors.primary.DEFAULT} />
            <Text style={{ color: Colors.primary.DEFAULT, fontWeight: "700" }}>
              {t("common.copy")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleShare}
            accessibilityRole="button"
            accessibilityLabel={t("groups.shareInviteCta")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 18,
              paddingVertical: 12,
              borderRadius: 12,
              backgroundColor: Colors.primary.DEFAULT,
            }}
          >
            <Share2 size={18} color="#FFFFFF" />
            <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>
              {t("groups.shareInviteCta")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
