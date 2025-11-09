import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { MMKV } from "react-native-mmkv";

import { AppTheme, ThemeMode, darkTheme, lightTheme } from "./theme";

type ThemeContextValue = {
  theme: AppTheme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: lightTheme,
  mode: "light",
  setMode: () => undefined,
  toggleMode: () => undefined
});

type ThemeProviderProps = {
  children: React.ReactNode;
};

const themePrefsStore = new MMKV({ id: "grp-theme-preferences" });
const THEME_MODE_KEY = "theme-mode";

const readStoredMode = (): ThemeMode => {
  const stored = themePrefsStore.getString(THEME_MODE_KEY);
  return stored === "dark" ? "dark" : "light";
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>(() => readStoredMode());

  const setMode = useCallback((nextMode: ThemeMode) => {
    setModeState(nextMode);
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  useEffect(() => {
    themePrefsStore.set(THEME_MODE_KEY, mode);
  }, [mode]);

  const theme = useMemo<AppTheme>(() => (mode === "dark" ? darkTheme : lightTheme), [mode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      mode,
      setMode,
      toggleMode
    }),
    [theme, mode, toggleMode]
  );

  return (
    <ThemeContext.Provider value={value}>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }
  return context.theme;
};

export const useThemeMode = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeMode must be used inside ThemeProvider");
  }
  return {
    mode: context.mode,
    setMode: context.setMode,
    toggleMode: context.toggleMode
  };
};
