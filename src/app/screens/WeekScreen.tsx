import React from "react";
import { Text, StyleSheet } from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";

import { ScreenContainer } from "@components/ScreenContainer";
import { useTheme } from "@theme/index";
import { RootStackParamList } from "@app/navigation/types";

type WeekScreenRoute = RouteProp<RootStackParamList, "Week">;

export const WeekScreen: React.FC = () => {
  const theme = useTheme();
  const route = useRoute<WeekScreenRoute>();
  const { weekId } = route.params ?? { weekId: "unknown" };

  return (
    <ScreenContainer>
      <Text style={[styles.heading, { color: theme.colors.textPrimary }]}>
        Week Overview
      </Text>
      <Text style={[styles.body, { color: theme.colors.textSecondary }]}>
        You are viewing the training plan for <Text style={styles.bold}>Week {weekId}</Text>. Lesson details and progress tracking will live here.
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
  },
  bold: {
    fontWeight: "600"
  }
});
