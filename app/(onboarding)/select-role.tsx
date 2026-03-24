import React, { useState, useRef, useEffect } from "react";
import { View, Text, Image, TouchableOpacity, Alert, Animated, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { Briefcase, User, Users, ChevronRight, Sparkles } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, ProgressBar } from "../../src/components/ui";
import { Colors, Shadows } from "../../src/constants/colors";
import { useAuthStore } from "../../src/stores/authStore";
import type { UserRole } from "../../src/types/database.types";

const { width } = Dimensions.get("window");

interface RoleOption {
  role: UserRole;
  icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>;
  title: string;
  description: string;
  color: string;
  gradient: string;
}

const ROLES: RoleOption[] = [
  {
    role: "organizer",
    icon: Briefcase,
    title: "I'm an Organizer",
    description:
      "I run hobby groups, classes, or a sports club.\nI want to manage participants, schedules, and billing.",
    color: Colors.primary.DEFAULT,
    gradient: Colors.primary.light,
  },
  {
    role: "participant",
    icon: User,
    title: "I'm a Participant",
    description:
      "I attend groups and classes.\nI want to see my schedule and stay on top of things.",
    color: Colors.secondary.DEFAULT,
    gradient: Colors.secondary.light,
  },
  {
    role: "parent",
    icon: Users,
    title: "I'm a Parent",
    description:
      "I manage my children's activities.\nI want one place for all their schedules and payments.",
    color: Colors.accent.DEFAULT,
    gradient: Colors.accent.light,
  },
];

export default function SelectRoleScreen() {
  const router = useRouter();
  const updateRole = useAuthStore((s) => s.updateRole);
  const profile = useAuthStore((s) => s.profile);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);

  // Entrance animations
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerY = useRef(new Animated.Value(20)).current;
  const cardAnimations = ROLES.map(() => ({
    opacity: useRef(new Animated.Value(0)).current,
    translateY: useRef(new Animated.Value(40)).current,
    scale: useRef(new Animated.Value(0.95)).current,
  }));
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // Header
      Animated.parallel([
        Animated.timing(headerOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(headerY, {
          toValue: 0,
          tension: 80,
          friction: 12,
          useNativeDriver: true,
        }),
      ]),
      // Cards stagger
      Animated.stagger(
        150,
        cardAnimations.map((anim) =>
          Animated.parallel([
            Animated.timing(anim.opacity, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.spring(anim.translateY, {
              toValue: 0,
              tension: 70,
              friction: 10,
              useNativeDriver: true,
            }),
            Animated.spring(anim.scale, {
              toValue: 1,
              tension: 70,
              friction: 10,
              useNativeDriver: true,
            }),
          ])
        )
      ),
      // Button
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSelect = (role: UserRole) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedRole(role);
  };

  const handleContinue = async () => {
    if (!selectedRole) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setLoading(true);
    try {
      await updateRole(selectedRole);

      if (selectedRole === "organizer") {
        router.replace("/(onboarding)/organizer-setup");
      } else if (selectedRole === "parent") {
        router.replace("/(onboarding)/family-setup");
      } else {
        // Participant -- go straight to dashboard
        router.replace("/(tabs)/home");
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Something went wrong";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: Colors.background }}
      edges={["top", "bottom"]}
    >
      <View
        style={{
          flex: 1,
          paddingHorizontal: 24,
          justifyContent: "space-between",
          paddingTop: 16,
          paddingBottom: 24,
        }}
      >
        {/* Progress bar */}
        <ProgressBar steps={2} currentStep={0} />

        {/* Header */}
        <Animated.View
          style={{
            opacity: headerOpacity,
            transform: [{ translateY: headerY }],
          }}
        >
          <Image
            source={require("../../assets/hobio-brand-logo.png")}
            style={{ width: 140, height: 56, marginBottom: 12 }}
            resizeMode="contain"
          />
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <Sparkles size={22} color={Colors.primary.DEFAULT} />
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: Colors.primary.DEFAULT,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              Choose Your Path
            </Text>
          </View>
          <Text
            style={{
              fontSize: 30,
              fontWeight: "800",
              color: Colors.text.primary,
              marginBottom: 6,
              letterSpacing: -0.5,
            }}
          >
            How will you use Hobio?
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: Colors.text.secondary,
              lineHeight: 22,
            }}
          >
            Select your role to personalize your experience.{"\n"}You can always change this later.
          </Text>
        </Animated.View>

        {/* Role Cards */}
        <View style={{ gap: 14 }}>
          {ROLES.map((option, index) => {
            const isSelected = selectedRole === option.role;
            const anim = cardAnimations[index];

            return (
              <Animated.View
                key={option.role}
                style={{
                  opacity: anim.opacity,
                  transform: [
                    { translateY: anim.translateY },
                    { scale: anim.scale },
                  ],
                }}
              >
                <TouchableOpacity
                  onPress={() => handleSelect(option.role)}
                  activeOpacity={0.8}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 20,
                    borderRadius: 20,
                    backgroundColor: isSelected
                      ? option.color + "10"
                      : Colors.surface,
                    borderWidth: 2.5,
                    borderColor: isSelected ? option.color : "transparent",
                    gap: 16,
                    ...(isSelected
                      ? {
                          shadowColor: option.color,
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.2,
                          shadowRadius: 12,
                          elevation: 6,
                        }
                      : Shadows.card),
                  }}
                >
                  <View
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 18,
                      backgroundColor: isSelected
                        ? option.color
                        : option.color + "15",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <option.icon
                      size={26}
                      color={isSelected ? "#FFFFFF" : option.color}
                      strokeWidth={2}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "700",
                        color: Colors.text.primary,
                        marginBottom: 4,
                      }}
                    >
                      {option.title}
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        color: Colors.text.secondary,
                        lineHeight: 18,
                      }}
                    >
                      {option.description}
                    </Text>
                  </View>
                  {isSelected && (
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: option.color,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <ChevronRight size={16} color="#FFF" strokeWidth={2.5} />
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {/* Continue */}
        <Animated.View style={{ opacity: buttonOpacity }}>
          <Button
            title="Continue"
            onPress={handleContinue}
            loading={loading}
            disabled={!selectedRole}
          />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
