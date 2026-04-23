import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Sun, Moon, Monitor, Check } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card } from "../../../src/components/ui";
import { useToast } from "../../../src/components/ui/Toast";
import { useTheme } from "../../../src/hooks/useTheme";
import { useAuthStore } from "../../../src/stores/authStore";
import { usePreferences } from "../../../src/hooks/usePreferences";
import { useThemeStore } from "../../../src/stores/themeStore";
import { Fonts } from "../../../src/constants/fonts";
import type { ThemeMode } from "../../../src/types/database.types";

export default function AppearanceSettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);
  const toast = useToast();
  const { colors } = useTheme();
  const { updateTheme } = usePreferences(profile?.id ?? "");
  const setThemeMode = useThemeStore((s) => s.setMode);
  // Drive the selection indicator from the actually-applied store mode, not
  // the DB value, so the checkmark reflects the real theme state even while
  // the DB write is in flight or usePreferences is still loading.
  const currentMode = useThemeStore((s) => s.mode);

  // THEME_OPTIONS is declared inside the component so label/subtitle can call
  // `t()`. The icon references are stable across renders.
  const THEME_OPTIONS: {
    mode: ThemeMode;
    label: string;
    subtitle: string;
    icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;
  }[] = [
    {
      mode: "light",
      label: t("profile.themeLight"),
      subtitle: t("profile.themeLightSub"),
      icon: Sun,
    },
    {
      mode: "dark",
      label: t("profile.themeDark"),
      subtitle: t("profile.themeDarkSub"),
      icon: Moon,
    },
    {
      mode: "system",
      label: t("profile.themeSystem"),
      subtitle: t("profile.themeSystemSub"),
      icon: Monitor,
    },
  ];

  const handleSelect = async (mode: ThemeMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setThemeMode(mode);
    try {
      await updateTheme(mode);
      const toastKey =
        mode === "dark"
          ? "profile.themeSetDark"
          : mode === "light"
          ? "profile.themeSetLight"
          : "profile.themeSetSystem";
      toast.show(t(toastKey));
    } catch {
      toast.show(t("profile.saveFailed"), "error");
    }
  };

  // Adaptive icon colors per option
  const getIconColor = (mode: ThemeMode, isSelected: boolean) => {
    if (!isSelected) return colors.text.secondary;
    switch (mode) {
      case "light":
        return colors.warning.DEFAULT;
      case "dark":
        return colors.primary.DEFAULT;
      case "system":
        return colors.text.secondary;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
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
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontFamily: Fonts.bold, color: colors.text.primary }}>
          {t("profile.appearance")}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
      >
        <Text
          style={{
            fontSize: 15,
            fontFamily: Fonts.regular,
            color: colors.text.secondary,
            lineHeight: 22,
            marginBottom: 20,
          }}
        >
          Choose how Hobio looks on your device. "Night Camp" mode uses a deep navy-charcoal palette
          that's easier on the eyes at night.
        </Text>

        {/* Preview swatch */}
        <View
          style={{
            flexDirection: "row",
            gap: 8,
            marginBottom: 24,
            justifyContent: "center",
          }}
        >
          {[
            colors.primary.DEFAULT,
            colors.secondary.DEFAULT,
            colors.accent.DEFAULT,
            colors.danger.DEFAULT,
            colors.background,
            colors.surface,
          ].map((c, i) => (
            <View
              key={i}
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                backgroundColor: c,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            />
          ))}
        </View>

        <View style={{ gap: 12 }}>
          {THEME_OPTIONS.map((option) => {
            const isSelected = currentMode === option.mode;
            const iconColor = getIconColor(option.mode, isSelected);
            return (
              <TouchableOpacity
                key={option.mode}
                onPress={() => handleSelect(option.mode)}
                activeOpacity={0.7}
              >
                <Card
                  style={{
                    borderWidth: 2,
                    borderColor: isSelected ? colors.primary.DEFAULT : "transparent",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 14,
                        backgroundColor: isSelected
                          ? iconColor + "20"
                          : colors.border + "60",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <option.icon size={24} color={iconColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 17,
                          fontFamily: Fonts.semiBold,
                          color: colors.text.primary,
                        }}
                      >
                        {option.label}
                      </Text>
                      <Text
                        style={{
                          fontSize: 13,
                          fontFamily: Fonts.regular,
                          color: colors.text.secondary,
                          marginTop: 2,
                        }}
                      >
                        {option.subtitle}
                      </Text>
                    </View>
                    {isSelected && (
                      <View
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor: colors.primary.DEFAULT,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Check size={14} color="#FFF" strokeWidth={3} />
                      </View>
                    )}
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
