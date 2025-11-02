import React, { createContext, useContext, useMemo } from "react";
import { StatusBar } from "expo-status-bar";

import { AppTheme, lightTheme } from "./theme";

type ThemeContextValue = {
  theme: AppTheme;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: lightTheme
});

type ThemeProviderProps = {
  children: React.ReactNode;
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: lightTheme
    }),
    []
  );

  return (
    <ThemeContext.Provider value={value}>
      <StatusBar style="dark" />
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
