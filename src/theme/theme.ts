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
    sm: 8,
    md: 16,
    lg: 28
  },
  shadow: {
    soft: {
      elevation: 3,
      shadowColor: "#00000022",
      shadowOpacity: 0.18,
      shadowRadius: 4,
      shadowOffset: {
        width: 0,
        height: 2
      }
    }
  }
};
