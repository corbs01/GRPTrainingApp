import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ScreenContainer } from "@components/ScreenContainer";
import { Button } from "@components/Button";
import { useTheme } from "@theme/index";
import { RootStackParamList } from "@app/navigation/types";

const sections = [
  {
    title: "How your data is used",
    body:
      "We only store the notes, milestones, and puppy profile information that you enter on this device. Nothing is sold or shared with third parties."
  },
  {
    title: "Exporting",
    body:
      "You can export a human readable JSON snapshot anytime from Settings → Data & Privacy. That file is generated on device and you decide where it goes."
  },
  {
    title: "Deleting",
    body:
      "Clearing data wipes the training profile and timeline checkpoints from this device only. There is no remote backup, so make sure you export first if needed."
  }
];

type PrivacyModalNavigation = NativeStackNavigationProp<RootStackParamList, "PrivacyModal">;

export const PrivacyModal: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<PrivacyModalNavigation>();

  return (
    <ScreenContainer scrollable>
      <Text style={[styles.heading, { color: theme.colors.textPrimary }]}>Privacy & data</Text>
      <Text style={[styles.helper, { color: theme.colors.textSecondary }]}>
        We keep things simple and local. Here is what that means in practice.
      </Text>

      {sections.map((section) => (
        <View
          key={section.title}
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border
            }
          ]}
        >
          <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>{section.title}</Text>
          <Text style={[styles.cardBody, { color: theme.colors.textSecondary }]}>{section.body}</Text>
        </View>
      ))}

      <Button
        label="Close"
        variant="secondary"
        onPress={() => navigation.goBack()}
        style={{ marginTop: 16 }}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  heading: {
    fontSize: 26,
    fontWeight: "700"
  },
  helper: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 20
  },
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6
  },
  cardBody: {
    fontSize: 15,
    lineHeight: 22
  }
});
