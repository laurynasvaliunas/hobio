import React, { useReducer } from "react";
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
import { X } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Input, Card } from "../../src/components/ui";
import { Colors } from "../../src/constants/colors";
import { GROUP_COLORS, SKILL_LEVELS } from "../../src/constants/categories";
import { useAuthStore } from "../../src/stores/authStore";
import { useGroupStore } from "../../src/stores/groupStore";

// --- Form state & reducer ---

interface CreateGroupFormState {
  name: string;
  description: string;
  ageGroup: string;
  selectedSkill: string;
  selectedColor: string;
  maxParticipants: string;
  pricePerMonth: string;
  loading: boolean;
}

type CreateGroupFormAction =
  | { type: "SET_NAME"; payload: string }
  | { type: "SET_DESCRIPTION"; payload: string }
  | { type: "SET_AGE_GROUP"; payload: string }
  | { type: "SET_SELECTED_SKILL"; payload: string }
  | { type: "SET_SELECTED_COLOR"; payload: string }
  | { type: "SET_MAX_PARTICIPANTS"; payload: string }
  | { type: "SET_PRICE_PER_MONTH"; payload: string }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "RESET" };

function createGroupReducer(
  state: CreateGroupFormState,
  action: CreateGroupFormAction
): CreateGroupFormState {
  switch (action.type) {
    case "SET_NAME":
      return { ...state, name: action.payload };
    case "SET_DESCRIPTION":
      return { ...state, description: action.payload };
    case "SET_AGE_GROUP":
      return { ...state, ageGroup: action.payload };
    case "SET_SELECTED_SKILL":
      return { ...state, selectedSkill: action.payload };
    case "SET_SELECTED_COLOR":
      return { ...state, selectedColor: action.payload };
    case "SET_MAX_PARTICIPANTS":
      return { ...state, maxParticipants: action.payload };
    case "SET_PRICE_PER_MONTH":
      return { ...state, pricePerMonth: action.payload };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "RESET":
      return {
        name: "",
        description: "",
        ageGroup: "",
        selectedSkill: "all",
        selectedColor: GROUP_COLORS[0],
        maxParticipants: "",
        pricePerMonth: "",
        loading: false,
      };
    default:
      return state;
  }
}

const initialState: CreateGroupFormState = {
  name: "",
  description: "",
  ageGroup: "",
  selectedSkill: "all",
  selectedColor: GROUP_COLORS[0],
  maxParticipants: "",
  pricePerMonth: "",
  loading: false,
};

export default function CreateGroupModal() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const { organizations, createGroup } = useGroupStore();

  const [state, dispatch] = useReducer(createGroupReducer, initialState);
  const {
    name,
    description,
    ageGroup,
    selectedSkill,
    selectedColor,
    maxParticipants,
    pricePerMonth,
    loading,
  } = state;

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a group name.");
      return;
    }
    if (organizations.length === 0) {
      Alert.alert(
        "No Organization",
        "You need to create an organization first. Go to Profile > My Organizations."
      );
      return;
    }

    dispatch({ type: "SET_LOADING", payload: true });
    try {
      await createGroup({
        organization_id: organizations[0].id,
        name: name.trim(),
        description: description.trim() || null,
        age_group: ageGroup.trim() || null,
        skill_level: selectedSkill as "beginner" | "intermediate" | "advanced" | "all",
        max_participants: maxParticipants ? parseInt(maxParticipants, 10) : null,
        price_per_month: pricePerMonth ? parseFloat(pricePerMonth) : null,
        price_per_session: null,
        currency: "EUR",
        location_id: null,
        color: selectedColor,
        is_active: true,
      });
      router.back();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Something went wrong";
      Alert.alert("Error", message);
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
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
        {/* Modal header */}
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
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: Colors.text.primary,
            }}
          >
            Create Group
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={24} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ gap: 20 }}>
            <Input
              label="Group Name"
              placeholder="e.g. U12 Football - Monday"
              value={name}
              onChangeText={(text) => dispatch({ type: "SET_NAME", payload: text })}
              autoCapitalize="words"
            />
            <Input
              label="Description (optional)"
              placeholder="What is this group about?"
              value={description}
              onChangeText={(text) => dispatch({ type: "SET_DESCRIPTION", payload: text })}
              autoCapitalize="sentences"
              multiline
              numberOfLines={3}
              style={{ height: 80, textAlignVertical: "top", paddingTop: 12 }}
            />
            <Input
              label="Age Group (optional)"
              placeholder="e.g. 8-12, Adults, All ages"
              value={ageGroup}
              onChangeText={(text) => dispatch({ type: "SET_AGE_GROUP", payload: text })}
            />

            {/* Skill Level */}
            <View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: Colors.text.primary,
                  marginBottom: 8,
                  marginLeft: 4,
                }}
              >
                Skill Level
              </Text>
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                {SKILL_LEVELS.map((level) => (
                  <TouchableOpacity
                    key={level.key}
                    onPress={() => dispatch({ type: "SET_SELECTED_SKILL", payload: level.key })}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor:
                        selectedSkill === level.key
                          ? Colors.primary.DEFAULT
                          : Colors.surface,
                      borderWidth: 1,
                      borderColor:
                        selectedSkill === level.key
                          ? Colors.primary.DEFAULT
                          : Colors.border,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color:
                          selectedSkill === level.key
                            ? "#FFFFFF"
                            : Colors.text.primary,
                      }}
                    >
                      {level.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Group Color */}
            <View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: Colors.text.primary,
                  marginBottom: 8,
                  marginLeft: 4,
                }}
              >
                Group Color
              </Text>
              <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
                {GROUP_COLORS.map((color, index) => (
                  <TouchableOpacity
                    key={`${color}-${index}`}
                    onPress={() => dispatch({ type: "SET_SELECTED_COLOR", payload: color })}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: color,
                      borderWidth: selectedColor === color ? 3 : 0,
                      borderColor: "#FFFFFF",
                      shadowColor: selectedColor === color ? color : "transparent",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.4,
                      shadowRadius: 4,
                      elevation: selectedColor === color ? 4 : 0,
                    }}
                  />
                ))}
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <Input
                label="Max Participants"
                placeholder="e.g. 20"
                value={maxParticipants}
                onChangeText={(text) => dispatch({ type: "SET_MAX_PARTICIPANTS", payload: text })}
                keyboardType="number-pad"
                containerStyle={{ flex: 1 }}
              />
              <Input
                label="Price/Month (EUR)"
                placeholder="e.g. 45"
                value={pricePerMonth}
                onChangeText={(text) => dispatch({ type: "SET_PRICE_PER_MONTH", payload: text })}
                keyboardType="decimal-pad"
                containerStyle={{ flex: 1 }}
              />
            </View>

            <Button
              title="Create Group"
              onPress={handleCreate}
              loading={loading}
              style={{ marginTop: 12 }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
