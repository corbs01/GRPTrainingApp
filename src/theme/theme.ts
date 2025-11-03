import { palette, themeColors } from "./colors";
import { typography } from "./typography";

export type AppTheme = {
  colors: typeof themeColors;
  palette: typeof palette;
  typography: typeof typography;
  spacing: (value?: number) => number;
  radius: {
    sm: number;
    md: number;
    lg: number;
    pill: number;
  };
  shadow: {
    soft: {
      elevation: number;
      shadowColor: string;
      shadowOpacity: number;
      shadowRadius: number;
      shadowOffset: {
        width: number;
        height: number;
      };
    };
  };
};

export const lightTheme: AppTheme = {
  colors: themeColors,
  palette,
  typography,
  spacing: (value = 1) => value * 8,
  radius: {
    sm: 10,
    md: 16,
    lg: 24,
    pill: 999
  },
  shadow: {
    soft: {
      elevation: 4,
      shadowColor: "rgba(47, 53, 56, 0.15)",
      shadowOpacity: 0.18,
      shadowRadius: 8,
      shadowOffset: {
        width: 0,
        height: 4
      }
    }
  }
};
