import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  Modal,
  Pressable,
} from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Calendar, ChevronDown } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../hooks/useTheme";
import { Fonts } from "../../constants/fonts";

interface Props {
  /** Currently selected date (YYYY-MM-DD) or empty string */
  value: string;
  /** Called with YYYY-MM-DD string */
  onChange: (dateStr: string) => void;
  /** Label text above the picker */
  label?: string;
  /** Placeholder text when no date selected */
  placeholder?: string;
  /** Max selectable date. Defaults to today. */
  maximumDate?: Date;
  /** Minimum selectable date. Defaults to 25 years ago. */
  minimumDate?: Date;
}

/**
 * Native-feel birthdate picker for children.
 *
 * - Defaults the calendar to ~7 years ago (middle of common hobby age range 4–18)
 * - Uses the OS-native date picker (spinning wheel on iOS, calendar grid on Android)
 * - Provides haptic feedback on date selection
 * - Full accessibility support
 */
export function BirthDatePicker({
  value,
  onChange,
  label = "Date of Birth *",
  placeholder = "Tap to select date",
  maximumDate,
  minimumDate,
}: Props) {
  const { colors } = useTheme();
  const [showPicker, setShowPicker] = useState(false);

  // Smart default: ~7 years ago (center of 4–18 range)
  const defaultDate = new Date();
  defaultDate.setFullYear(defaultDate.getFullYear() - 7);
  defaultDate.setMonth(5); // June — mid-year

  const parsedDate = value ? new Date(value + "T00:00:00") : defaultDate;
  const today = new Date();
  const minDate = minimumDate ?? new Date(today.getFullYear() - 25, 0, 1);
  const maxDate = maximumDate ?? today;

  const handleChange = useCallback(
    (_event: DateTimePickerEvent, selectedDate?: Date) => {
      if (Platform.OS === "android") {
        setShowPicker(false);
      }

      if (selectedDate) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
        const day = String(selectedDate.getDate()).padStart(2, "0");
        onChange(`${year}-${month}-${day}`);
      }
    },
    [onChange],
  );

  const handleConfirmIOS = () => {
    setShowPicker(false);
  };

  const formatDisplay = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Calculate age for display
  const age = value
    ? Math.floor(
        (today.getTime() - new Date(value + "T00:00:00").getTime()) /
          (365.25 * 24 * 60 * 60 * 1000),
      )
    : null;

  return (
    <View style={{ width: "100%", gap: 6 }}>
      {label && (
        <Text
          style={{
            fontSize: 14,
            fontFamily: Fonts.medium,
            color: colors.text.primary,
            marginLeft: 4,
          }}
        >
          {label}
        </Text>
      )}

      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setShowPicker(true);
        }}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={label ?? "Select date of birth"}
        accessibilityHint="Opens a date picker"
        style={{
          flexDirection: "row",
          alignItems: "center",
          height: 52,
          borderWidth: 1.5,
          borderColor: showPicker ? colors.primary.DEFAULT : colors.border,
          borderRadius: 16,
          backgroundColor: colors.surface,
          paddingHorizontal: 16,
          gap: 12,
        }}
      >
        <Calendar size={20} color={colors.primary.DEFAULT} />
        <View style={{ flex: 1 }}>
          {value ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: Fonts.regular,
                  color: colors.text.primary,
                }}
              >
                {formatDisplay(value)}
              </Text>
              {age !== null && age >= 0 && (
                <View
                  style={{
                    backgroundColor: colors.secondary.DEFAULT + "20",
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: Fonts.semiBold,
                      color: colors.secondary.DEFAULT,
                    }}
                  >
                    {age}y
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <Text
              style={{
                fontSize: 16,
                fontFamily: Fonts.regular,
                color: colors.text.secondary + "80",
              }}
            >
              {placeholder}
            </Text>
          )}
        </View>
        <ChevronDown size={18} color={colors.text.secondary} />
      </TouchableOpacity>

      {/* Android: Inline picker */}
      {Platform.OS === "android" && showPicker && (
        <DateTimePicker
          value={parsedDate}
          mode="date"
          display="default"
          onChange={handleChange}
          maximumDate={maxDate}
          minimumDate={minDate}
        />
      )}

      {/* iOS: Modal picker */}
      {Platform.OS === "ios" && (
        <Modal
          visible={showPicker}
          transparent
          animationType="slide"
          onRequestClose={handleConfirmIOS}
        >
          <Pressable
            style={{ flex: 1, backgroundColor: "#00000040" }}
            onPress={handleConfirmIOS}
          />
          <View
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingBottom: 40,
              paddingTop: 16,
            }}
          >
            {/* Grabber + header */}
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: colors.border,
                alignSelf: "center",
                marginBottom: 12,
              }}
            />
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingHorizontal: 20,
                marginBottom: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 17,
                  fontFamily: Fonts.bold,
                  color: colors.text.primary,
                }}
              >
                Select Date of Birth
              </Text>
              <TouchableOpacity onPress={handleConfirmIOS}>
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: Fonts.bold,
                    color: colors.primary.DEFAULT,
                  }}
                >
                  Done
                </Text>
              </TouchableOpacity>
            </View>

            {/* Hint text */}
            <Text
              style={{
                fontSize: 13,
                fontFamily: Fonts.regular,
                color: colors.text.secondary,
                textAlign: "center",
                marginBottom: 4,
                paddingHorizontal: 20,
              }}
            >
              Tip: Tap the year in the header to jump quickly
            </Text>

            <DateTimePicker
              value={parsedDate}
              mode="date"
              display="spinner"
              onChange={handleChange}
              maximumDate={maxDate}
              minimumDate={minDate}
              style={{ height: 200 }}
              textColor={colors.text.primary}
            />
          </View>
        </Modal>
      )}
    </View>
  );
}
