import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Heart } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../../src/constants/colors";

export default function EmergencyContactScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={["top"]}>
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
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: "700", color: Colors.text.primary }}>
          Emergency Contact
        </Text>
      </View>

      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40, gap: 16 }}>
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            backgroundColor: Colors.danger.DEFAULT + "15",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Heart size={36} color={Colors.danger.DEFAULT} />
        </View>
        <Text style={{ fontSize: 20, fontWeight: "700", color: Colors.text.primary, textAlign: "center" }}>
          Coming Soon
        </Text>
        <Text style={{ fontSize: 15, color: Colors.text.secondary, textAlign: "center", lineHeight: 22 }}>
          Emergency contact information will be available in a future update.
        </Text>
      </View>
    </SafeAreaView>
  );
}
