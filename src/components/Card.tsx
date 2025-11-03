import React from "react";
import { StyleSheet, View, ViewProps, ViewStyle } from "react-native";
import Animated, { FadeInDown, Layout } from "react-native-reanimated";

import { useTheme } from "@theme/index";

type CardTone = "default" | "highlight" | "subtle";
type CardPadding = "sm" | "md" | "lg";

type CardProps = ViewProps & {
  tone?: CardTone;
  padding?: CardPadding;
  children: React.ReactNode;
};

const AnimatedView = Animated.createAnimatedComponent(View);

const paddingScale: Record<CardPadding, number> = {
  sm: 1,
  md: 1.5,
  lg: 2
};

export const Card: React.FC<CardProps> = ({
  children,
  tone = "default",
  padding = "md",
  style,
  ...rest
}) => {
  const theme = useTheme();
  const spacing = theme.spacing(paddingScale[padding]);

  const shadowStyle: ViewStyle =
    tone === "subtle"
      ? {
          elevation: 0,
          shadowColor: "transparent",
          shadowOpacity: 0,
          shadowRadius: 0,
          shadowOffset: { width: 0, height: 0 }
        }
      : {
          elevation: theme.shadow.soft.elevation,
          shadowColor: theme.shadow.soft.shadowColor,
          shadowOpacity: theme.shadow.soft.shadowOpacity,
          shadowRadius: theme.shadow.soft.shadowRadius,
          shadowOffset: theme.shadow.soft.shadowOffset
        };

  const toneStyle: ViewStyle = (() => {
    switch (tone) {
      case "highlight":
        return {
          backgroundColor: theme.colors.primarySoft,
          borderWidth: 1,
          borderColor: theme.colors.primary
        };
      case "subtle":
        return {
          backgroundColor: theme.colors.surface,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.border
        };
      default:
        return {
          backgroundColor: theme.colors.card
        };
    }
  })();

  return (
    <AnimatedView
      entering={FadeInDown.duration(240).springify()}
      layout={Layout.springify()}
      style={[
        styles.base,
        {
          borderRadius: theme.radius.lg,
          padding: spacing
        },
        shadowStyle,
        toneStyle,
        style
      ]}
      {...rest}
    >
      {children}
    </AnimatedView>
  );
};

const styles = StyleSheet.create({
  base: {
    overflow: "hidden"
  }
});
