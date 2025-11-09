import React from "react";
import {
  Animated,
  Easing,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { FontAwesome5 } from "@expo/vector-icons";

import { ScreenContainer } from "@components/ScreenContainer";
import { Button } from "@components/Button";
import { useTheme } from "@theme/index";
import { RootStackParamList } from "@app/navigation/types";
import appConfig from "../../../app.json";

const ratingOptions = [
  {
    id: "curious",
    emoji: "🐕",
    headline: "Curious pup",
    subcopy: "Still getting the hang of things"
  },
  {
    id: "delighted",
    emoji: "😅",
    headline: "Making progress",
    subcopy: "Training has bright spots"
  },
  {
    id: "thrilled",
    emoji: "😍",
    headline: "Tail-wagging great",
    subcopy: "Everything feels magical"
  }
] as const;

const quickLinks = [
  {
    id: "bug",
    label: "Report a bug",
    emoji: "🪲",
    subject: "Bug%20report",
    helper: "Something glitched"
  },
  {
    id: "feature",
    label: "Suggest a feature",
    emoji: "💡",
    subject: "Feature%20idea",
    helper: "Dream up a tool"
  },
  {
    id: "trainer",
    label: "Trainer question",
    emoji: "🎓",
    subject: "Trainer%20question",
    helper: "Need a coaching tip"
  }
] as const;

type FeedbackNavigation = NativeStackNavigationProp<RootStackParamList, "FeedbackModal">;

export const FeedbackModal: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<FeedbackNavigation>();
  const [selectedRating, setSelectedRating] = React.useState<typeof ratingOptions[number]["id"] | null>(null);
  const pulse = React.useRef(new Animated.Value(0)).current;
  const ratingScales = React.useRef(
    ratingOptions.reduce<Record<string, Animated.Value>>((acc, option) => {
      acc[option.id] = new Animated.Value(1);
      return acc;
    }, {})
  ).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true
        })
      ])
    );

    loop.start();
    return () => {
      loop.stop();
    };
  }, [pulse]);

  const helperOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.65]
  });

  const handleRatingSelect = (id: typeof ratingOptions[number]["id"]) => {
    setSelectedRating(id);
    ratingOptions.forEach((option) => {
      Animated.spring(ratingScales[option.id], {
        toValue: option.id === id ? 1.12 : 1,
        friction: 6,
        tension: 200,
        useNativeDriver: true
      }).start();
    });
  };

  const encodedDiagnostics = React.useMemo(() => {
    const appVersion = (appConfig as { expo?: { version?: string } })?.expo?.version ?? "1.0.0";
    const deviceInfo = `${Platform.OS} ${Platform.Version ?? ""}`.trim();
    const ratingLabel = ratingOptions.find((option) => option.id === selectedRating)?.headline ?? "Not shared";
    const diagnostics = `\n\n---\nDevice: ${deviceInfo}\nApp version: ${appVersion}\nSelected rating: ${ratingLabel}`;
    return encodeURIComponent(diagnostics);
  }, [selectedRating]);

  const handleOpenMail = (subjectSuffix: string, includeDiagnostics = false) => {
    const base = `mailto:hello@goldenretriever.training?subject=${subjectSuffix}`;
    const url = includeDiagnostics ? `${base}&body=${encodedDiagnostics}` : base;
    Linking.openURL(url);
  };

  return (
    <ScreenContainer scrollable>
      <Text style={[styles.heading, { color: theme.colors.textPrimary }]}>
        In-app feedback
      </Text>
      <Animated.Text style={[styles.helper, { color: theme.colors.textSecondary, opacity: helperOpacity }]}>
        We love hearing about Molly’s progress! Your notes guide what we build next.
      </Animated.Text>

      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border
          }
        ]}
      >
        <View style={styles.cardHeaderRow}>
          <Text style={[styles.cardHeading, { color: theme.colors.textPrimary }]}>
            Rate your training vibe
          </Text>
          <FontAwesome5 name="heartbeat" size={16} color={theme.colors.accent} />
        </View>
        <Text style={[styles.cardBody, { color: theme.colors.textSecondary }]}>
          Tap the emoji that best captures this week’s training energy.
        </Text>

        <View style={styles.ratingRow}>
          {ratingOptions.map((option) => (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityState={{ selected: selectedRating === option.id }}
              onPress={() => handleRatingSelect(option.id)}
            >
              <Animated.View
                style={[
                  styles.ratingPill,
                  {
                    borderColor: selectedRating === option.id ? theme.colors.accent : theme.colors.overlay,
                    backgroundColor:
                      selectedRating === option.id
                        ? theme.palette.softSage
                        : theme.colors.surface,
                    transform: [{ scale: ratingScales[option.id] }]
                  }
                ]}
              >
                <Text style={styles.ratingEmoji}>{option.emoji}</Text>
                <View style={styles.ratingCopy}>
                  <Text style={[styles.ratingHeadline, { color: theme.colors.textPrimary }]}>
                    {option.headline}
                  </Text>
                  <Text style={[styles.ratingSubcopy, { color: theme.colors.textSecondary }]}>
                    {option.subcopy}
                  </Text>
                </View>
              </Animated.View>
            </Pressable>
          ))}
        </View>
      </View>

      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.palette.blush,
            borderColor: theme.colors.border
          }
        ]}
      >
        <View style={styles.cardHeaderRow}>
          <Text style={[styles.cardHeading, { color: theme.colors.textPrimary }]}>
            Email the team
          </Text>
          <FontAwesome5 name="envelope" size={16} color={theme.colors.primary} />
        </View>
        <Text style={[styles.cardBody, { color: theme.colors.textSecondary }]}>
          Include quick diagnostics so we can recreate what you are seeing.
        </Text>
        <Button
          label="Open email composer"
          onPress={() => handleOpenMail("Training%20feedback", true)}
          fullWidth
          style={{ marginTop: 12 }}
        />
      </View>

      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.palette.softMist,
            borderColor: theme.colors.border
          }
        ]}
      >
        <View style={styles.cardHeaderRow}>
          <Text style={[styles.cardHeading, { color: theme.colors.textPrimary }]}>
            Quick links
          </Text>
          <FontAwesome5 name="bone" size={16} color={theme.colors.secondary} />
        </View>
        <Text style={[styles.cardBody, { color: theme.colors.textSecondary }]}>
          Jump straight into the note that matches your need.
        </Text>
        <View style={styles.quickLinks}>
          {quickLinks.map((link) => (
            <Pressable
              key={link.id}
              style={[
                styles.quickLink,
                {
                  borderColor: theme.colors.overlay,
                  backgroundColor: theme.colors.surface
                }
              ]}
              onPress={() => handleOpenMail(link.subject)}
            >
              <Text style={styles.quickEmoji}>{link.emoji}</Text>
              <View style={styles.quickCopy}>
                <Text style={[styles.quickLabel, { color: theme.colors.textPrimary }]}>{link.label}</Text>
                <Text style={[styles.quickHelper, { color: theme.colors.textSecondary }]}>
                  {link.helper}
                </Text>
              </View>
              <FontAwesome5 name="chevron-right" size={14} color={theme.colors.textSecondary} />
            </Pressable>
          ))}
        </View>
      </View>

      <Button
        label="Close"
        variant="secondary"
        onPress={() => navigation.goBack()}
        style={{ marginTop: 8 }}
        fullWidth
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  heading: {
    fontSize: 28,
    fontWeight: "700"
  },
  helper: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 22
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    marginBottom: 18
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  cardHeading: {
    fontSize: 18,
    fontWeight: "700"
  },
  cardBody: {
    fontSize: 15,
    lineHeight: 21,
    marginTop: 6,
    marginBottom: 14
  },
  ratingRow: {
    gap: 12
  },
  ratingPill: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
    flexDirection: "row",
    alignItems: "center"
  },
  ratingEmoji: {
    fontSize: 28,
    marginRight: 14
  },
  ratingCopy: {
    flex: 1
  },
  ratingHeadline: {
    fontSize: 16,
    fontWeight: "700"
  },
  ratingSubcopy: {
    fontSize: 13,
    marginTop: 2
  },
  quickLinks: {
    gap: 12
  },
  quickLink: {
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center"
  },
  quickEmoji: {
    fontSize: 22,
    marginRight: 12
  },
  quickCopy: {
    flex: 1
  },
  quickLabel: {
    fontSize: 15,
    fontWeight: "600"
  },
  quickHelper: {
    fontSize: 13,
    marginTop: 2
  }
});
