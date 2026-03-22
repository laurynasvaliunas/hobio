import { useThemeStore } from "../stores/themeStore";
import {
  LightColors,
  DarkColors,
  LightShadows,
  DarkShadows,
  type ThemeColors,
  type ThemeShadows,
} from "../constants/colors";

/**
 * Returns the resolved theme colors and shadows based on the user's preference.
 *
 * Usage:
 *   const { colors, shadows, isDark } = useTheme();
 *   <View style={{ backgroundColor: colors.background }} />
 */
export function useTheme(): {
  colors: ThemeColors;
  shadows: ThemeShadows;
  isDark: boolean;
} {
  const isDark = useThemeStore((s) => s.isDark);

  return {
    colors: isDark ? DarkColors : LightColors,
    shadows: isDark ? DarkShadows : LightShadows,
    isDark,
  };
}
