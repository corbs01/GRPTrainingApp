import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@components/Button";
import { Card } from "@components/Card";
import { HeaderBar } from "@components/HeaderBar";
import { ScreenContainer } from "@components/ScreenContainer";
import { TipCallout } from "@components/TipCallout";
import { useTheme } from "@theme/index";

export const HomeScreen: React.FC = () => {
  const theme = useTheme();

  return (
    <ScreenContainer scrollable>
      <HeaderBar title="Golden Retriever Training" subtitle="Week 3 · Confidence building" />

      <View style={{ marginTop: theme.spacing(2) }}>
        <Card padding="lg">
          <Text style={[theme.typography.textVariants.display, { color: theme.colors.textPrimary }]}>
            Welcome back, Corbin!
          </Text>
          <Text
            style={[
              theme.typography.textVariants.body,
              { color: theme.colors.textSecondary, marginTop: theme.spacing(0.75) }
            ]}
          >
            Milo crushed yesterday&apos;s impulse control game. Keep the momentum going with a quick recap
            before today&apos;s walk.
          </Text>
          <Button
            label="Continue week plan"
            fullWidth
            style={{ marginTop: theme.spacing(1.5) }}
            accessibilityLabel="Continue with this week's training plan"
          />
        </Card>

        <Card tone="subtle" style={{ marginTop: theme.spacing(2) }}>
          <Text style={[theme.typography.textVariants.title, { color: theme.colors.textPrimary }]}>
            This week&apos;s progress
          </Text>
          <View style={[styles.progressRow, { marginTop: theme.spacing(1.25) }]}>
            <View style={styles.progressItem}>
              <Text style={[theme.typography.textVariants.heading, { color: theme.colors.textPrimary }]}>4/5</Text>
              <Text style={[theme.typography.textVariants.label, { color: theme.colors.textSecondary }]}>
                Sessions complete
              </Text>
            </View>
            <View style={styles.progressItem}>
              <Text style={[theme.typography.textVariants.heading, { color: theme.colors.textPrimary }]}>2</Text>
              <Text style={[theme.typography.textVariants.label, { color: theme.colors.textSecondary }]}>
                Skills to revisit
              </Text>
            </View>
            <View style={styles.progressItem}>
              <Text style={[theme.typography.textVariants.heading, { color: theme.colors.textPrimary }]}>+12%</Text>
              <Text style={[theme.typography.textVariants.label, { color: theme.colors.textSecondary }]}>
                Focus gain
              </Text>
            </View>
          </View>
        </Card>

        <TipCallout
          title="Trainer tip"
          message="Golden retrievers love to please. Reward quiet sits with calm praise before you clip the leash on—this builds patience before exciting adventures."
          icon={
            <Text
              style={[
                theme.typography.textVariants.label,
                { color: theme.colors.onAccent, fontWeight: "600" }
              ]}
            >
              TIP
            </Text>
          }
          action={
            <Button
              label="View guidance"
              variant="outline"
              size="sm"
              accessibilityLabel="View detailed trainer guidance"
            />
          }
          style={{ marginTop: theme.spacing(2) }}
        />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  progressItem: {
    flex: 1,
    paddingRight: 12
  }
});
