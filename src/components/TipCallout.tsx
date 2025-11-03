import React from "react";
import { StyleSheet, Text, View, ViewProps } from "react-native";
import Animated, { FadeInLeft, Layout } from "react-native-reanimated";

import { useTheme } from "@theme/index";
import { Card } from "./Card";

type TipCalloutProps = ViewProps & {
  title: string;
  message: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
};

export const TipCallout: React.FC<TipCalloutProps> = ({
  title,
  message,
  icon,
  action,
  style,
  ...rest
}) => {
  const theme = useTheme();

  return (
    <Animated.View
      entering={FadeInLeft.duration(240).springify()}
      layout={Layout.springify()}
      style={style}
    >
      <Card
        tone="highlight"
        padding="md"
        style={[
          styles.container,
          {
            borderLeftWidth: 4,
            borderLeftColor: theme.colors.accent,
            backgroundColor: theme.colors.primarySoft
          }
        ]}
        {...rest}
      >
        <View style={styles.content}>
          {icon && (
            <View style={[styles.icon, { backgroundColor: theme.colors.accent }]}>
              {icon}
            </View>
          )}
          <View style={styles.textGroup}>
            <Text style={[theme.typography.textVariants.title, { color: theme.colors.textPrimary }]}>
              {title}
            </Text>
            <Text style={[theme.typography.textVariants.body, { color: theme.colors.textSecondary }]}>
              {message}
            </Text>
          </View>
        </View>
        {action && <View style={styles.action}>{action}</View>}
      </Card>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {},
  content: {
    flexDirection: "row",
    alignItems: "flex-start"
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12
  },
  textGroup: {
    flex: 1
  },
  action: {
    alignSelf: "flex-start"
  }
});
