import React from "react";
import { Text, StyleSheet } from "react-native";

import { ScreenContainer } from "@components/ScreenContainer";
import { useTheme } from "@theme/index";

export const JournalScreen: React.FC = () => {
  const theme = useTheme();

  return (
    <ScreenContainer>
      <Text style={[styles.heading, { color: theme.colors.textPrimary }]}>
        Daily Journal
      </Text>
      <Text style={[styles.body, { color: theme.colors.textSecondary }]}>
        Capture notes, highlights, and training reflections. Rich text editing and tagging will be added later.
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
