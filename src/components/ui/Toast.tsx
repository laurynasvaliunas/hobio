import React, { useEffect, useRef } from "react";
import { View, Text, Animated, TouchableOpacity } from "react-native";
import { Check, X, AlertTriangle, Info } from "lucide-react-native";
import { Colors } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";
import { create } from "zustand";

type ToastVariant = "success" | "error" | "warning" | "info";

interface ToastData {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
}

interface ToastStore {
  toasts: ToastData[];
  show: (message: string, variant?: ToastVariant, duration?: number) => void;
  dismiss: (id: string) => void;
}

export const useToast = create<ToastStore>((set) => ({
  toasts: [],
  show: (message, variant = "success", duration = 3000) => {
    const id = Date.now().toString();
    set((s) => ({ toasts: [...s.toasts, { id, message, variant, duration }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, duration);
  },
  dismiss: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
}));

const VARIANT_CONFIG = {
  success: { color: Colors.secondary.DEFAULT, bg: Colors.secondary.DEFAULT + "15", Icon: Check },
  error: { color: Colors.danger.DEFAULT, bg: Colors.danger.DEFAULT + "15", Icon: X },
  warning: { color: Colors.warning.dark, bg: Colors.warning.DEFAULT + "25", Icon: AlertTriangle },
  info: { color: Colors.primary.DEFAULT, bg: Colors.primary.light + "20", Icon: Info },
};

function ToastItem({ toast, onDismiss }: { toast: ToastData; onDismiss: () => void }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;
  const config = VARIANT_CONFIG[toast.variant];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }),
    ]).start();

    // Fade out before removal
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }, (toast.duration ?? 3000) - 300);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ translateY }],
        marginBottom: 8,
      }}
    >
      <TouchableOpacity
        onPress={onDismiss}
        activeOpacity={0.9}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          backgroundColor: config.bg,
          borderLeftWidth: 3,
          borderLeftColor: config.color,
          borderRadius: 20,
          paddingHorizontal: 16,
          paddingVertical: 14,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        <config.Icon size={18} color={config.color} strokeWidth={2.5} />
        <Text
          style={{
            flex: 1,
            fontSize: 14,
            fontFamily: Fonts.semiBold,
            color: Colors.text.primary,
          }}
        >
          {toast.message}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

/**
 * Place this component in the root layout to show toasts globally.
 */
export function ToastContainer() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <View
      style={{
        position: "absolute",
        top: 60,
        left: 16,
        right: 16,
        zIndex: 9999,
      }}
      pointerEvents="box-none"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
      ))}
    </View>
  );
}
