import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert } from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Fingerprint,
  ScanFace,
  LogOut,
  Smartphone,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card } from "../../../src/components/ui";
import { useToast } from "../../../src/components/ui/Toast";
import { Colors } from "../../../src/constants/colors";
import { useAuthStore } from "../../../src/stores/authStore";
import { useBiometricAuth } from "../../../src/hooks/useBiometricAuth";
import { supabase } from "../../../src/lib/supabase";

export default function SecuritySettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { profile, setProfile, signOut } = useAuthStore();
  const toast = useToast();

  const {
    isAvailable: biometricAvailable,
    biometricType,
    isEnabled: biometricEnabled,
    enroll,
    unenroll,
  } = useBiometricAuth();

  const [biometricToggling, setBiometricToggling] = useState(false);
  const [signingOutAll, setSigningOutAll] = useState(false);

  const biometricLabel =
    biometricType === "facial"
      ? t("profile.biometricFaceId")
      : biometricType === "fingerprint"
      ? t("profile.biometricFingerprint")
      : t("profile.biometricGeneric");
  const BiometricIcon = biometricType === "facial" ? ScanFace : Fingerprint;

  const handleBiometricToggle = async (value: boolean) => {
    setBiometricToggling(true);
    try {
      if (value) {
        const success = await enroll();
        if (success) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          toast.show(t("profile.biometricEnabled", { type: biometricLabel }));
          if (profile) {
            await supabase.from("profiles").update({ biometrics_enabled: true }).eq("id", profile.id);
            setProfile({ ...profile, biometrics_enabled: true });
          }
        }
      } else {
        await unenroll();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        toast.show(t("profile.biometricDisabled", { type: biometricLabel }));
        if (profile) {
          await supabase.from("profiles").update({ biometrics_enabled: false }).eq("id", profile.id);
          setProfile({ ...profile, biometrics_enabled: false });
        }
      }
    } catch {
      toast.show(t("profile.biometricUpdateFailed"), "error");
    } finally {
      setBiometricToggling(false);
    }
  };

  const handleSignOutAll = () => {
    Alert.alert(
      t("profile.signOutEverywhere"),
      t("profile.signOutEverywhereBody"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("profile.signOutAll"),
          style: "destructive",
          onPress: async () => {
            setSigningOutAll(true);
            try {
              const { error } = await supabase.auth.signOut({ scope: "global" });
              if (error) throw error;
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              toast.show(t("profile.signedOutAll"));
              await signOut();
            } catch {
              toast.show(t("profile.signOutAllFailed"), "error");
            } finally {
              setSigningOutAll(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={["top"]}>
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
        <Text style={{ fontSize: 20, fontWeight: "700", color: Colors.text.primary }}>
          {t("profile.securityScreen")}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
      >
        {/* Biometric */}
        {biometricAvailable && (
          <>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: Colors.text.secondary,
                textTransform: "uppercase",
                letterSpacing: 0.8,
                marginBottom: 8,
                marginLeft: 4,
              }}
            >
              {t("profile.biometricLock")}
            </Text>
            <Card style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: Colors.primary.DEFAULT + "15",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <BiometricIcon size={22} color={Colors.primary.DEFAULT} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: "600", color: Colors.text.primary }}>
                    {t("profile.biometricLockTitle", { type: biometricLabel })}
                  </Text>
                  <Text style={{ fontSize: 13, color: Colors.text.secondary, marginTop: 2 }}>
                    {t("profile.biometricLockDesc", { type: biometricLabel })}
                  </Text>
                </View>
                <Switch
                  value={biometricEnabled}
                  onValueChange={handleBiometricToggle}
                  disabled={biometricToggling}
                  trackColor={{ false: Colors.border, true: Colors.primary.DEFAULT + "60" }}
                  thumbColor={biometricEnabled ? Colors.primary.DEFAULT : Colors.surface}
                />
              </View>
            </Card>
          </>
        )}

        {/* Active Sessions */}
        <Text
          style={{
            fontSize: 13,
            fontWeight: "600",
            color: Colors.text.secondary,
            textTransform: "uppercase",
            letterSpacing: 0.8,
            marginBottom: 8,
            marginLeft: 4,
          }}
        >
          {t("profile.sectionSessions")}
        </Text>
        <Card style={{ marginBottom: 20 }}>
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: Colors.secondary.DEFAULT + "15",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Smartphone size={20} color={Colors.secondary.DEFAULT} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: "600", color: Colors.text.primary }}>
                  {t("profile.thisDevice")}
                </Text>
                <Text style={{ fontSize: 12, color: Colors.secondary.DEFAULT, fontWeight: "500" }}>
                  {t("profile.activeNow")}
                </Text>
              </View>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: Colors.secondary.DEFAULT,
                }}
              />
            </View>
          </View>
        </Card>

        {/* Sign out all */}
        <Card>
          <TouchableOpacity
            onPress={handleSignOutAll}
            disabled={signingOutAll}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 4,
              gap: 14,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: Colors.danger.DEFAULT + "15",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <LogOut size={20} color={Colors.danger.DEFAULT} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: "600", color: Colors.danger.DEFAULT }}>
                Sign Out All Devices
              </Text>
              <Text style={{ fontSize: 13, color: Colors.text.secondary, marginTop: 2 }}>
                Revokes all active sessions
              </Text>
            </View>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
