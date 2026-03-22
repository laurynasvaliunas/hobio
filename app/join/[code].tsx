import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, LogIn, CheckCircle, Clock } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Input, Card, PaperPlaneAnimation } from "../../src/components/ui";
import { Colors } from "../../src/constants/colors";
import { Fonts } from "../../src/constants/fonts";
import { useAuthStore } from "../../src/stores/authStore";
import { supabase } from "../../src/lib/supabase";
import type { Group } from "../../src/types/database.types";

type JoinResult = { group: Group; status: "active" | "pending" };

export default function JoinGroupScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);

  const [inviteCode, setInviteCode] = useState(
    code !== "enter" ? code ?? "" : ""
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<JoinResult | null>(null);
  const [showPlane, setShowPlane] = useState(false);

  const handleJoin = async () => {
    if (!inviteCode.trim() || inviteCode.trim().length < 6) {
      Alert.alert("Error", "Please enter a valid 6-character invite code.");
      return;
    }
    if (!profile) return;

    setLoading(true);
    try {
      // 1. Find group by invite code
      const { data: group, error: findError } = await supabase
        .from("groups")
        .select("*")
        .eq("invite_code", inviteCode.toUpperCase().trim())
        .single();

      if (findError || !group) throw new Error("Invalid invite code. Check and try again.");

      // 2. Check if already a member
      const { data: existing } = await supabase
        .from("group_members")
        .select("id, status")
        .eq("group_id", group.id)
        .eq("profile_id", profile.id)
        .single();

      if (existing) {
        if (existing.status === "pending") {
          throw new Error("Your join request is still pending approval.");
        }
        throw new Error("You're already a member of this group.");
      }

      // 3. Check capacity
      if (group.max_participants) {
        const { count } = await supabase
          .from("group_members")
          .select("id", { count: "exact", head: true })
          .eq("group_id", group.id)
          .eq("status", "active");

        if (count && count >= group.max_participants) {
          throw new Error("This group is full.");
        }
      }

      // 4. Join with "pending" status (admin must approve)
      const { error: joinError } = await supabase.from("group_members").insert({
        group_id: group.id,
        profile_id: profile.id,
        child_id: null,
        added_by: profile.id,
        role: "member",
        status: "pending",
      });

      if (joinError) throw joinError;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowPlane(true);
      setResult({ group: group as Group, status: "pending" });
    } catch (error: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const message =
        error instanceof Error ? error.message : "Something went wrong";
      Alert.alert("Join Failed", message);
    } finally {
      setLoading(false);
    }
  };

  // Success state
  if (result) {
    const isPending = result.status === "pending";

    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: Colors.background }}
        edges={["top", "bottom"]}
      >
        {/* Paper-plane celebration animation */}
        <PaperPlaneAnimation
          visible={showPlane}
          onComplete={() => setShowPlane(false)}
        />

        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 32,
            gap: 16,
          }}
        >
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: isPending
                ? Colors.warning.DEFAULT + "20"
                : Colors.secondary.DEFAULT + "20",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 8,
            }}
          >
            {isPending ? (
              <Clock size={40} color={Colors.warning.dark} />
            ) : (
              <CheckCircle size={40} color={Colors.secondary.DEFAULT} />
            )}
          </View>
          <Text
            style={{
              fontSize: 24,
              fontFamily: Fonts.extraBold,
              color: Colors.text.primary,
              textAlign: "center",
            }}
          >
            {isPending ? "Request Sent!" : "You're In!"}
          </Text>
          <Text
            style={{
              fontSize: 16,
              fontFamily: Fonts.regular,
              color: Colors.text.secondary,
              textAlign: "center",
              lineHeight: 24,
            }}
          >
            {isPending
              ? `Your request to join "${result.group.name}" has been sent. The organizer will review and approve it.`
              : `You've successfully joined "${result.group.name}"`}
          </Text>
          <Button
            title="Back to Home"
            onPress={() => {
              router.dismiss();
              router.replace("/(tabs)/home");
            }}
            style={{ marginTop: 16 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: Colors.background }}
      edges={["top"]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, paddingHorizontal: 20 }}>
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 14,
              gap: 14,
            }}
          >
            <TouchableOpacity
              onPress={() => router.back()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ArrowLeft size={24} color={Colors.text.primary} />
            </TouchableOpacity>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "700",
                color: Colors.text.primary,
              }}
            >
              Join a Group
            </Text>
          </View>

          <View style={{ flex: 1, justifyContent: "center", paddingBottom: 80 }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 18,
                backgroundColor: Colors.secondary.DEFAULT + "20",
                alignItems: "center",
                justifyContent: "center",
                alignSelf: "center",
                marginBottom: 24,
              }}
            >
              <LogIn size={30} color={Colors.secondary.DEFAULT} />
            </View>

            <Text
              style={{
                fontSize: 22,
                fontWeight: "700",
                color: Colors.text.primary,
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              Enter Invite Code
            </Text>
            <Text
              style={{
                fontSize: 15,
                color: Colors.text.secondary,
                textAlign: "center",
                marginBottom: 8,
                lineHeight: 22,
              }}
            >
              Ask your group organizer for the 6-character code.
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: Colors.text.secondary,
                textAlign: "center",
                marginBottom: 32,
              }}
            >
              Your request will be sent for approval.
            </Text>

            <Input
              placeholder="e.g. ABC123"
              value={inviteCode}
              onChangeText={(text) => setInviteCode(text.toUpperCase())}
              autoCapitalize="characters"
              maxLength={6}
              style={{
                fontSize: 24,
                fontWeight: "700",
                letterSpacing: 6,
                textAlign: "center",
              }}
              containerStyle={{ marginBottom: 24 }}
            />

            <Button
              title="Request to Join"
              onPress={handleJoin}
              loading={loading}
              disabled={inviteCode.length < 6}
              variant="secondary"
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
