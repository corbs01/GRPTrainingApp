import React from "react";
import { Text, StyleSheet } from "react-native";

import { ScreenContainer } from "@components/ScreenContainer";
import { useTheme } from "@theme/index";

export const TimelineScreen: React.FC = () => {
  const theme = useTheme();

  return (
    <ScreenContainer scrollable>
      <Text style={[styles.heading, { color: theme.colors.textPrimary }]}>
        Training Timeline
      </Text>
      <Text style={[styles.body, { color: theme.colors.textSecondary }]}>
        Visualize milestones and key events in your pup&apos;s development. Timeline UI and lesson milestones will appear here.
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
