import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  StyleSheet,
  Platform,
} from "react-native";
import {
  X,
  Sparkles,
  Check,
  Sprout,
  Baby,
  UserRound,
  Users,
  Ticket,
  Clock,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Colors, Shadows } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";
import { SPORT_CATEGORIES } from "../../constants/categories";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const DRAWER_HEIGHT = SCREEN_HEIGHT * 0.72;

export interface FilterState {
  sportCategories: string[];
  audience: "all" | "kids" | "adults";
  ageRange: [number, number];
  availability: "all" | "spots" | "waitlist";
}

export const DEFAULT_FILTERS: FilterState = {
  sportCategories: [],
  audience: "all",
  ageRange: [3, 18],
  availability: "all",
};

interface FilterDrawerProps {
  visible: boolean;
  filters: FilterState;
  resultCount?: number;
  onApply: (filters: FilterState) => void;
  onClose: () => void;
  onReset: () => void;
}

// ── Age range presets with playful sprout sizes ──
const AGE_PRESETS = [
  { label: "3–6", range: [3, 6] as [number, number], sproutSize: 14, emoji: "🌱" },
  { label: "6–10", range: [6, 10] as [number, number], sproutSize: 18, emoji: "🌿" },
  { label: "10–14", range: [10, 14] as [number, number], sproutSize: 22, emoji: "🌳" },
  { label: "14–18", range: [14, 18] as [number, number], sproutSize: 26, emoji: "🌲" },
  { label: "All", range: [3, 18] as [number, number], sproutSize: 20, emoji: "🌍" },
];

export function FilterDrawer({
  visible,
  filters,
  resultCount,
  onApply,
  onClose,
  onReset,
}: FilterDrawerProps) {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const bubbleScale = useRef(new Animated.Value(0.8)).current;
  const [local, setLocal] = useState<FilterState>(filters);

  useEffect(() => {
    if (visible) {
      setLocal(filters);
      Animated.spring(slideAnim, {
        toValue: 1,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim, filters]);

  // Bubble bounce when result count changes
  useEffect(() => {
    Animated.sequence([
      Animated.spring(bubbleScale, {
        toValue: 1.08,
        tension: 300,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.spring(bubbleScale, {
        toValue: 1,
        tension: 200,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, [resultCount, local]);

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [DRAWER_HEIGHT, 0],
  });

  const backdropOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.4],
  });

  const toggleCategory = useCallback((key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLocal((prev) => ({
      ...prev,
      sportCategories: prev.sportCategories.includes(key)
        ? prev.sportCategories.filter((c) => c !== key)
        : [...prev.sportCategories, key],
    }));
  }, []);

  const handleApply = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onApply(local);
  }, [local, onApply]);

  const handleReset = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLocal(DEFAULT_FILTERS);
    onReset();
  }, [onReset]);

  const activeFilterCount =
    local.sportCategories.length +
    (local.audience !== "all" ? 1 : 0) +
    (local.availability !== "all" ? 1 : 0) +
    (local.ageRange[0] !== 3 || local.ageRange[1] !== 18 ? 1 : 0);

  if (!visible) return null;

  // Audience colors
  const audienceConfig = {
    all: { color: Colors.primary.DEFAULT, bg: Colors.primary.DEFAULT, icon: Users },
    kids: { color: Colors.secondary.DEFAULT, bg: Colors.secondary.DEFAULT, icon: Baby },
    adults: { color: Colors.accent.DEFAULT, bg: Colors.accent.DEFAULT, icon: UserRound },
  };

  const count = resultCount ?? 0;

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Backdrop */}
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "#000", opacity: backdropOpacity }]}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} activeOpacity={1} />
      </Animated.View>

      {/* Drawer */}
      <Animated.View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: DRAWER_HEIGHT,
          backgroundColor: Colors.surface,
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          transform: [{ translateY }],
          ...Shadows.card,
          shadowOpacity: 0.15,
          elevation: 16,
        }}
      >
        {/* Handle */}
        <View style={{ alignItems: "center", paddingTop: 12, paddingBottom: 4 }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border }} />
        </View>

        {/* Header */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingBottom: 14 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Sparkles size={22} color={Colors.accent.DEFAULT} />
            <Text style={{ fontSize: 22, fontFamily: Fonts.extraBold, color: Colors.text.primary }}>
              Search & Fun
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: Colors.background,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={18} color={Colors.text.secondary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Audience: Segmented Toggle ── */}
          <SectionLabel label="Who's it for?" />
          <View
            style={{
              flexDirection: "row",
              gap: 10,
              marginBottom: 24,
              backgroundColor: Colors.background,
              borderRadius: 20,
              padding: 4,
            }}
          >
            {(["all", "kids", "adults"] as const).map((option) => {
              const labels = { all: "Everyone", kids: "For Kids", adults: "For Adults" };
              const active = local.audience === option;
              const cfg = audienceConfig[option];
              const IconComp = cfg.icon;
              return (
                <TouchableOpacity
                  key={option}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setLocal((prev) => ({ ...prev, audience: option }));
                  }}
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    paddingVertical: 12,
                    borderRadius: 16,
                    backgroundColor: active ? cfg.bg : "transparent",
                  }}
                >
                  <IconComp size={16} color={active ? "#FFF" : Colors.text.secondary} />
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: active ? Fonts.bold : Fonts.medium,
                      color: active ? "#FFF" : Colors.text.secondary,
                    }}
                  >
                    {labels[option]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Age Range: Playful Sprout Selector ── */}
          <SectionLabel label="Age range" />
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 24 }}>
            {AGE_PRESETS.map((item) => {
              const active =
                local.ageRange[0] === item.range[0] && local.ageRange[1] === item.range[1];
              return (
                <TouchableOpacity
                  key={item.label}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setLocal((prev) => ({ ...prev, ageRange: item.range }));
                  }}
                  style={{
                    alignItems: "center",
                    gap: 6,
                    paddingVertical: 10,
                    paddingHorizontal: 10,
                    borderRadius: 16,
                    backgroundColor: active ? Colors.secondary.DEFAULT + "15" : "transparent",
                    borderWidth: active ? 1.5 : 0,
                    borderColor: active ? Colors.secondary.DEFAULT : "transparent",
                  }}
                >
                  <Sprout
                    size={item.sproutSize}
                    color={active ? Colors.secondary.DEFAULT : Colors.text.secondary + "80"}
                    strokeWidth={active ? 2.5 : 2}
                  />
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: active ? Fonts.bold : Fonts.medium,
                      color: active ? Colors.secondary.DEFAULT : Colors.text.secondary,
                    }}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Group Type: Pills ── */}
          <SectionLabel label="What kind of hobby?" />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
            {SPORT_CATEGORIES.map((cat) => {
              const active = local.sportCategories.includes(cat.key);
              return (
                <TouchableOpacity
                  key={cat.key}
                  onPress={() => toggleCategory(cat.key)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 14,
                    paddingVertical: 9,
                    borderRadius: 24,
                    backgroundColor: active ? Colors.primary.DEFAULT : Colors.background,
                    borderWidth: active ? 0 : 1,
                    borderColor: Colors.border,
                  }}
                >
                  {active && <Check size={14} color="#FFF" strokeWidth={3} />}
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: active ? Fonts.semiBold : Fonts.medium,
                      color: active ? "#FFF" : Colors.text.primary,
                    }}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Availability ── */}
          <SectionLabel label="Availability" />
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 24 }}>
            {([
              { key: "all" as const, label: "All", icon: Users },
              { key: "spots" as const, label: "Spots Open", icon: Ticket },
              { key: "waitlist" as const, label: "Waitlist", icon: Clock },
            ]).map((option) => {
              const active = local.availability === option.key;
              const IconComp = option.icon;
              return (
                <TouchableOpacity
                  key={option.key}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setLocal((prev) => ({ ...prev, availability: option.key }));
                  }}
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    paddingVertical: 12,
                    borderRadius: 16,
                    backgroundColor: active ? Colors.primary.DEFAULT : Colors.background,
                    borderWidth: active ? 0 : 1,
                    borderColor: Colors.border,
                  }}
                >
                  <IconComp size={14} color={active ? "#FFF" : Colors.text.secondary} />
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: active ? Fonts.semiBold : Fonts.medium,
                      color: active ? "#FFF" : Colors.text.primary,
                    }}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* ── Sticky footer with "Find adventures" bubble ── */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            flexDirection: "row",
            gap: 12,
            paddingHorizontal: 24,
            paddingTop: 16,
            paddingBottom: Platform.OS === "ios" ? 40 : 24,
            backgroundColor: Colors.surface,
            borderTopWidth: 1,
            borderTopColor: Colors.border + "60",
          }}
        >
          <TouchableOpacity
            onPress={handleReset}
            style={{
              paddingVertical: 14,
              paddingHorizontal: 20,
              borderRadius: 20,
              borderWidth: 1.5,
              borderColor: Colors.border,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 14, fontFamily: Fonts.semiBold, color: Colors.text.secondary }}>
              Reset
            </Text>
          </TouchableOpacity>

          <Animated.View style={{ flex: 1, transform: [{ scale: bubbleScale }] }}>
            <TouchableOpacity
              onPress={handleApply}
              style={{
                paddingVertical: 14,
                borderRadius: 20,
                backgroundColor: Colors.accent.DEFAULT,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
                ...Shadows.button,
                shadowColor: Colors.accent.DEFAULT,
              }}
            >
              <Sparkles size={18} color="#FFF" />
              <Text style={{ fontSize: 15, fontFamily: Fonts.extraBold, color: "#FFF" }}>
                {count > 0
                  ? `Find ${count} adventure${count !== 1 ? "s" : ""} near you!`
                  : activeFilterCount > 0
                  ? "Show results"
                  : "Explore all"}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
}

// ── Small helper ──
function SectionLabel({ label }: { label: string }) {
  return (
    <Text
      style={{
        fontSize: 13,
        fontFamily: Fonts.extraBold,
        color: Colors.text.secondary,
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: 10,
      }}
    >
      {label}
    </Text>
  );
}
