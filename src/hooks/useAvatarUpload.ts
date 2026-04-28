import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import { useTranslation } from "react-i18next";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as Haptics from "expo-haptics";
import { supabase } from "../lib/supabase";
import { uploadFile } from "../lib/storage";
import { useAuthStore } from "../stores/authStore";
import { useToast } from "../components/ui/Toast";
import { createLogger } from "../lib/logger";

const log = createLogger("AvatarUpload");

/**
 * Shared avatar-upload flow. Handles permission prompt, image picking,
 * resizing, upload to the Supabase `avatars` bucket, and profile update.
 *
 * Used by both `profile/index.tsx` (direct tap on avatar) and
 * `profile/account.tsx` (avatar + camera badge in Account screen).
 */
export function useAvatarUpload() {
  const { t } = useTranslation();
  const { profile, setProfile } = useAuthStore();
  const toast = useToast();
  const [uploading, setUploading] = useState(false);

  // Tracks whether the component is still mounted. If the user navigates away
  // mid-upload we skip the post-upload state writes (toast, setProfile,
  // setUploading) — those would no-op but also leak warnings.
  const mountedRef = useRef(true);
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const pickAndUpload = useCallback(async () => {
    if (!profile?.id) return;

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          t("avatar.permissionTitle", "Permission Required"),
          t("avatar.permissionMessage", "Please grant photo library access.")
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.[0]) return;
      if (!mountedRef.current) return;

      setUploading(true);
      const asset = result.assets[0];

      // Resize/crop to 300x300 for consistent avatar quality / storage cost.
      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 300, height: 300 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      const path = `${profile.id}/${Date.now()}.jpg`;
      const publicUrl = await uploadFile(
        "avatars",
        path,
        manipulated.uri,
        "image/jpeg"
      );

      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", profile.id);

      if (error) throw error;

      if (!mountedRef.current) return;
      setProfile({ ...profile, avatar_url: publicUrl });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.show(t("avatar.updated", "Profile picture updated!"));
    } catch (err) {
      log.error("avatar_upload_failed", { name: (err as Error)?.name });
      if (mountedRef.current) {
        toast.show(t("avatar.uploadFailed", "Failed to upload photo"), "error");
      }
    } finally {
      if (mountedRef.current) {
        setUploading(false);
      }
    }
  }, [profile, setProfile, t, toast]);

  return { pickAndUpload, uploading };
}
