import React from "react";
import { Text, StyleSheet } from "react-native";

import { ScreenContainer } from "@components/ScreenContainer";
import { useTheme } from "@theme/index";

export const GalleryScreen: React.FC = () => {
  const theme = useTheme();

  return (
    <ScreenContainer scrollable>
      <Text style={[styles.heading, { color: theme.colors.textPrimary }]}>
        Gallery
      </Text>
      <Text style={[styles.body, { color: theme.colors.textSecondary }]}>
        Save adorable puppy photos and videos. Media grids and filters will live in this section.
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
