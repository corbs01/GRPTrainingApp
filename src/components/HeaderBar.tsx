import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@theme/index";

type HeaderBarProps = {
  title: string;
  subtitle?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
};

export const HeaderBar: React.FC<HeaderBarProps> = ({ title, subtitle, leading, trailing }) => {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <Animated.View
      entering={FadeInDown.duration(220).springify()}
      style={[
        styles.container,
        {
          paddingTop: insets.top + theme.spacing(0.5),
          paddingHorizontal: theme.spacing(1.5),
          backgroundColor: theme.colors.background,
          borderBottomColor: theme.colors.border
        }
      ]}
    >
      <View style={styles.row}>
        <View style={styles.side}>{leading}</View>
        <View style={styles.center}>
          <Text style={[theme.typography.textVariants.heading, { color: theme.colors.textPrimary }]}>
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={[
                theme.typography.textVariants.caption,
                { color: theme.colors.textSecondary, marginTop: 4 }
              ]}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View style={[styles.side, styles.alignEnd]}>{trailing}</View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingBottom: 12
  },
  side: {
    flex: 1,
    minHeight: 32,
    justifyContent: "center"
  },
  alignEnd: {
    alignItems: "flex-end"
  },
  center: {
    flex: 2,
    alignItems: "center"
  }
});
