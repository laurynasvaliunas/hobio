import React from "react";
import { View, Text, TouchableWithoutFeedback, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
} from "react-native-reanimated";
import { ChevronRight, Users } from "lucide-react-native";
import { useTheme } from "../../hooks/useTheme";
import { Fonts } from "../../constants/fonts";
import { Badge } from "./Badge";

interface Props {
  name: string;
  icon: React.ReactNode;
  color: string;
  ageGroup?: string;
  price?: number;
  currency?: string;
  memberCount?: number;
  onPress?: () => void;
}

/**
 * Enhanced group card with:
 * - Subtle radial gradient blob in the top-right corner (matching Figma)
 * - Icon container with spring wobble on card press
 * - Member count display
 * - Full press-spring animation
 */
export function GroupCard({
  name, icon, color, ageGroup, price, currency = "EUR", memberCount, onPress,
}: Props) {
  const { colors, shadows } = useTheme();

  const cardScale  = useSharedValue(1);
  const iconRotate = useSharedValue(0);

  const handlePressIn = () => {
    cardScale.value  = withSpring(0.97, { damping: 20, stiffness: 400 });
    iconRotate.value = withSpring(-10, { damping: 8, stiffness: 300 });
  };
  const handlePressOut = () => {
    cardScale.value  = withSpring(1, { damping: 15, stiffness: 300 });
    iconRotate.value = withSpring(0, { damping: 10, stiffness: 200 });
  };

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${iconRotate.value}deg` }],
  }));

  const priceLabel = price != null
    ? `${currency === "EUR" ? "€" : currency === "USD" ? "$" : currency}${price}/mo`
    : null;

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
        {/* Subtle background blob */}
        <View
          pointerEvents="none"
          style={[styles.bgBlob, { backgroundColor: color }]}
        />

        <View style={styles.row}>
          {/* Animated icon container */}
          <Animated.View
            style={[
              styles.iconBox,
              { backgroundColor: color + "20" },
              iconStyle,
            ]}
          >
            <View style={{ tintColor: color }}>{icon}</View>
          </Animated.View>

          {/* Text content */}
          <View style={styles.content}>
            <Text
              style={[styles.name, { color: colors.text.primary }]}
              numberOfLines={1}
            >
              {name}
            </Text>
            <View style={styles.metaRow}>
              {ageGroup && <Badge label={ageGroup} variant="neutral" />}
              {priceLabel && (
                <Text style={[styles.price, { color: colors.text.secondary }]}>
                  {priceLabel}
                </Text>
              )}
              {memberCount !== undefined && (
                <View style={styles.memberRow}>
                  <Users size={12} color={colors.text.secondary} strokeWidth={2} />
                  <Text style={[styles.memberText, { color: colors.text.secondary }]}>
                    {memberCount}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <ChevronRight size={20} color={colors.text.secondary} strokeWidth={2} />
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 16,
    overflow: "hidden",
  },
  bgBlob: {
    position: "absolute",
    top: -20,
    right: -20,
    width: 110,
    height: 110,
    borderRadius: 55,
    opacity: 0.10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  content: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  name: {
    fontSize: 17,
    fontFamily: Fonts.bold,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  price: {
    fontSize: 13,
    fontFamily: Fonts.medium,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  memberText: {
    fontSize: 13,
    fontFamily: Fonts.medium,
  },
});
