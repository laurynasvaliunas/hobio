import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: "system",
      isDark: resolveIsDark("system"),

      setMode: (mode) => {
        set({ mode, isDark: resolveIsDark(mode) });
      },
    }),
    {
      name: "hobio-theme",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ mode: state.mode }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isDark = resolveIsDark(state.mode);
        }
      },
    }
  )
);

// Listen for system theme changes
Appearance.addChangeListener(({ colorScheme }) => {
  const { mode } = useThemeStore.getState();
  if (mode === "system") {
    useThemeStore.setState({ isDark: colorScheme === "dark" });
  }
});
