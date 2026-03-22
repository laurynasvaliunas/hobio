import React, { useState, useRef, useEffect } from "react";
import { View, Text, Image, TouchableOpacity, Alert, Animated } from "react-native";
import { useRouter } from "expo-router";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react-native";
import { ScreenWrapper, Button, Input } from "../../src/components/ui";
import { Colors, Shadows } from "../../src/constants/colors";
import { supabase } from "../../src/lib/supabase";
import { z } from "zod";

const emailSchema = z.string().email("Please enter a valid email address");

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [touched, setTouched] = useState(false);

  // Success screen animation
  const successScale = useRef(new Animated.Value(0.5)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (sent) {
      Animated.sequence([
        Animated.parallel([
          Animated.spring(successScale, {
            toValue: 1,
            tension: 60,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.timing(successOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [sent]);

  const validateEmail = () => {
    const result = emailSchema.safeParse(email.trim());
    if (!result.success) {
      setError(result.error.issues[0]?.message);
      return false;
    }
    setError(undefined);
    return true;
  };

  const emailSuccess =
    touched && !error && email.trim().length > 0
      ? "Email looks good!"
      : undefined;

  const handleReset = async () => {
    setTouched(true);
    if (!validateEmail()) return;

    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase()
      );
      if (resetError) throw resetError;
      setSent(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <ScreenWrapper>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 24,
            gap: 16,
          }}
        >
          <Animated.View
            style={{
              opacity: successOpacity,
              transform: [{ scale: successScale }],
            }}
          >
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
          </Animated.View>
          <Animated.View
            style={{
              opacity: textOpacity,
              alignItems: "center",
              gap: 8,
            }}
          >
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
                maxWidth: 280,
              }}
            >
              We've sent a password reset link to{"\n"}
              <Text style={{ fontWeight: "600", color: Colors.text.primary }}>
                {email}
              </Text>
            </Text>
            <Button
              title="Back to Sign In"
              onPress={() => router.replace("/(auth)/sign-in")}
              variant="outline"
              style={{ marginTop: 24, width: 200 }}
            />
          </Animated.View>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          paddingVertical: 20,
        }}
      >
        {/* Back */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginBottom: 32 }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>

        {/* Header */}
        <View style={{ marginBottom: 36 }}>
          <Image
            source={require("../../assets/hobio-logo.png")}
            style={{ width: 160, height: 64, marginBottom: 20 }}
            resizeMode="contain"
          />
          <Text
            style={{
              fontSize: 28,
              fontWeight: "800",
              color: Colors.text.primary,
              marginBottom: 8,
              letterSpacing: -0.3,
            }}
          >
            Reset password
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: Colors.text.secondary,
              lineHeight: 22,
            }}
          >
            Enter your email and we'll send you a secure, time-limited link to reset your password.
          </Text>
        </View>

        {/* Email input */}
        <View style={{ marginBottom: 32 }}>
          <Input
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              if (touched) {
                const result = emailSchema.safeParse(t.trim());
                setError(result.success ? undefined : result.error.issues[0]?.message);
              }
            }}
            onBlur={() => {
              setTouched(true);
              validateEmail();
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={touched ? error : undefined}
            success={emailSuccess}
            icon={<Mail size={20} color={Colors.text.secondary} />}
          />
        </View>

        <Button
          title="Send Reset Link"
          onPress={handleReset}
          loading={loading}
        />
      </View>
    </ScreenWrapper>
  );
}
