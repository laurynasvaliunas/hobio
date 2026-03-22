import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Sun, Moon, Monitor, Check } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card } from "../../../src/components/ui";
import { useToast } from "../../../src/components/ui/Toast";
import { useTheme } from "../../../src/hooks/useTheme";
import { useAuthStore } from "../../../src/stores/authStore";
import { usePreferences } from "../../../src/hooks/usePreferences";
import { useThemeStore } from "../../../src/stores/themeStore";
import { Fonts } from "../../../src/constants/fonts";
import type { ThemeMode } from "../../../src/types/database.types";

const THEME_OPTIONS: {
  mode: ThemeMode;
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;
}[] = [
  {
    mode: "light",
    label: "Light",
    subtitle: "Bright & vibrant — classic Hobio",
    icon: Sun,
  },
  {
    mode: "dark",
    label: "Night Camp",
    subtitle: "Easy on the eyes — deep navy charcoal",
    icon: Moon,
  },
  {
    mode: "system",
    label: "System",
    subtitle: "Match your device settings",
    icon: Monitor,
  },
];

export default function AppearanceSettingsScreen() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const toast = useToast();
  const { colors, shadows, isDark } = useTheme();
  const { theme: currentTheme, updateTheme } = usePreferences(profile?.id ?? "");
  const setThemeMode = useThemeStore((s) => s.setMode);

  const handleSelect = async (mode: ThemeMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setThemeMode(mode);
    try {
      await updateTheme(mode);
      toast.show(`Theme set to ${mode === "dark" ? "Night Camp" : mode}`);
    } catch {
      toast.show("Failed to save", "error");
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
          Appearance
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
            const isSelected = currentTheme === option.mode;
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
