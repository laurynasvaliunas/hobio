import { create } from "zustand";
import { Appearance } from "react-native";
import type { ThemeMode } from "../types/database.types";

interface ThemeState {
  /** User's preference: light | dark | system */
  mode: ThemeMode;
  /** Resolved actual theme based on mode + system setting */
  isDark: boolean;

  setMode: (mode: ThemeMode) => void;
}

function resolveIsDark(mode: ThemeMode): boolean {
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return Appearance.getColorScheme() === "dark";
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: "system",
  isDark: resolveIsDark("system"),

  setMode: (mode) => {
    set({ mode, isDark: resolveIsDark(mode) });
  },
}));

// Listen for system theme changes
Appearance.addChangeListener(({ colorScheme }) => {
  const { mode } = useThemeStore.getState();
  if (mode === "system") {
    useThemeStore.setState({ isDark: colorScheme === "dark" });
  }
});
