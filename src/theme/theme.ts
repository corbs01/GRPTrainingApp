import { palette, themeColorsLight, themeColorsDark } from "./colors";
import { spacingTokens, radiusTokens, shadowTokens } from "./tokens";
import { typography } from "./typography";

export type ThemeMode = "light" | "dark";
type ThemeColorKeys = keyof typeof themeColorsLight;
export type ThemeColors = Record<ThemeColorKeys, string>;

export type AppTheme = {
  mode: ThemeMode;
  colors: ThemeColors;
  palette: typeof palette;
  typography: typeof typography;
  spacing: (value?: number) => number;
  spacingTokens: typeof spacingTokens;
  radius: typeof radiusTokens;
  radiusTokens: typeof radiusTokens;
  shadow: typeof shadowTokens;
  shadowTokens: typeof shadowTokens;
};

const baseShape = {
  palette,
  typography,
  spacing: (value = 1) => value * 8,
  spacingTokens,
  radius: radiusTokens,
  radiusTokens,
  shadow: shadowTokens,
  shadowTokens
};

export const lightTheme: AppTheme = {
  mode: "light",
  colors: themeColorsLight,
  ...baseShape
};

export const darkTheme: AppTheme = {
  mode: "dark",
  colors: themeColorsDark as ThemeColors,
  ...baseShape
};
