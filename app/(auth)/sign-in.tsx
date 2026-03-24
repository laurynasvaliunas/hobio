import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { Mail, Lock, ArrowLeft } from "lucide-react-native";
import { ScreenWrapper, Button, Input } from "../../src/components/ui";
import { Colors } from "../../src/constants/colors";
import { useAuthStore } from "../../src/stores/authStore";
import { signInSchema } from "../../src/lib/validations";

export default function SignInScreen() {
  const router = useRouter();
  const signIn = useAuthStore((s) => s.signIn);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});

  // ── Staggered entrance animations ──
  const backAnim    = useRef(new Animated.Value(0)).current;
  const backX       = useRef(new Animated.Value(-20)).current;
  const headerAnim  = useRef(new Animated.Value(0)).current;
  const headerY     = useRef(new Animated.Value(20)).current;
  const field1Anim  = useRef(new Animated.Value(0)).current;
  const field1X     = useRef(new Animated.Value(-20)).current;
  const field2Anim  = useRef(new Animated.Value(0)).current;
  const field2X     = useRef(new Animated.Value(-20)).current;
  const ctaAnim     = useRef(new Animated.Value(0)).current;
  const ctaY        = useRef(new Animated.Value(20)).current;
  const footerAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const slide = (op: Animated.Value, pos: Animated.Value, delay: number, axis: "x" | "y" = "x") =>
      Animated.parallel([
        Animated.timing(op, { toValue: 1, duration: 280, delay, useNativeDriver: true }),
        Animated.spring(pos, { toValue: 0, tension: 80, friction: 12, delay, useNativeDriver: true }),
      ]);

    Animated.stagger(80, [
      slide(backAnim, backX, 0),
      slide(headerAnim, headerY, 0, "y"),
      slide(field1Anim, field1X, 0),
      slide(field2Anim, field2X, 0),
      slide(ctaAnim, ctaY, 0, "y"),
      Animated.timing(footerAnim, { toValue: 1, duration: 280, delay: 0, useNativeDriver: true }),
    ]).start();
  }, []);

  // Real-time Zod validation
  const validate = useCallback(
    (field?: "email" | "password") => {
      const result = signInSchema.safeParse({ email: email.trim(), password });
      const newErrors: { email?: string; password?: string } = {};

      if (!result.success) {
        for (const issue of result.error.issues) {
          const key = issue.path[0] as "email" | "password";
          if (!field || field === key) {
            newErrors[key] = issue.message;
          }
        }
      }

      if (field) {
        setErrors((prev) => ({ ...prev, [field]: newErrors[field] }));
      } else {
        setErrors(newErrors);
      }

      return Object.keys(newErrors).length === 0;
    },
    [email, password]
  );

  const handleBlur = (field: "email" | "password") => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validate(field);
  };

  // Inline success messages
  const emailSuccess =
    touched.email && !errors.email && email.trim().length > 0
      ? "Email looks good!"
      : undefined;
  const passwordSuccess =
    touched.password && !errors.password && password.length >= 6
      ? "Password is valid"
      : undefined;

  const handleSignIn = async () => {
    setTouched({ email: true, password: true });
    if (!validate()) return;

    setLoading(true);
    try {
      await signIn(email.trim().toLowerCase(), password);
      // Navigate to the root index, which reads the auth store and routes correctly
      // based on profile.role and isOnboarded state.
      router.replace("/");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Invalid email or password";
      Alert.alert("Sign In Failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingVertical: 20 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back — slides in from left */}
          <Animated.View style={{ opacity: backAnim, transform: [{ translateX: backX }], marginBottom: 32 }}>
            <TouchableOpacity
              onPress={() => router.back()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <ArrowLeft size={20} color={Colors.primary.DEFAULT} strokeWidth={2.5} />
              <Text style={{ fontSize: 15, fontWeight: "600", color: Colors.primary.DEFAULT }}>Back</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Header — slides up */}
          <Animated.View style={{ marginBottom: 40, opacity: headerAnim, transform: [{ translateY: headerY }] }}>
            <Image
              source={require("../../assets/hobio-brand-logo.png")}
              style={{ width: 160, height: 64, marginBottom: 20 }}
              resizeMode="contain"
            />
            <Text style={{ fontSize: 30, fontWeight: "800", color: Colors.text.primary, marginBottom: 8, letterSpacing: -0.5 }}>
              Welcome back
            </Text>
            <Text style={{ fontSize: 16, color: Colors.text.secondary, lineHeight: 24 }}>
              Sign in to continue your journey
            </Text>
          </Animated.View>

          {/* Email field */}
          <Animated.View style={{ marginBottom: 14, opacity: field1Anim, transform: [{ translateX: field1X }] }}>
            <Input
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChangeText={(t) => { setEmail(t); if (touched.email) validate("email"); }}
              onBlur={() => handleBlur("email")}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={touched.email ? errors.email : undefined}
              success={emailSuccess}
              icon={<Mail size={20} color={Colors.text.secondary} />}
            />
          </Animated.View>

          {/* Password field */}
          <Animated.View style={{ opacity: field2Anim, transform: [{ translateX: field2X }] }}>
            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={(t) => { setPassword(t); if (touched.password) validate("password"); }}
              onBlur={() => handleBlur("password")}
              secureTextEntry
              autoComplete="password"
              error={touched.password ? errors.password : undefined}
              success={passwordSuccess}
              icon={<Lock size={20} color={Colors.text.secondary} />}
            />
            <TouchableOpacity
              onPress={() => router.push("/(auth)/forgot-password")}
              style={{ alignSelf: "flex-end", marginTop: 10, marginBottom: 28 }}
            >
              <Text style={{ fontSize: 14, fontWeight: "600", color: Colors.primary.DEFAULT }}>
                Forgot password?
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* CTA — slides up */}
          <Animated.View style={{ opacity: ctaAnim, transform: [{ translateY: ctaY }] }}>
            <Button title="Sign In" onPress={handleSignIn} loading={loading} />
          </Animated.View>

          {/* Footer */}
          <Animated.View style={{ flexDirection: "row", justifyContent: "center", marginTop: 24, gap: 4, opacity: footerAnim }}>
            <Text style={{ fontSize: 14, color: Colors.text.secondary }}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => router.replace("/(auth)/sign-up")}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: Colors.primary.DEFAULT }}>Sign Up</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}
