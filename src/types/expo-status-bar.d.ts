declare module "expo-status-bar" {
  import type { StatusBarProps } from "react-native";

  export type ExpoStatusBarStyle = "auto" | "inverted" | "light" | "dark";

  export interface ExpoStatusBarProps extends StatusBarProps {
    style?: ExpoStatusBarStyle;
  }

  export const StatusBar: React.ComponentType<ExpoStatusBarProps>;
}
