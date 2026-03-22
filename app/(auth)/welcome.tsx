import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  Dimensions,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Sparkles, Zap, Heart } from "lucide-react-native";
import { Button, AnimatedBackground } from "../../src/components/ui";
import { Colors } from "../../src/constants/colors";
import { Fonts } from "../../src/constants/fonts";

const { width: W } = Dimensions.get("window");

const SPORT_EMOJIS = ["⚽", "🎨", "🎵", "🏀", "💃", "🎾"];
const ORBIT_RADIUS = 88;

const PILLS = [
  { icon: Sparkles, text: "Connect", color: Colors.primary.DEFAULT },
  { icon: Zap,      text: "Grow",    color: Colors.secondary.DEFAULT },
  { icon: Heart,    text: "Thrive",  color: Colors.accent.DEFAULT },
];

// ── Orbiting emoji rendered with RN Animated ──
function OrbitingEmoji({
  emoji, index, total, orbitAnim,
}: {
  emoji: string; index: number; total: number; orbitAnim: Animated.Value;
}) {
  const baseAngle = (index / total) * Math.PI * 2;
  const x = orbitAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      Math.cos(baseAngle) * ORBIT_RADIUS - 16,
      Math.cos(baseAngle + Math.PI * 2) * ORBIT_RADIUS - 16,
    ],
  });
  const y = orbitAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      Math.sin(baseAngle) * ORBIT_RADIUS - 16,
      Math.sin(baseAngle + Math.PI * 2) * ORBIT_RADIUS - 16,
    ],
  });

  return (
    <Animated.Text
      style={[styles.orbitEmoji, { transform: [{ translateX: x }, { translateY: y }] }]}
    >
      {emoji}
    </Animated.Text>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();

  // Orbit rotation (0→1 over 10 s, looping)
  const orbitAnim = useRef(new Animated.Value(0)).current;

  // Entrance animations
  const logoScale    = useRef(new Animated.Value(0)).current;
  const logoOpacity  = useRef(new Animated.Value(0)).current;
  const pillsY       = useRef(new Animated.Value(20)).current;
  const pillsOpacity = useRef(new Animated.Value(0)).current;
  const taglineOp    = useRef(new Animated.Value(0)).current;
  const illustOp     = useRef(new Animated.Value(0)).current;
  const illustScale  = useRef(new Animated.Value(0.8)).current;
  const btnsY        = useRef(new Animated.Value(20)).current;
  const btnsOpacity  = useRef(new Animated.Value(0)).current;

  // Pulsing centre circle
  const pulseScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Orbit loop
    Animated.loop(
      Animated.timing(orbitAnim, { toValue: 1, duration: 10000, useNativeDriver: true }),
    ).start();

    // Pulsing centre
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, { toValue: 1.2, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseScale, { toValue: 1,   duration: 900, useNativeDriver: true }),
      ]),
    ).start();

    // Staggered entrance
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale,  { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(pillsY,    { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
        Animated.timing(pillsOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      Animated.timing(taglineOp, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.parallel([
        Animated.spring(illustScale,  { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
        Animated.timing(illustOp,     { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(btnsY,     { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
        Animated.timing(btnsOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      {/* Floating colour blobs */}
      <AnimatedBackground />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Brand Logo ── */}
        <Animated.View
          style={[
            styles.logoArea,
            { transform: [{ scale: logoScale }], opacity: logoOpacity },
          ]}
        >
          <Image
            source={require("../../assets/hobio-logo.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* ── Feature pills ── */}
        <Animated.View
          style={[
            styles.pillsRow,
            { transform: [{ translateY: pillsY }], opacity: pillsOpacity },
          ]}
        >
          {PILLS.map(({ icon: Icon, text, color }) => (
            <View key={text} style={[styles.pill, { borderColor: color }]}>
              <Icon size={14} color={color} strokeWidth={2.5} />
              <Text style={[styles.pillText, { color }]}>{text}</Text>
            </View>
          ))}
        </Animated.View>

        {/* ── Tagline ── */}
        <Animated.Text style={[styles.tagline, { opacity: taglineOp }]}>
          Where communities come together to{"\n"}
          <Text style={styles.taglineAccent}>play, learn, and grow</Text>
        </Animated.Text>

        {/* ── Illustration: orbiting emojis ── */}
        <Animated.View
          style={[
            styles.orbitContainer,
            { transform: [{ scale: illustScale }], opacity: illustOp },
          ]}
        >
          {/* Pulsing centre */}
          <Animated.View
            style={[
              styles.orbitCenter,
              { transform: [{ scale: pulseScale }] },
            ]}
          />

          {/* Orbiting emojis */}
          {SPORT_EMOJIS.map((emoji, i) => (
            <OrbitingEmoji
              key={i}
              emoji={emoji}
              index={i}
              total={SPORT_EMOJIS.length}
              orbitAnim={orbitAnim}
            />
          ))}
        </Animated.View>

        {/* ── CTA Buttons ── */}
        <Animated.View
          style={[
            styles.buttons,
            { transform: [{ translateY: btnsY }], opacity: btnsOpacity },
          ]}
        >
          <Button
            title="Get Started"
            size="lg"
            onPress={() => router.push("/(auth)/sign-up")}
          />
          <Button
            title="I already have an account"
            size="lg"
            variant="ghost"
            onPress={() => router.push("/(auth)/sign-in")}
          />
        </Animated.View>

        {/* ── Footer ── */}
        <Animated.Text style={[styles.footer, { opacity: btnsOpacity }]}>
          Join thousands of communities worldwide 🌍
        </Animated.Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 32,
    gap: 24,
  },
  logoArea: {
    alignItems: "center",
  },
  logoImage: {
    width: 200,
    height: 80,
  },
  pillsRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
    backgroundColor: "rgba(255,255,255,0.75)",
  },
  pillText: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
  },
  tagline: {
    fontSize: 17,
    fontFamily: Fonts.medium,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 26,
  },
  taglineAccent: {
    color: Colors.primary.DEFAULT,
    fontFamily: Fonts.bold,
  },
  orbitContainer: {
    width: ORBIT_RADIUS * 2 + 80,
    height: ORBIT_RADIUS * 2 + 80,
    alignItems: "center",
    justifyContent: "center",
  },
  orbitCenter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary.DEFAULT,
    opacity: 0.65,
  },
  orbitEmoji: {
    position: "absolute",
    fontSize: 32,
    lineHeight: 40,
  },
  buttons: {
    width: "100%",
    gap: 12,
  },
  footer: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: Colors.text.secondary,
    textAlign: "center",
  },
});
