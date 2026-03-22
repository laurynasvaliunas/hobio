import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Calendar,
  Clock,
  RefreshCw,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Button, Input, Badge } from "../../../../src/components/ui";
import { Colors, Shadows } from "../../../../src/constants/colors";
import { DAYS_OF_WEEK } from "../../../../src/constants/categories";
import { supabase } from "../../../../src/lib/supabase";
import { useSessions } from "../../../../src/hooks/useSessions";
import type { RecurringSchedule } from "../../../../src/types/database.types";

export default function ScheduleSetupScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const router = useRouter();
  const { generateFromSchedule } = useSessions({ groupId });

  const [rules, setRules] = useState<RecurringSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // New rule form
  const [showForm, setShowForm] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number>(1); // Monday
  const [startTime, setStartTime] = useState("17:00");
  const [endTime, setEndTime] = useState("18:30");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRules();
  }, [groupId]);

  const fetchRules = async () => {
    try {
      const { data, error } = await supabase
        .from("recurring_schedule")
        .select("*")
        .eq("group_id", groupId)
        .order("day_of_week", { ascending: true });

      if (error) throw error;
      setRules((data as RecurringSchedule[]) ?? []);
    } catch (error) {
      console.error("Fetch rules error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRule = async () => {
    if (!startTime || !endTime) {
      Alert.alert("Error", "Please set start and end times.");
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("recurring_schedule")
        .insert({
          group_id: groupId,
          day_of_week: selectedDay,
          start_time: startTime + ":00",
          end_time: endTime + ":00",
          valid_from: new Date().toISOString().split("T")[0],
          location_id: null,
        })
        .select()
        .single();

      if (error) throw error;
      setRules((prev) => [...prev, data as RecurringSchedule]);
      setShowForm(false);
      Alert.alert("Added", "Recurring schedule rule added.");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to add rule";
      Alert.alert("Error", msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRule = (ruleId: string) => {
    Alert.alert("Delete Rule", "Remove this recurring schedule?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await supabase.from("recurring_schedule").delete().eq("id", ruleId);
            setRules((prev) => prev.filter((r) => r.id !== ruleId));
          } catch {
            Alert.alert("Error", "Failed to delete rule.");
          }
        },
      },
    ]);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const count = await generateFromSchedule(groupId);
      if (count > 0) {
        Alert.alert("Sessions Generated", `${count} new sessions created for the next 4 weeks.`);
      } else {
        Alert.alert("Up to Date", "All sessions are already generated. No new ones needed.");
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to generate";
      Alert.alert("Error", msg);
    } finally {
      setGenerating(false);
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
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text
              style={{ fontSize: 20, fontWeight: "700", color: Colors.text.primary }}
            >
              Recurring Schedule
            </Text>
            <Text style={{ fontSize: 13, color: Colors.text.secondary }}>
              Set weekly recurring sessions
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowForm(true)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: Colors.primary.DEFAULT,
              alignItems: "center",
              justifyContent: "center",
              ...Shadows.button,
            }}
          >
            <Plus size={20} color="#FFF" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Existing rules */}
          {rules.length === 0 && !isLoading && !showForm ? (
            <Card style={{ marginTop: 20, alignItems: "center", paddingVertical: 32 }}>
              <Calendar size={40} color={Colors.primary.light} strokeWidth={1.5} />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: Colors.text.primary,
                  marginTop: 12,
                }}
              >
                No recurring schedule
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: Colors.text.secondary,
                  textAlign: "center",
                  marginTop: 4,
                  paddingHorizontal: 20,
                }}
              >
                Add weekly rules like "Every Monday 17:00-18:30" to auto-generate sessions.
              </Text>
            </Card>
          ) : (
            <View style={{ gap: 10, marginTop: 8 }}>
              {rules.map((rule) => (
                <Card key={rule.id}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                      <View
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          backgroundColor: Colors.primary.light + "20",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Clock size={20} color={Colors.primary.DEFAULT} />
                      </View>
                      <View>
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: "600",
                            color: Colors.text.primary,
                          }}
                        >
                          {DAYS_OF_WEEK[rule.day_of_week]}
                        </Text>
                        <Text
                          style={{
                            fontSize: 14,
                            color: Colors.text.secondary,
                            marginTop: 2,
                          }}
                        >
                          {rule.start_time.slice(0, 5)} - {rule.end_time.slice(0, 5)}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteRule(rule.id)}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        backgroundColor: Colors.danger.DEFAULT + "15",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Trash2 size={16} color={Colors.danger.DEFAULT} />
                    </TouchableOpacity>
                  </View>
                </Card>
              ))}
            </View>
          )}

          {/* Add rule form */}
          {showForm && (
            <Card style={{ marginTop: 16 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: Colors.text.primary,
                  marginBottom: 16,
                }}
              >
                New Recurring Rule
              </Text>

              {/* Day selector */}
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: Colors.text.primary,
                  marginBottom: 8,
                }}
              >
                Day of Week
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 16 }}
              >
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {DAYS_OF_WEEK.map((day, index) => (
                    <TouchableOpacity
                      key={day}
                      onPress={() => setSelectedDay(index)}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 20,
                        backgroundColor:
                          selectedDay === index
                            ? Colors.primary.DEFAULT
                            : Colors.border,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "600",
                          color: selectedDay === index ? "#FFF" : Colors.text.primary,
                        }}
                      >
                        {day.slice(0, 3)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {/* Time inputs */}
              <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
                <Input
                  label="Start Time"
                  placeholder="17:00"
                  value={startTime}
                  onChangeText={setStartTime}
                  containerStyle={{ flex: 1 }}
                />
                <Input
                  label="End Time"
                  placeholder="18:30"
                  value={endTime}
                  onChangeText={setEndTime}
                  containerStyle={{ flex: 1 }}
                />
              </View>

              <View style={{ flexDirection: "row", gap: 10 }}>
                <Button
                  title="Cancel"
                  onPress={() => setShowForm(false)}
                  variant="outline"
                  size="sm"
                  fullWidth={false}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Add Rule"
                  onPress={handleAddRule}
                  loading={saving}
                  size="sm"
                  fullWidth={false}
                  style={{ flex: 1 }}
                />
              </View>
            </Card>
          )}

          {/* Generate sessions button */}
          {rules.length > 0 && (
            <Button
              title="Generate Sessions (4 weeks)"
              onPress={handleGenerate}
              loading={generating}
              variant="secondary"
              icon={<RefreshCw size={18} color="#FFF" />}
              style={{ marginTop: 24 }}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
