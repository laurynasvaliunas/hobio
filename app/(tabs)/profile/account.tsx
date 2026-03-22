import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Camera, Save, Lock } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as Haptics from "expo-haptics";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Button, Input, Avatar } from "../../../src/components/ui";
import { useToast } from "../../../src/components/ui/Toast";
import { Colors, Shadows } from "../../../src/constants/colors";
import { useAuthStore } from "../../../src/stores/authStore";
import { supabase } from "../../../src/lib/supabase";
import { uploadFile } from "../../../src/lib/storage";

export default function AccountSettingsScreen() {
  const router = useRouter();
  const { profile, setProfile } = useAuthStore();
  const toast = useToast();

  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Change password state
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNew, setConfirmNew] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const isDirty =
    fullName !== (profile?.full_name ?? "") || phone !== (profile?.phone ?? "");

  const handlePickAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Please grant photo library access.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.[0]) return;

      setUploadingAvatar(true);
      const asset = result.assets[0];

      // Resize/crop to 300x300
      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 300, height: 300 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Upload to Supabase Storage
      const path = `${profile!.id}/${Date.now()}.jpg`;
      const publicUrl = await uploadFile("avatars", path, manipulated.uri, "image/jpeg");

      // Update profile
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", profile!.id);

      if (error) throw error;

      setProfile({ ...profile!, avatar_url: publicUrl });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.show("Profile picture updated!");
    } catch (err) {
      console.error("Avatar upload error:", err);
      toast.show("Failed to upload photo", "error");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile || !fullName.trim()) {
      toast.show("Name cannot be empty", "warning");
      return;
    }
    setSaving(true);
    try {
      const updates = {
        full_name: fullName.trim(),
        phone: phone.trim() || null,
      };
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", profile.id);
      if (error) throw error;

      setProfile({ ...profile, ...updates });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.show("Profile saved!");
    } catch {
      toast.show("Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.show("Password must be at least 6 characters", "warning");
      return;
    }
    if (newPassword !== confirmNew) {
      toast.show("Passwords don't match", "warning");
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.show("Password changed!");
      setShowPassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNew("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to change password";
      toast.show(msg, "error");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
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
          <TouchableOpacity
            onPress={() => {
              if (isDirty) {
                Alert.alert("Unsaved Changes", "You have unsaved changes. Discard?", [
                  { text: "Keep Editing", style: "cancel" },
                  { text: "Discard", style: "destructive", onPress: () => router.back() },
                ]);
              } else {
                router.back();
              }
            }}
          >
            <ArrowLeft size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: "700", color: Colors.text.primary }}>
            Account
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar */}
          <Card style={{ alignItems: "center", paddingVertical: 24, marginBottom: 20 }}>
            <TouchableOpacity onPress={handlePickAvatar} disabled={uploadingAvatar}>
              <View style={{ position: "relative" }}>
                <Avatar
                  name={profile?.full_name ?? "U"}
                  imageUrl={profile?.avatar_url}
                  size={96}
                />
                <View
                  style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: Colors.primary.DEFAULT,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 2,
                    borderColor: Colors.surface,
                  }}
                >
                  <Camera size={16} color="#FFF" />
                </View>
              </View>
            </TouchableOpacity>
            <Text
              style={{
                fontSize: 13,
                color: Colors.text.secondary,
                marginTop: 10,
              }}
            >
              {uploadingAvatar ? "Uploading..." : "Tap to change photo"}
            </Text>
          </Card>

          {/* Profile fields */}
          <Input
            label="Full Name"
            placeholder="Your name"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            containerStyle={{ marginBottom: 14 }}
          />
          <Input
            label="Email"
            value={profile?.email ?? ""}
            editable={false}
            hint="Contact support to change email"
            containerStyle={{ marginBottom: 14 }}
          />
          <Input
            label="Phone"
            placeholder="+1 555-000-0000"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            containerStyle={{ marginBottom: 20 }}
          />

          <Button
            title="Save Changes"
            onPress={handleSaveProfile}
            loading={saving}
            disabled={!isDirty}
            icon={<Save size={18} color="#FFF" />}
          />

          {/* Change Password */}
          <View style={{ marginTop: 28 }}>
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                marginBottom: 14,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: Colors.warning.DEFAULT + "20",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Lock size={18} color={Colors.warning.dark} />
              </View>
              <Text style={{ fontSize: 16, fontWeight: "600", color: Colors.text.primary, flex: 1 }}>
                Change Password
              </Text>
              <Text style={{ fontSize: 13, color: Colors.primary.DEFAULT, fontWeight: "600" }}>
                {showPassword ? "Hide" : "Show"}
              </Text>
            </TouchableOpacity>

            {showPassword && (
              <Card>
                <View style={{ gap: 14 }}>
                  <Input
                    label="New Password"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                  />
                  <Input
                    label="Confirm New Password"
                    placeholder="Repeat new password"
                    value={confirmNew}
                    onChangeText={setConfirmNew}
                    secureTextEntry
                  />
                  <Button
                    title="Update Password"
                    onPress={handleChangePassword}
                    loading={changingPassword}
                    variant="secondary"
                    size="sm"
                  />
                </View>
              </Card>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
