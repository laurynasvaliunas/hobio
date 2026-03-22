import React, { useState } from "react";
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { Eye, EyeOff, Check, AlertCircle } from "lucide-react-native";
import { useTheme } from "../../hooks/useTheme";
import { Fonts } from "../../constants/fonts";

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  success?: string;
  hint?: string;
  icon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  error,
  success,
  hint,
  icon,
  containerStyle,
  secureTextEntry,
  autoCorrect = false,
  ...rest
}: Props) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const borderColor = error
    ? colors.danger.DEFAULT
    : success
    ? colors.secondary.DEFAULT
    : focused
    ? colors.primary.DEFAULT
    : colors.border;

  const feedbackMessage = error || success || hint;
  const feedbackColor = error
    ? colors.danger.DEFAULT
    : success
    ? colors.secondary.DEFAULT
    : colors.text.secondary;

  return (
    <View style={[{ width: "100%", gap: 6 }, containerStyle]}>
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
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          height: 52,
          borderWidth: 1.5,
          borderColor,
          borderRadius: 16,
          backgroundColor: colors.surface,
          paddingHorizontal: 16,
          gap: 12,
        }}
      >
        {icon && <View style={{ opacity: 0.5 }}>{icon}</View>}
        <TextInput
          {...rest}
          autoCorrect={autoCorrect}
          secureTextEntry={secureTextEntry && !showPassword}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          placeholderTextColor={colors.text.secondary + "80"}
          style={[
            {
              flex: 1,
              fontSize: 16,
              fontFamily: Fonts.regular,
              color: colors.text.primary,
              height: "100%",
            },
            rest.style,
          ]}
        />
        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {showPassword ? (
              <EyeOff size={20} color={colors.text.secondary} />
            ) : (
              <Eye size={20} color={colors.text.secondary} />
            )}
          </TouchableOpacity>
        )}
        {!secureTextEntry && error && (
          <AlertCircle size={18} color={colors.danger.DEFAULT} />
        )}
        {!secureTextEntry && success && !error && (
          <Check size={18} color={colors.secondary.DEFAULT} strokeWidth={2.5} />
        )}
      </View>
      {feedbackMessage && (
        <Text
          style={{
            fontSize: 12,
            color: feedbackColor,
            marginLeft: 4,
          }}
        >
          {feedbackMessage}
        </Text>
      )}
    </View>
  );
}
