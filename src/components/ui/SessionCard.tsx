import React, { useEffect } from "react";
import { View, Text, TouchableWithoutFeedback, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
} from "react-native-reanimated";
import { Clock, MapPin, Users } from "lucide-react-native";
import { useTheme } from "../../hooks/useTheme";
import { Fonts } from "../../constants/fonts";

interface Props {
  groupName: string;
  time: string;
  location?: string;
  attendees?: number;
  color: string;
  onPress?: () => void;
}

/**
 * Session card with an animated spring-entry colour accent bar on the left.
 * Matches the Figma SessionCard design: colour bar + name + time + optional location/attendees.
 */
export function SessionCard({ groupName, time, location, attendees, color, onPress }: Props) {
  const { colors, shadows } = useTheme();

  // Colour bar animates in from height 0
  const barScale = useSharedValue(0);
  // Card scale for press feedback
  const cardScale = useSharedValue(1);

  useEffect(() => {
    barScale.value = withSpring(1, { damping: 14, stiffness: 200 });
  }, []);

  const barStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: barScale.value }],
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const handlePressIn = () => {
    cardScale.value = withSpring(0.97, { damping: 20, stiffness: 400 });
  };
  const handlePressOut = () => {
    cardScale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return (
    <TouchableWithoutFeedback
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.card,
          { backgroundColor: colors.surface, ...shadows.card },
          cardStyle,
        ]}
      >
        {/* Animated colour accent bar */}
        <Animated.View
          style={[
            styles.accentBar,
            { backgroundColor: color },
            barStyle,
          ]}
        />

        <View style={styles.body}>
          <Text style={[styles.groupName, { color: colors.text.primary }]}>
            {groupName}
          </Text>

          <View style={styles.metaRow}>
            <Clock size={14} color={colors.text.secondary} strokeWidth={2} />
            <Text style={[styles.metaText, { color: colors.text.secondary }]}>{time}</Text>
          </View>

          {location && (
            <View style={styles.metaRow}>
              <MapPin size={14} color={colors.text.secondary} strokeWidth={2} />
              <Text style={[styles.metaText, { color: colors.text.secondary }]}>{location}</Text>
            </View>
          )}

          {attendees !== undefined && (
            <View style={styles.metaRow}>
              <Users size={14} color={colors.text.secondary} strokeWidth={2} />
              <Text style={[styles.metaText, { color: colors.text.secondary }]}>
                {attendees} attending
              </Text>
            </View>
          )}
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    flexDirection: "row",
    overflow: "hidden",
  },
  accentBar: {
    width: 4,
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
    transformOrigin: "top",
  },
  body: {
    flex: 1,
    padding: 16,
    gap: 6,
  },
  groupName: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
  },
});
