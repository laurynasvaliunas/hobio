import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { X } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../src/constants/colors";

export default function CreateAnnouncementModal() {
  const router = useRouter();

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: Colors.background }}
      edges={["top"]}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
        }}
      >
        <Text
          style={{ fontSize: 20, fontWeight: "700", color: Colors.text.primary }}
        >
          New Announcement
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <X size={24} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 40,
        }}
      >
        <Text
          style={{
            fontSize: 16,
            color: Colors.text.secondary,
            textAlign: "center",
          }}
        >
          Announcement creation will be implemented in Phase 3.
        </Text>
      </View>
    </SafeAreaView>
  );
}
