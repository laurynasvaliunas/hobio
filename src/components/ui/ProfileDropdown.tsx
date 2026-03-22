import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  Pressable,
  Alert,
  Linking,
} from "react-native";
import {
  CreditCard,
  Bell,
  Moon,
  Sun,
  HelpCircle,
  Shield,
  LogOut,
  ChevronRight,
  Baby,
  Settings,
  X,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../hooks/useTheme";
import { useThemeStore } from "../../stores/themeStore";
import { useAuthStore } from "../../stores/authStore";
import { useChildren } from "../../hooks/useChildren";
import { Avatar } from "./Avatar";
import { Fonts } from "../../constants/fonts";

interface Props {
  visible: boolean;
  onClose: () => void;
}

/**
 * Elite Profile Dropdown — slides in from right as a modal drawer.
 *
 * Hierarchy:
 *  - Top: Identity (Who am I?)
 *  - Middle: Quick Actions (Payments, Notifications, Dark Mode)
 *  - Bottom: Support + Logout
 */
export function ProfileDropdown({ visible, onClose }: Props) {
  const { colors, shadows, isDark } = useTheme();
  const router = useRouter();
  const { profile, signOut } = useAuthStore();
  const toggleDark = useThemeStore((s) => s.setMode);
  const isParent = profile?.role === "parent";
  const { children } = useChildren(isParent ? profile?.id ?? "" : "");

  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, fadeAnim]);

  const navigate = (path: string) => {
    onClose();
    setTimeout(() => router.push(path as never), 150);
  };

  const handleDarkToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleDark(isDark ? "light" : "dark");
  };

  const handleSignOut = () => {
    onClose();
    setTimeout(() => {
      Alert.alert("Sign Out", "Are you sure you want to sign out?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut();
            } catch {
              Alert.alert("Error", "Failed to sign out.");
            }
          },
        },
      ]);
    }, 200);
  };

  const roleLabel =
    profile?.role === "organizer"
      ? "Organizer"
      : profile?.role === "parent"
      ? "Parent"
      : "Participant";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Pressable
        style={{ flex: 1 }}
        onPress={onClose}
      >
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: "#00000060",
            opacity: fadeAnim,
          }}
        />
      </Pressable>

      {/* Drawer panel — right side */}
      <Animated.View
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: 300,
          backgroundColor: colors.surface,
          ...shadows.card,
          transform: [{ translateX: slideAnim }],
          paddingTop: 60,
          paddingHorizontal: 20,
          paddingBottom: 40,
        }}
      >
        {/* Close button */}
        <TouchableOpacity
          onPress={onClose}
          style={{ position: "absolute", top: 56, right: 16, zIndex: 10 }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={22} color={colors.text.secondary} />
        </TouchableOpacity>

        {/* ── Identity Block ── */}
        <TouchableOpacity
          onPress={() => navigate("/(tabs)/profile/account")}
          activeOpacity={0.7}
          style={{
            alignItems: "center",
            paddingBottom: 20,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            marginBottom: 8,
          }}
        >
          <Avatar
            name={profile?.full_name ?? "User"}
            imageUrl={profile?.avatar_url}
            size={72}
          />
          <Text
            style={{
              fontSize: 18,
              fontFamily: Fonts.bold,
              color: colors.text.primary,
              marginTop: 12,
            }}
          >
            {profile?.full_name}
          </Text>
          <Text
            style={{
              fontSize: 13,
              fontFamily: Fonts.regular,
              color: colors.text.secondary,
              marginTop: 2,
            }}
          >
            {profile?.email}
          </Text>
          <View
            style={{
              marginTop: 8,
              backgroundColor: colors.primary.DEFAULT + "18",
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 12,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontFamily: Fonts.semiBold,
                color: colors.primary.DEFAULT,
              }}
            >
              {roleLabel}
            </Text>
          </View>
        </TouchableOpacity>

        {/* ── Switch Profile (for parents with children) ── */}
        {isParent && children.length > 0 && (
          <TouchableOpacity
            onPress={() => navigate("/(tabs)/profile/family")}
            activeOpacity={0.7}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 14,
              gap: 12,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
              marginBottom: 8,
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: colors.accent.DEFAULT + "18",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Baby size={18} color={colors.accent.DEFAULT} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: Fonts.semiBold,
                  color: colors.text.primary,
                }}
              >
                Switch Profile
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: Fonts.regular,
                  color: colors.text.secondary,
                }}
              >
                {children.length} child{children.length !== 1 ? "ren" : ""}
              </Text>
            </View>
            <ChevronRight size={16} color={colors.text.secondary} />
          </TouchableOpacity>
        )}

        {/* ── Quick Actions ── */}
        <View style={{ gap: 2, marginTop: 4 }}>
          <DropdownItem
            icon={<CreditCard size={18} color={colors.primary.DEFAULT} />}
            label="My Subscriptions"
            onPress={() => navigate("/(tabs)/profile")}
            colors={colors}
          />
          <DropdownItem
            icon={<Bell size={18} color={colors.primary.DEFAULT} />}
            label="Notification Settings"
            onPress={() => navigate("/(tabs)/profile/notifications")}
            colors={colors}
          />
          <DropdownItem
            icon={<Settings size={18} color={colors.primary.DEFAULT} />}
            label="All Settings"
            onPress={() => navigate("/(tabs)/profile")}
            colors={colors}
          />

          {/* Dark Mode Toggle */}
          <TouchableOpacity
            onPress={handleDarkToggle}
            activeOpacity={0.6}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 13,
              gap: 12,
            }}
          >
            {isDark ? (
              <Sun size={18} color={colors.warning.DEFAULT} />
            ) : (
              <Moon size={18} color={colors.primary.DEFAULT} />
            )}
            <Text
              style={{
                flex: 1,
                fontSize: 15,
                fontFamily: Fonts.medium,
                color: colors.text.primary,
              }}
            >
              {isDark ? "Light Mode" : "Dark Mode"}
            </Text>
            <View
              style={{
                width: 44,
                height: 24,
                borderRadius: 12,
                backgroundColor: isDark ? colors.primary.DEFAULT : colors.border,
                justifyContent: "center",
                paddingHorizontal: 2,
              }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: "#FFFFFF",
                  alignSelf: isDark ? "flex-end" : "flex-start",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.15,
                  shadowRadius: 2,
                  elevation: 2,
                }}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Support & Legal ── */}
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: colors.border,
            marginTop: 8,
            paddingTop: 8,
            gap: 2,
          }}
        >
          <DropdownItem
            icon={<HelpCircle size={18} color={colors.text.secondary} />}
            label="Help Center"
            onPress={() => Linking.openURL("https://hobio.app/help")}
            colors={colors}
          />
          <DropdownItem
            icon={<Shield size={18} color={colors.text.secondary} />}
            label="Privacy Policy"
            onPress={() => Linking.openURL("https://hobio.app/privacy")}
            colors={colors}
          />
        </View>

        {/* ── Sign Out ── */}
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: colors.border,
            marginTop: 8,
            paddingTop: 12,
          }}
        >
          <TouchableOpacity
            onPress={handleSignOut}
            activeOpacity={0.6}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 13,
              gap: 12,
            }}
          >
            <LogOut size={18} color={colors.danger.DEFAULT} />
            <Text
              style={{
                fontSize: 15,
                fontFamily: Fonts.semiBold,
                color: colors.danger.DEFAULT,
              }}
            >
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

/* ── Reusable row item ── */
function DropdownItem({
  icon,
  label,
  onPress,
  colors,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  colors: ReturnType<typeof import("../../hooks/useTheme").useTheme>["colors"];
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.6}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 13,
        gap: 12,
      }}
    >
      {icon}
      <Text
        style={{
          flex: 1,
          fontSize: 15,
          fontFamily: Fonts.medium,
          color: colors.text.primary,
        }}
      >
        {label}
      </Text>
      <ChevronRight size={16} color={colors.text.secondary} />
    </TouchableOpacity>
  );
}
