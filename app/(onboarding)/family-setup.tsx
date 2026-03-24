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
import {
  Plus,
  Trash2,
  Calendar,
  ArrowRight,
  CheckCircle,
  FileText,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Button, Input, Avatar, Badge, ProgressBar } from "../../src/components/ui";
import { useToast } from "../../src/components/ui/Toast";
import { Colors, Shadows } from "../../src/constants/colors";
import { useAuthStore } from "../../src/stores/authStore";
import { supabase } from "../../src/lib/supabase";

interface ChildForm {
  id: string;
  fullName: string;
  dateOfBirth: string;
  medicalNotes: string;
}

function createEmptyChild(): ChildForm {
  return {
    id: Date.now().toString(),
    fullName: "",
    dateOfBirth: "",
    medicalNotes: "",
  };
}

export default function FamilySetupScreen() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const toast = useToast();

  const [children, setChildren] = useState<ChildForm[]>([createEmptyChild()]);
  const [saving, setSaving] = useState(false);

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

  const updateChild = (id: string, field: keyof ChildForm, value: string) => {
    setChildren((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const addChild = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setChildren((prev) => [...prev, createEmptyChild()]);
  };

  const removeChild = (id: string) => {
    if (children.length <= 1) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setChildren((prev) => prev.filter((c) => c.id !== id));
  };

  const handleSave = async () => {
    if (!profile) return;

    // Validate at least one child
    const validChildren = children.filter(
      (c) => c.fullName.trim() && c.dateOfBirth.trim()
    );

    if (validChildren.length === 0) {
      Alert.alert("Missing Info", "Please fill in at least one child's name and date of birth.");
      return;
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    for (const child of validChildren) {
      if (!dateRegex.test(child.dateOfBirth)) {
        Alert.alert("Invalid Date", `"${child.fullName}" has an invalid date. Use YYYY-MM-DD format.`);
        return;
      }
    }

    setSaving(true);
    try {
      const records = validChildren.map((c) => ({
        parent_id: profile.id,
        full_name: c.fullName.trim(),
        date_of_birth: c.dateOfBirth.trim(),
        medical_notes: c.medicalNotes.trim() || null,
      }));

      const { error } = await supabase.from("children").insert(records);
      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.show(
        `${validChildren.length} child${validChildren.length > 1 ? "ren" : ""} added!`
      );
      router.replace("/(tabs)/home");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to save";
      Alert.alert("Error", msg);
    } finally {
      setSaving(false);
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
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Progress bar */}
          <View style={{ marginBottom: 16, paddingTop: 16 }}>
            <ProgressBar steps={2} currentStep={1} />
          </View>

          {/* Header */}
          <Animated.View style={{ opacity: headerOpacity, marginBottom: 28 }}>
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
              The Family Vault
            </Text>
            <Text
              style={{
                fontSize: 15,
                color: Colors.text.secondary,
                lineHeight: 22,
              }}
            >
              Add your children so you can manage their schedules, attendance, and payments from one account.
            </Text>
          </Animated.View>

          {/* Children forms */}
          <Animated.View style={{ opacity: formOpacity, gap: 16 }}>
            {children.map((child, index) => (
              <Card key={child.id} style={{ position: "relative" }}>
                <View style={{ gap: 14 }}>
                  {/* Child header */}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <View
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          backgroundColor: Colors.primary.light + "20",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "700",
                            color: Colors.primary.DEFAULT,
                          }}
                        >
                          {index + 1}
                        </Text>
                      </View>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "700",
                          color: Colors.text.primary,
                        }}
                      >
                        {child.fullName.trim() || `Child ${index + 1}`}
                      </Text>
                    </View>
                    {children.length > 1 && (
                      <TouchableOpacity
                        onPress={() => removeChild(child.id)}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          backgroundColor: Colors.danger.DEFAULT + "15",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Trash2 size={16} color={Colors.danger.DEFAULT} />
                      </TouchableOpacity>
                    )}
                  </View>

                  <Input
                    label="Full Name *"
                    placeholder="e.g. Emma Johnson"
                    value={child.fullName}
                    onChangeText={(t) => updateChild(child.id, "fullName", t)}
                    autoCapitalize="words"
                  />
                  <Input
                    label="Date of Birth *"
                    placeholder="YYYY-MM-DD"
                    value={child.dateOfBirth}
                    onChangeText={(t) => updateChild(child.id, "dateOfBirth", t)}
                    keyboardType="numbers-and-punctuation"
                    icon={<Calendar size={18} color={Colors.text.secondary} />}
                  />
                  <Input
                    label="Medical / Special Notes"
                    placeholder="Allergies, conditions... (optional)"
                    value={child.medicalNotes}
                    onChangeText={(t) => updateChild(child.id, "medicalNotes", t)}
                    autoCapitalize="sentences"
                    multiline
                    numberOfLines={2}
                    icon={<FileText size={18} color={Colors.text.secondary} />}
                  />
                </View>
              </Card>
            ))}

            {/* Add another */}
            <TouchableOpacity
              onPress={addChild}
              activeOpacity={0.7}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                paddingVertical: 16,
                borderRadius: 16,
                borderWidth: 2,
                borderColor: Colors.primary.DEFAULT + "40",
                borderStyle: "dashed",
                backgroundColor: Colors.primary.light + "08",
              }}
            >
              <Plus size={18} color={Colors.primary.DEFAULT} strokeWidth={2.5} />
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "700",
                  color: Colors.primary.DEFAULT,
                }}
              >
                Add Another Child
              </Text>
            </TouchableOpacity>

            {/* Buttons */}
            <View style={{ gap: 10, marginTop: 8 }}>
              <Button
                title="Save & Continue to Dashboard"
                onPress={handleSave}
                loading={saving}
                icon={<ArrowRight size={18} color="#FFF" />}
              />
              <Button
                title="Skip for now"
                onPress={() => router.replace("/(tabs)/home")}
                variant="ghost"
              />
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
