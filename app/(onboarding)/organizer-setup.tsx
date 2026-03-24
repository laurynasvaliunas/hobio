import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Input, Card, ProgressBar } from "../../src/components/ui";
import { useToast } from "../../src/components/ui/Toast";
import { Colors, Shadows } from "../../src/constants/colors";
import { SPORT_CATEGORIES } from "../../src/constants/categories";
import { useAuthStore } from "../../src/stores/authStore";
import { useGroupStore } from "../../src/stores/groupStore";

export default function OrganizerSetupScreen() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const createOrganization = useGroupStore((s) => s.createOrganization);
  const toast = useToast();

  const [orgName, setOrgName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Animation
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(formOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleCategorySelect = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(key);
  };

  const handleCreate = async () => {
    if (!orgName.trim()) {
      Alert.alert("Error", "Please enter your organization name.");
      return;
    }
    if (!selectedCategory) {
      Alert.alert("Error", "Please select a sport category.");
      return;
    }
    if (!profile) return;

    setLoading(true);
    try {
      await createOrganization({
        owner_id: profile.id,
        name: orgName.trim(),
        sport_category: selectedCategory,
        description: null,
        logo_url: null,
        website: null,
        phone: null,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.show("Organization created!");
      router.replace("/(tabs)/home");
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
      edges={["top"]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingVertical: 20,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Progress bar */}
          <View style={{ marginBottom: 16 }}>
            <ProgressBar steps={2} currentStep={1} />
          </View>

          {/* Back */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ marginBottom: 24 }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft size={24} color={Colors.text.primary} />
          </TouchableOpacity>

          {/* Header */}
          <Animated.View style={{ opacity: headerOpacity, marginBottom: 32 }}>
            <Image
              source={require("../../assets/hobio-brand-logo.png")}
              style={{ width: 140, height: 56, marginBottom: 16 }}
              resizeMode="contain"
            />
            <Text
              style={{
                fontSize: 28,
                fontWeight: "800",
                color: Colors.text.primary,
                marginBottom: 8,
                letterSpacing: -0.5,
              }}
            >
              Set up your organization
            </Text>
            <Text
              style={{
                fontSize: 15,
                color: Colors.text.secondary,
                lineHeight: 22,
              }}
            >
              Create your first organization to start managing groups, schedules, and members.
            </Text>
          </Animated.View>

          {/* Form */}
          <Animated.View style={{ opacity: formOpacity }}>
            <Input
              label="Organization Name"
              placeholder="e.g. Downtown Football Academy"
              value={orgName}
              onChangeText={setOrgName}
              autoCapitalize="words"
              success={orgName.trim().length >= 2 ? "Looks good!" : undefined}
              containerStyle={{ marginBottom: 24 }}
            />

            {/* Category selector */}
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: Colors.text.primary,
                marginBottom: 12,
                marginLeft: 4,
              }}
            >
              Sport / Activity
            </Text>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 10,
                marginBottom: 40,
              }}
            >
              {SPORT_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.key;
                return (
                  <TouchableOpacity
                    key={cat.key}
                    onPress={() => handleCategorySelect(cat.key)}
                    activeOpacity={0.7}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 20,
                      backgroundColor: isSelected
                        ? Colors.primary.DEFAULT
                        : Colors.surface,
                      borderWidth: 1.5,
                      borderColor: isSelected
                        ? Colors.primary.DEFAULT
                        : Colors.border,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: isSelected ? "#FFFFFF" : Colors.text.primary,
                      }}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Create */}
            <Button
              title="Create Organization"
              onPress={handleCreate}
              loading={loading}
              icon={<ArrowRight size={18} color="#FFF" />}
            />
            <Button
              title="Skip for now"
              onPress={() => router.replace("/(tabs)/home")}
              variant="ghost"
              style={{ marginTop: 8 }}
            />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
