import React from "react";
import {
  Alert,
  Animated,
  Easing,
  Image,
  Linking,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View
} from "react-native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { CompositeNavigationProp, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { FontAwesome5 } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import { MMKV } from "react-native-mmkv";

import { ScreenContainer } from "@components/ScreenContainer";
import { Button } from "@components/Button";
import { ThemeMode, useTheme, useThemeMode } from "@theme/index";
import { usePuppyStore } from "@state/puppyStore";
import { useJournalStore } from "@state/journalStore";
import { useTrainingStore } from "@state/trainingStore";
import { useDailyPlanStore } from "@state/dailyPlanStore";
import { getWeekNumberFromDob } from "@lib/weekProgress";
import { RootStackParamList, RootTabParamList } from "@app/navigation/types";
import appConfig from "../../../app.json";

type SettingsNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<RootTabParamList, "Settings">,
  NativeStackNavigationProp<RootStackParamList>
>;

const appVersion =
  (appConfig as { expo?: { version?: string } })?.expo?.version ?? "1.0.0";
const puppyPreview = require("../../../assets/illustrations/default.png");
const surprisedPuppy = require("../../../assets/illustrations/leave-it.png");

const dataPrivacyPrefs = new MMKV({ id: "grp-data-privacy-prefs" });
const LAST_EXPORT_AT_KEY = "last-export-at";

type ThemeOption = {
  key: ThemeMode;
  label: string;
  emoji: string;
  description: string;
  tagline: string;
};

const THEME_OPTIONS: ThemeOption[] = [
  {
    key: "light",
    label: "Daylight",
    emoji: "☀️",
    description: "Storybook pastels",
    tagline: "Illustrated checklists"
  },
  {
    key: "dark",
    label: "Evening",
    emoji: "🌙",
    description: "Cozy dusk palette",
    tagline: "Candlelight focus"
  }
];

export const SettingsScreen: React.FC = () => {
  const theme = useTheme();
  const { mode, setMode } = useThemeMode();
  const navigation = useNavigation<SettingsNavigation>();
  const puppy = usePuppyStore((state) => state.puppy);
  const clearPuppy = usePuppyStore((state) => state.clearPuppy);
  const journalEntries = useJournalStore((state) => state.entries);
  const clearJournal = useJournalStore((state) => state.clearAll);
  const trainingWeeks = useTrainingStore((state) => state.weeks);
  const resetTraining = useTrainingStore((state) => state.reset);
  const plans = useDailyPlanStore((state) => state.plans);
  const lessonEngagement = useDailyPlanStore((state) => state.lessonEngagement);
  const lastShownByWeek = useDailyPlanStore((state) => state.lastShownByWeek);
  const resetDailyPlan = useDailyPlanStore((state) => state.reset);
  const themeAnimation = React.useRef(new Animated.Value(mode === "dark" ? 1 : 0)).current;
  const [isExporting, setIsExporting] = React.useState(false);
  const [isClearing, setIsClearing] = React.useState(false);
  const [showClearModal, setShowClearModal] = React.useState(false);
  const [lastExportAt, setLastExportAt] = React.useState<number | null>(() => {
    const stored = dataPrivacyPrefs.getNumber(LAST_EXPORT_AT_KEY);
    return typeof stored === "number" ? stored : null;
  });
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const toastOpacity = React.useRef(new Animated.Value(0)).current;
  const toastTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    Animated.timing(themeAnimation, {
      toValue: mode === "dark" ? 1 : 0,
      duration: 240,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false
    }).start();
  }, [mode, themeAnimation]);

  const friendlyDob = React.useMemo(() => {
    if (!puppy?.dob) {
      return "Add a birthday";
    }
    return new Date(puppy.dob).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  }, [puppy?.dob]);

  const currentWeek = React.useMemo(() => {
    if (!puppy?.dob) {
      return null;
    }
    return getWeekNumberFromDob(puppy.dob);
  }, [puppy?.dob]);

  const cardPalette = React.useMemo(
    () => ({
      profile: mode === "dark" ? "rgba(216,230,207,0.16)" : theme.palette.softSage,
      theme: mode === "dark" ? "rgba(214,224,232,0.14)" : theme.palette.softMist,
      privacy: mode === "dark" ? "rgba(249,226,195,0.16)" : theme.palette.warmHighlight,
      feedback: mode === "dark" ? "rgba(244,221,225,0.16)" : theme.palette.blush
    }),
    [mode, theme]
  );

  React.useEffect(() => {
    return () => {
      if (toastTimeout.current) {
        clearTimeout(toastTimeout.current);
      }
    };
  }, []);

  const showToast = React.useCallback(
    (message: string) => {
      if (toastTimeout.current) {
        clearTimeout(toastTimeout.current);
      }
      setToastMessage(message);
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true
      }).start();
      toastTimeout.current = setTimeout(() => {
        Animated.timing(toastOpacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true
        }).start(({ finished }) => {
          if (finished) {
            setToastMessage(null);
          }
        });
      }, 2600);
    },
    [toastOpacity]
  );

  const formattedLastExport = React.useMemo(() => {
    if (!lastExportAt) {
      return null;
    }
    return new Date(lastExportAt).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  }, [lastExportAt]);

  const handleExportData = React.useCallback(async () => {
    if (isExporting) {
      return;
    }
    setIsExporting(true);
    let exportFileUri: string | null = null;
    try {
      const metadata = {
        format: "grp-training-export/v1",
        generatedAt: new Date().toISOString()
      };
      const bundle = {
        metadata,
        puppyProfile: puppy ?? null,
        journalEntries,
        lessonLogs: {
          trainingWeeks,
          dailyPlans: plans,
          lessonEngagement,
          lastShownByWeek
        }
      };
      const payload = JSON.stringify(bundle, null, 2);
      const directory = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
      if (!directory) {
        throw new Error("No writable directory available");
      }
      const safeTimestamp = metadata.generatedAt.replace(/[:.]/g, "-");
      const fileName = `grp-training-export-${safeTimestamp}.json`;
      exportFileUri = `${directory}${fileName}`;
      await FileSystem.writeAsStringAsync(exportFileUri, payload, {
        encoding: FileSystem.EncodingType.UTF8
      });
      const result = await Share.share({
        title: "Export my puppy data",
        message: "Your puppy profile, journal entries, and lesson logs are ready.",
        url: exportFileUri
      });
      if (result.action === Share.sharedAction) {
        const timestamp = Date.now();
        dataPrivacyPrefs.set(LAST_EXPORT_AT_KEY, timestamp);
        setLastExportAt(timestamp);
        showToast("Your training memories are ready!");
      }
    } catch (error) {
      console.error("Failed to export data", error);
      Alert.alert(
        "Export failed",
        "We couldn't prepare your bundle. Please try again in a moment."
      );
    } finally {
      setIsExporting(false);
      if (exportFileUri) {
        try {
          await FileSystem.deleteAsync(exportFileUri, { idempotent: true });
        } catch {
          // Best-effort cleanup.
        }
      }
    }
  }, [
    isExporting,
    puppy,
    journalEntries,
    trainingWeeks,
    plans,
    lessonEngagement,
    lastShownByWeek,
    showToast
  ]);

  const handleClearData = React.useCallback(() => {
    setShowClearModal(true);
  }, []);

  const handleDismissClearModal = React.useCallback(() => {
    if (isClearing) {
      return;
    }
    setShowClearModal(false);
  }, [isClearing]);

  const handleConfirmClearData = React.useCallback(() => {
    if (isClearing) {
      return;
    }
    setIsClearing(true);
    try {
      clearPuppy();
      clearJournal();
      resetTraining();
      resetDailyPlan();
      dataPrivacyPrefs.delete(LAST_EXPORT_AT_KEY);
      setLastExportAt(null);
      showToast("Local data cleared.");
      setShowClearModal(false);
    } catch (error) {
      console.error("Failed to clear local data", error);
      Alert.alert(
        "Couldn't clear data",
        "Please restart the app and try again if this continues."
      );
    } finally {
      setIsClearing(false);
    }
  }, [clearPuppy, clearJournal, resetTraining, resetDailyPlan, showToast, isClearing]);

  const handleOpenFeedback = React.useCallback(() => {
    navigation.navigate("FeedbackModal");
  }, [navigation]);

  const handleVisitSite = React.useCallback(() => {
    Linking.openURL("https://goldenretriever.training");
  }, []);

  const previewBackground = themeAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ["#FFF9F1", theme.palette.midnight]
  });
  const previewGlow = themeAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0.85)", "rgba(255,255,255,0.16)"]
  });
  const previewSparkles = themeAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.25, 0.7]
  });

  return (
    <View style={styles.screenWrapper}>
      <ScreenContainer scrollable>
        <Text style={[styles.heading, { color: theme.colors.textPrimary }]}>Settings</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        Tune your puppy profile, pick a theme, export memories, and send feedback.
      </Text>

      {/* Puppy Profile */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: cardPalette.profile,
            borderColor: theme.colors.border
          }
        ]}
      >
        <SectionHeader label="Puppy Profile" />
        <View style={styles.profileRow}>
          <View
            style={[
              styles.avatar,
              {
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface
              }
            ]}
          >
            {puppy?.photoUri ? (
              <Image source={{ uri: puppy.photoUri }} style={styles.avatarImage} />
            ) : (
              <FontAwesome5 name="paw" size={24} color={theme.colors.textMuted} />
            )}
          </View>
          <View style={styles.profileCopy}>
            <Text style={[styles.profileName, { color: theme.colors.textPrimary }]}>
              {puppy?.name ?? "Add a name"}
            </Text>
            <Text style={[styles.profileMeta, { color: theme.colors.textSecondary }]}>
              DOB · {friendlyDob}
            </Text>
            <Text style={[styles.profileMeta, { color: theme.colors.textSecondary }]}>
              Training week · {currentWeek ? `Week ${currentWeek}` : "Not set"}
            </Text>
          </View>
        </View>
        <Button
          label={puppy ? "Edit profile" : "Create profile"}
          onPress={() => navigation.navigate("EditPuppyProfile")}
          fullWidth
          style={{ marginTop: 16 }}
        />
      </View>

      {/* Theme */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: cardPalette.theme,
            borderColor: theme.colors.border
          }
        ]}
      >
        <SectionHeader label="Theme" />
        <Text style={[styles.cardBody, { color: theme.colors.textSecondary }]}>
          Cozy pastels for daytime stories or a moonlit palette for evening snuggles.
        </Text>

        <View style={styles.themeOptionRow}>
          {THEME_OPTIONS.map((option) => {
            const selected = mode === option.key;
            return (
              <Pressable
                key={option.key}
                onPress={() => setMode(option.key)}
                style={styles.themeOptionPressable}
                accessibilityRole="button"
                accessibilityLabel={`${option.label} theme`}
                accessibilityState={{ selected }}
              >
                {({ pressed }) => (
                  <View
                    style={[
                      styles.themeOptionCard,
                      {
                        backgroundColor: selected ? theme.colors.card : theme.colors.surface,
                        borderColor: selected ? theme.colors.accent : theme.colors.overlay,
                        opacity: pressed ? 0.92 : 1
                      }
                    ]}
                  >
                    <Text style={styles.themeOptionEmoji}>{option.emoji}</Text>
                    <Text style={[styles.themeMoodTitle, { color: theme.colors.textPrimary }]}>
                      {option.label}
                    </Text>
                    <Text style={[styles.themeMoodCopy, { color: theme.colors.textSecondary }]}>
                      {option.description}
                    </Text>
                    <View
                      style={[
                        styles.themeOptionPill,
                        {
                          backgroundColor: selected
                            ? theme.palette.softSage
                            : theme.palette.softMist
                        }
                      ]}
                    >
                      <Text
                        style={[
                          styles.themeOptionPillText,
                          {
                            color: selected ? theme.colors.onPrimary : theme.colors.textSecondary
                          }
                        ]}
                      >
                        {option.tagline}
                      </Text>
                    </View>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        <Animated.View
          style={[
            styles.themePreview,
            {
              backgroundColor: previewBackground,
              borderColor: theme.colors.overlay,
              shadowColor: theme.colors.overlay
            }
          ]}
        >
          <View style={styles.previewCopy}>
            <Text style={[styles.previewTitle, { color: theme.colors.textPrimary }]}>
              {mode === "light" ? "Daylight storybook" : "Evening wind-down"}
            </Text>
            <Text style={[styles.previewBody, { color: theme.colors.textSecondary }]}>
              {mode === "light"
                ? "Soft parchment backgrounds with gentle sage dividers."
                : "Twilight blues with ember accents for cozy reflection."}
            </Text>
          </View>
          <View style={styles.previewArt}>
            <Animated.View style={[styles.previewHalo, { backgroundColor: previewGlow }]} />
            <Image source={puppyPreview} style={styles.previewImage} />
            <Animated.View
              style={[
                styles.previewSparkle,
                styles.previewSparkleLeft,
                { opacity: previewSparkles }
              ]}
            />
            <Animated.View
              style={[
                styles.previewSparkle,
                styles.previewSparkleRight,
                { opacity: previewSparkles }
              ]}
            />
          </View>
        </Animated.View>
      </View>

        {/* Data & Privacy */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: cardPalette.privacy,
              borderColor: theme.colors.border
            }
          ]}
        >
          <SectionHeader label="Data & Privacy" />
          <ActionRow
            title="Export My Data"
            body="Create a JSON bundle with your puppy profile, journal entries, and lesson logs."
            actionLabel={isExporting ? "Preparing…" : "Export"}
            onAction={handleExportData}
            disabled={isExporting}
          />
          <Text style={[styles.exportMeta, { color: theme.colors.textSecondary }]}>
            {formattedLastExport ? `Last exported ${formattedLastExport}` : "No exports yet"}
          </Text>
          <View style={[styles.separator, { backgroundColor: theme.colors.overlay }]} />
          <ActionRow
            title="Clear All Local Data"
            body="Remove puppy details, journal entries, and lesson progress from this device."
            actionLabel={isClearing ? "Clearing…" : "Clear all"}
            destructive
            onAction={handleClearData}
            disabled={isClearing}
          />
          <Button
            label="Privacy details"
            variant="outline"
            onPress={() => navigation.navigate("PrivacyModal")}
            style={{ marginTop: 18 }}
            fullWidth
          />
        </View>

      {/* Feedback & About */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: cardPalette.feedback,
            borderColor: theme.colors.border
          }
        ]}
      >
        <SectionHeader label="Feedback & About" />
        <Text style={[styles.cardBody, { color: theme.colors.textSecondary }]}>
          We read every note and use it to plan weekly improvements.
        </Text>
        <View style={styles.feedbackButtons}>
          <Button label="Share feedback in-app" onPress={handleOpenFeedback} fullWidth />
          <Button label="Visit site" variant="secondary" onPress={handleVisitSite} fullWidth />
        </View>
        <Text style={[styles.versionText, { color: theme.colors.textMuted }]}>
          Version {appVersion} · Crafted with extra belly rubs
        </Text>
      </View>
      </ScreenContainer>
      {toastMessage ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.toast,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.overlay,
              shadowColor: theme.colors.overlay,
              opacity: toastOpacity
            }
          ]}
        >
          <Text style={[styles.toastText, { color: theme.colors.textPrimary }]}>{toastMessage}</Text>
        </Animated.View>
      ) : null}
      <Modal
        transparent
        animationType="fade"
        visible={showClearModal}
        onRequestClose={handleDismissClearModal}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border
              }
            ]}
          >
            <Image source={surprisedPuppy} style={styles.modalIllustration} />
            <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>Are you sure?</Text>
            <Text style={[styles.modalBody, { color: theme.colors.textSecondary }]}>
              Clearing local data removes your puppy profile, journal entries, and lesson logs from
              this device. This can't be undone.
            </Text>
            <View style={styles.modalActions}>
              <Button
                label="Keep data"
                variant="outline"
                onPress={handleDismissClearModal}
                fullWidth
                disabled={isClearing}
              />
              <Button
                label={isClearing ? "Clearing…" : "Clear everything"}
                variant="outline"
                onPress={handleConfirmClearData}
                fullWidth
                disabled={isClearing}
                style={[styles.modalDestructiveButton, { borderColor: theme.colors.error }]}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const SectionHeader: React.FC<{ label: string }> = ({ label }) => {
  const theme = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <FontAwesome5
        name="paw"
        size={16}
        color={theme.colors.accent}
        style={{ marginRight: 8 }}
      />
      <Text style={[styles.sectionLabel, { color: theme.colors.textPrimary }]}>{label}</Text>
    </View>
  );
};

type ActionRowProps = {
  title: string;
  body: string;
  actionLabel: string;
  destructive?: boolean;
  disabled?: boolean;
  onAction: () => void;
};

const ActionRow: React.FC<ActionRowProps> = ({
  title,
  body,
  actionLabel,
  destructive,
  disabled,
  onAction
}) => {
  const theme = useTheme();
  return (
    <View style={styles.actionRow}>
      <View style={styles.actionCopy}>
        <Text style={[styles.actionTitle, { color: theme.colors.textPrimary }]}>{title}</Text>
        <Text style={[styles.actionBody, { color: theme.colors.textSecondary }]}>{body}</Text>
      </View>
      <Button
        label={actionLabel}
        size="sm"
        variant={destructive ? "outline" : "secondary"}
        onPress={onAction}
        disabled={disabled}
        style={[
          styles.actionButton,
          destructive && { borderColor: theme.colors.error },
          disabled && styles.actionButtonDisabled
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1
  },
  heading: {
    fontSize: 30,
    fontWeight: "700"
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 24
  },
  card: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: "700"
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 36
  },
  profileCopy: {
    flex: 1
  },
  profileName: {
    fontSize: 20,
    fontWeight: "700"
  },
  profileMeta: {
    fontSize: 14,
    marginTop: 2
  },
  cardBody: {
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 16
  },
  themeOptionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4
  },
  themeOptionPressable: {
    flex: 1
  },
  themeOptionCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16
  },
  themeOptionEmoji: {
    fontSize: 24,
    marginBottom: 6
  },
  themeMoodTitle: {
    fontSize: 16,
    fontWeight: "700"
  },
  themeMoodCopy: {
    fontSize: 13,
    marginTop: 4
  },
  themeOptionPill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 10
  },
  themeOptionPillText: {
    fontSize: 12,
    fontWeight: "600"
  },
  themePreview: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    marginTop: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4
  },
  previewCopy: {
    flex: 1,
    paddingRight: 12
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: "700"
  },
  previewBody: {
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18
  },
  previewArt: {
    width: 120,
    height: 120,
    alignItems: "center",
    justifyContent: "center"
  },
  previewHalo: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 60
  },
  previewImage: {
    width: 110,
    height: 110,
    resizeMode: "contain"
  },
  previewSparkle: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FFFFFF"
  },
  previewSparkleLeft: {
    top: 18,
    left: 20
  },
  previewSparkleRight: {
    bottom: 20,
    right: 14
  },
  separator: {
    height: 1,
    marginVertical: 16
  },
  exportMeta: {
    fontSize: 12,
    marginTop: 8
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16
  },
  actionCopy: {
    flex: 1
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "600"
  },
  actionBody: {
    fontSize: 13,
    marginTop: 2
  },
  actionButton: {
    minWidth: 110
  },
  actionButtonDisabled: {
    opacity: 0.6
  },
  feedbackButtons: {
    flexDirection: "column",
    gap: 12,
    marginTop: 16
  },
  versionText: {
    textAlign: "center",
    marginTop: 16,
    fontSize: 13
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24
  },
  modalCard: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 24,
    width: "100%"
  },
  modalIllustration: {
    width: 150,
    height: 130,
    alignSelf: "center",
    resizeMode: "contain",
    marginBottom: 12
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center"
  },
  modalBody: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 8
  },
  modalActions: {
    marginTop: 20,
    flexDirection: "column",
    gap: 12
  },
  modalDestructiveButton: {
    borderWidth: 1
  },
  toast: {
    position: "absolute",
    left: 24,
    right: 24,
    bottom: 32,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6
  },
  toastText: {
    textAlign: "center",
    fontWeight: "600"
  }
});
