import React from "react";
import { Text, StyleSheet } from "react-native";

import { ScreenContainer } from "@components/ScreenContainer";
import { useTheme } from "@theme/index";

export const HomeScreen: React.FC = () => {
  const theme = useTheme();

  return (
    <ScreenContainer>
      <Text style={[styles.heading, { color: theme.colors.textPrimary }]}>
        Welcome to the Golden Retriever Puppy Training App
      </Text>
      <Text style={[styles.body, { color: theme.colors.textSecondary }]}>
        Track progress week by week, build great habits, and keep memories of your pup&apos;s journey.
      </Text>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  heading: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 16
  },
  body: {
    fontSize: 16,
    lineHeight: 22
  }
});
