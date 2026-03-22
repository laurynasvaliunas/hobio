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
import { Mail, Lock, UserIcon, ArrowLeft, ShieldCheck, CheckCircle } from "lucide-react-native";
import { ScreenWrapper, Button, Input } from "../../src/components/ui";
import { Colors, Shadows } from "../../src/constants/colors";
import { useAuthStore } from "../../src/stores/authStore";
import { signUpSchema } from "../../src/lib/validations";

export default function SignUpScreen() {
  const router = useRouter();
  const signUp = useAuthStore((s) => s.signUp);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [emailConfirmationSent, setEmailConfirmationSent] = useState(false);

  // ── Staggered entrance animations ──
  const backAnim   = useRef(new Animated.Value(0)).current;
  const backX      = useRef(new Animated.Value(-20)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;
  const headerY    = useRef(new Animated.Value(20)).current;
  const f1Anim     = useRef(new Animated.Value(0)).current;
  const f1X        = useRef(new Animated.Value(-20)).current;
  const f2Anim     = useRef(new Animated.Value(0)).current;
  const f2X        = useRef(new Animated.Value(-20)).current;
  const f3Anim     = useRef(new Animated.Value(0)).current;
  const f3X        = useRef(new Animated.Value(-20)).current;
  const f4Anim     = useRef(new Animated.Value(0)).current;
  const f4X        = useRef(new Animated.Value(-20)).current;
  const ctaAnim    = useRef(new Animated.Value(0)).current;
  const ctaY       = useRef(new Animated.Value(20)).current;
  const footAnim   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const slide = (op: Animated.Value, pos: Animated.Value) =>
      Animated.parallel([
        Animated.timing(op, { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.spring(pos, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
      ]);
    Animated.stagger(70, [
      slide(backAnim, backX),
      Animated.parallel([
        Animated.timing(headerAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(headerY, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
      ]),
      slide(f1Anim, f1X),
      slide(f2Anim, f2X),
      slide(f3Anim, f3X),
      slide(f4Anim, f4X),
      Animated.parallel([
        Animated.timing(ctaAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.spring(ctaY, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
      ]),
      Animated.timing(footAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
    ]).start();
  }, []);

  const fields = { fullName: fullName.trim(), email: email.trim(), password, confirmPassword };

  // Real-time Zod validation
  const validate = useCallback(
    (field?: string) => {
      const data = {
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        confirmPassword,
      };
      const result = signUpSchema.safeParse(data);
      const newErrors: Record<string, string> = {};

      if (!result.success) {
        for (const issue of result.error.issues) {
          const key = issue.path[0] as string;
          if (!field || field === key) {
            if (!newErrors[key]) newErrors[key] = issue.message;
          }
        }
      }

      if (field) {
        setErrors((prev) => ({ ...prev, [field]: newErrors[field] ?? "" }));
      } else {
        setErrors(newErrors);
      }

      return result.success;
    },
    [fullName, email, password, confirmPassword]
  );

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validate(field);
  };

  const getSuccess = (field: string, value: string, minLen = 1) => {
    if (touched[field] && !errors[field] && value.trim().length >= minLen) {
      if (field === "email") return "Email looks good!";
      if (field === "fullName") return "Nice name!";
      if (field === "password") return "Strong enough";
      if (field === "confirmPassword") return "Passwords match!";
    }
    return undefined;
  };

  const handleSignUp = async () => {
    setTouched({ fullName: true, email: true, password: true, confirmPassword: true });
    if (!validate()) return;

    setLoading(true);
    try {
      const result = await signUp(email.trim().toLowerCase(), password, fullName.trim());
      if (result === "email_confirmation_required") {
        setEmailConfirmationSent(true);
      } else {
        router.replace("/(onboarding)/select-role");
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Something went wrong";
      Alert.alert("Sign Up Failed", message);
    } finally {
      setLoading(false);
    }
  };

  if (emailConfirmationSent) {
    return (
      <ScreenWrapper>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32, gap: 16 }}>
          <View
            style={{
              width: 88,
              height: 88,
              borderRadius: 44,
              backgroundColor: Colors.secondary.DEFAULT + "15",
              alignItems: "center",
              justifyContent: "center",
              ...Shadows.card,
            }}
          >
            <CheckCircle size={44} color={Colors.secondary.DEFAULT} />
          </View>
          <Text
            style={{
              fontSize: 24,
              fontWeight: "800",
              color: Colors.text.primary,
              textAlign: "center",
              letterSpacing: -0.3,
            }}
          >
            Check your email
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: Colors.text.secondary,
              textAlign: "center",
              lineHeight: 22,
              maxWidth: 300,
            }}
          >
            We sent a confirmation link to{"\n"}
            <Text style={{ fontWeight: "700", color: Colors.text.primary }}>{email}</Text>
            {"\n\n"}Click the link in the email to activate your account.
          </Text>
          <Button
            title="Back to Sign In"
            onPress={() => router.replace("/(auth)/sign-in")}
            variant="outline"
            style={{ marginTop: 16, width: 200 }}
          />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingVertical: 20,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back — slides in */}
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
          <Animated.View style={{ marginBottom: 32, opacity: headerAnim, transform: [{ translateY: headerY }] }}>
            <Image
              source={require("../../assets/hobio-logo.png")}
              style={{ width: 160, height: 64, marginBottom: 20 }}
              resizeMode="contain"
            />
            <Text style={{ fontSize: 30, fontWeight: "800", color: Colors.text.primary, marginBottom: 8, letterSpacing: -0.5 }}>
              Create account
            </Text>
            <Text style={{ fontSize: 16, color: Colors.text.secondary, lineHeight: 24 }}>
              Join the community and start your journey
            </Text>
          </Animated.View>

          {/* Form with staggered entry + live validation */}
          <View style={{ gap: 14, marginBottom: 32 }}>
            <Animated.View style={{ opacity: f1Anim, transform: [{ translateX: f1X }] }}>
              <Input
                label="Full Name"
                placeholder="John Doe"
                value={fullName}
                onChangeText={(t) => { setFullName(t); if (touched.fullName) validate("fullName"); }}
                onBlur={() => handleBlur("fullName")}
                autoCapitalize="words"
                autoComplete="name"
                error={touched.fullName ? errors.fullName : undefined}
                success={getSuccess("fullName", fullName, 2)}
                icon={<UserIcon size={20} color={Colors.text.secondary} />}
              />
            </Animated.View>
            <Animated.View style={{ opacity: f2Anim, transform: [{ translateX: f2X }] }}>
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
                success={getSuccess("email", email)}
                icon={<Mail size={20} color={Colors.text.secondary} />}
              />
            </Animated.View>
            <Animated.View style={{ opacity: f3Anim, transform: [{ translateX: f3X }] }}>
              <Input
                label="Password"
                placeholder="At least 6 characters"
                value={password}
                onChangeText={(t) => { setPassword(t); if (touched.password) validate("password"); }}
                onBlur={() => handleBlur("password")}
                secureTextEntry
                error={touched.password ? errors.password : undefined}
                success={getSuccess("password", password, 6)}
                icon={<Lock size={20} color={Colors.text.secondary} />}
              />
            </Animated.View>
            <Animated.View style={{ opacity: f4Anim, transform: [{ translateX: f4X }] }}>
              <Input
                label="Confirm Password"
                placeholder="Repeat your password"
                value={confirmPassword}
                onChangeText={(t) => { setConfirmPassword(t); if (touched.confirmPassword) validate("confirmPassword"); }}
                onBlur={() => handleBlur("confirmPassword")}
                secureTextEntry
                error={touched.confirmPassword ? errors.confirmPassword : undefined}
                success={getSuccess("confirmPassword", confirmPassword, 6)}
                icon={<ShieldCheck size={20} color={Colors.text.secondary} />}
              />
            </Animated.View>
          </View>

          {/* CTA — slides up */}
          <Animated.View style={{ opacity: ctaAnim, transform: [{ translateY: ctaY }] }}>
            <Button title="Create Account" onPress={handleSignUp} loading={loading} />
          </Animated.View>

          {/* Footer */}
          <Animated.View style={{ flexDirection: "row", justifyContent: "center", marginTop: 24, gap: 4, opacity: footAnim }}>
            <Text style={{ fontSize: 14, color: Colors.text.secondary }}>Already have an account?</Text>
            <TouchableOpacity onPress={() => router.replace("/(auth)/sign-in")}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: Colors.primary.DEFAULT }}>Sign In</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}
