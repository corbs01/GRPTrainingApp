import React from "react";
import { Text, StyleSheet } from "react-native";

import { ScreenContainer } from "@components/ScreenContainer";
import { useTheme } from "@theme/index";

export const SettingsScreen: React.FC = () => {
  const theme = useTheme();

  return (
    <ScreenContainer>
      <Text style={[styles.heading, { color: theme.colors.textPrimary }]}>
        Settings
      </Text>
      <Text style={[styles.body, { color: theme.colors.textSecondary }]}>
        Manage notification preferences, backup options, and appearance tweaks in the next iteration.
      </Text>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  heading: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 16
  },
  body: {
    fontSize: 16,
    lineHeight: 24
  }
});
