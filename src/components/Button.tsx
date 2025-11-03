import React, { useCallback } from "react";
import {
  GestureResponderEvent,
  Pressable,
  PressableProps,
  StyleSheet,
  Text,
  View,
  ViewStyle
} from "react-native";
import Animated, {
  FadeInUp,
  Layout,
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from "react-native-reanimated";

import { useTheme } from "@theme/index";

type ButtonVariant = "primary" | "secondary" | "outline";
type ButtonSize = "sm" | "md";

type ButtonProps = PressableProps & {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  fullWidth?: boolean;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Button: React.FC<ButtonProps> = ({
  label,
  variant = "primary",
  size = "md",
  icon,
  fullWidth = false,
  style,
  onPressIn,
  onPressOut,
  ...rest
}) => {
  const theme = useTheme();
  const pressed = useSharedValue(0);

  const handlePressIn = useCallback(
    (event: GestureResponderEvent) => {
      pressed.value = 1;
      onPressIn?.(event);
    },
    [onPressIn, pressed]
  );

  const handlePressOut = useCallback(
    (event: GestureResponderEvent) => {
      pressed.value = 0;
      onPressOut?.(event);
    },
    [onPressOut, pressed]
  );

  const animatedStyle = useAnimatedStyle<ViewStyle>(() => ({
    transform: [
      {
        scale: withSpring(pressed.value ? 0.96 : 1, {
          damping: 18,
          stiffness: 220,
          mass: 0.6
        })
      }
    ]
  }));

  const verticalPadding = theme.spacing(size === "md" ? 1.25 : 1);
  const horizontalPadding = theme.spacing(size === "md" ? 2 : 1.5);

  const variantStyle: ViewStyle = (() => {
    switch (variant) {
      case "secondary":
        return {
          backgroundColor: theme.colors.secondary,
          borderWidth: 1,
          borderColor: theme.colors.secondary
        };
      case "outline":
        return {
          backgroundColor: "transparent",
          borderWidth: 1,
          borderColor: theme.colors.border
        };
      default:
        return {
          backgroundColor: theme.colors.primary,
          borderWidth: 1,
          borderColor: theme.colors.primary
        };
    }
  })();

  const textColor =
    variant === "outline"
      ? theme.colors.textPrimary
      : variant === "secondary"
      ? theme.colors.onSecondary
      : theme.colors.onPrimary;

  return (
    <AnimatedPressable
      entering={FadeInUp.duration(220).springify()}
      layout={Layout.springify()}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.base,
        {
          borderRadius: theme.radius.pill,
          paddingVertical: verticalPadding,
          paddingHorizontal: horizontalPadding
        },
        variantStyle,
        fullWidth && styles.fullWidth,
        animatedStyle,
        style
      ]}
      {...rest}
    >
      <View style={styles.content}>
        {icon && <View style={[styles.icon, { marginRight: theme.spacing(0.5) }]}>{icon}</View>}
        <Text style={[theme.typography.textVariants.button, { color: textColor }]}>{label}</Text>
      </View>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  base: {
    justifyContent: "center"
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center"
  },
  icon: {
    alignItems: "center",
    justifyContent: "center"
  },
  fullWidth: {
    alignSelf: "stretch"
  }
});
