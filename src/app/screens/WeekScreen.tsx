import React from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  StyleProp,
  Text,
  TextInput,
  View,
  ViewStyle
} from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";

import { ScreenContainer } from "@components/ScreenContainer";
import { Card } from "@components/Card";
import { LessonCard } from "@components/LessonCard";
import { Illustration } from "@components/Illustration";
import { useTheme } from "@theme/index";
import { RootStackParamList } from "@app/navigation/types";
import {
  getDefaultWeek,
  getWeekById,
  getWeekLessonContent,
  LessonDetail,
  WeekLessonContent
} from "@data/index";
import { getWeekIllustrationKey } from "@data/illustrations";
import { useTrainingStore } from "@state/trainingStore";

type WeekScreenRoute = RouteProp<RootStackParamList, "Week">;

export const WeekScreen: React.FC = () => {
  const theme = useTheme();
  const route = useRoute<WeekScreenRoute>();
  const requestedWeekId = route.params?.weekId;

  const weekSummary = React.useMemo(() => {
    if (requestedWeekId) {
      return getWeekById(requestedWeekId) ?? getDefaultWeek();
    }

    return getDefaultWeek();
  }, [requestedWeekId]);

  const resolvedWeekId = weekSummary?.id ?? requestedWeekId;
  const weekContent = React.useMemo<WeekLessonContent | undefined>(
    () => (resolvedWeekId ? getWeekLessonContent(resolvedWeekId) : undefined),
    [resolvedWeekId]
  );

  const completedLessons = useTrainingStore(
    React.useCallback(
      (state) => (resolvedWeekId ? state.weeks[resolvedWeekId]?.completedLessons ?? [] : []),
      [resolvedWeekId]
    )
  );
  const lessonNotes = useTrainingStore(
    React.useCallback(
      (state) => (resolvedWeekId ? state.weeks[resolvedWeekId]?.lessonNotes ?? {} : {}),
      [resolvedWeekId]
    )
  );
  const setActiveWeek = useTrainingStore((state) => state.setActiveWeek);
  const toggleLesson = useTrainingStore((state) => state.toggleLesson);
  const updateLessonNotes = useTrainingStore((state) => state.updateLessonNotes);

  const [selectedLessonId, setSelectedLessonId] = React.useState<string | null>(null);
  const [noteDraft, setNoteDraft] = React.useState<string>("");

  const selectedLesson: LessonDetail | undefined = React.useMemo(() => {
    if (!selectedLessonId || !weekContent) {
      return undefined;
    }
    return weekContent.lessons.find((lesson) => lesson.id === selectedLessonId);
  }, [selectedLessonId, weekContent]);

  React.useEffect(() => {
    if (resolvedWeekId) {
      setActiveWeek(resolvedWeekId);
    }
  }, [resolvedWeekId, setActiveWeek]);

  React.useEffect(() => {
    if (!selectedLessonId) {
      return;
    }
    const existing = lessonNotes[selectedLessonId] ?? "";
    setNoteDraft(existing);
  }, [lessonNotes, selectedLessonId]);

  const handleCloseModal = React.useCallback(() => {
    setSelectedLessonId(null);
  }, []);

  const handleNoteChange = React.useCallback(
    (text: string) => {
      setNoteDraft(text);
      if (resolvedWeekId && selectedLessonId) {
        updateLessonNotes(resolvedWeekId, selectedLessonId, text);
      }
    },
    [resolvedWeekId, selectedLessonId, updateLessonNotes]
  );

  const practicedLessonIds = completedLessons ?? [];
  const heroIllustrationKey = React.useMemo(
    () => getWeekIllustrationKey(weekSummary?.id ?? ""),
    [weekSummary?.id]
  );

  if (!resolvedWeekId || !weekContent) {
    return (
      <ScreenContainer>
        <View style={styles.fallback}>
          <Text
            style={[
              theme.typography.textVariants.title,
              { color: theme.colors.textPrimary, marginBottom: theme.spacing(0.5) }
            ]}
          >
            Week unavailable
          </Text>
          <Text
            style={[
              theme.typography.textVariants.body,
              { color: theme.colors.textSecondary }
            ]}
          >
            We couldn&apos;t find the training plan details for this week.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <>
      <ScreenContainer scrollable>
        <Card tone="highlight">
          <View
            style={[
              styles.heroRow,
              {
                marginBottom: theme.spacing(1.5)
              }
            ]}
          >
            <View style={{ flex: 1, paddingRight: theme.spacing(1) }}>
              <Text
                style={[
                  theme.typography.textVariants.caption,
                  {
                    color: theme.colors.primary,
                    textTransform: "uppercase",
                    letterSpacing: 1.1
                  }
                ]}
              >
                Week {weekSummary?.number ?? ""}
              </Text>
              <Text
                style={[
                  theme.typography.textVariants.title,
                  {
                    color: theme.colors.textPrimary,
                    marginTop: theme.spacing(0.5)
                  }
                ]}
              >
                {weekContent.title}
              </Text>
              {weekSummary?.focus ? (
                <Text
                  style={[
                    theme.typography.textVariants.body,
                    {
                      color: theme.colors.textSecondary,
                      marginTop: theme.spacing(0.75)
                    }
                  ]}
                >
                  Focus: {weekSummary.focus}
                </Text>
              ) : null}
              {weekContent.summary ? (
                <Text
                  style={[
                    theme.typography.textVariants.body,
                    {
                      color: theme.colors.textSecondary,
                      marginTop: theme.spacing(0.75)
                    }
                  ]}
                >
                  {weekContent.summary}
                </Text>
              ) : null}
            </View>
            <Illustration
              name={heroIllustrationKey}
              size={theme.spacing(10)}
              style={{
                borderRadius: theme.radius.lg,
                backgroundColor: theme.palette.softMist
              }}
            />
          </View>
        </Card>

        <View style={{ marginTop: theme.spacing(2) }}>
          <Text
            style={[
              theme.typography.textVariants.title,
              { color: theme.colors.textPrimary }
            ]}
          >
            Lessons this week
          </Text>
          <Text
            style={[
              theme.typography.textVariants.body,
              {
                color: theme.colors.textSecondary,
                marginTop: theme.spacing(0.5)
              }
            ]}
          >
            Tap a lesson to view the full walkthrough and jot down notes.
          </Text>
        </View>

        <View style={{ marginTop: theme.spacing(1.5) }}>
          {weekContent.lessons.map((lesson) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              practiced={practicedLessonIds.includes(lesson.id)}
              onToggle={() => {
                toggleLesson(resolvedWeekId, lesson.id);
              }}
              onPress={() => setSelectedLessonId(lesson.id)}
            />
          ))}
        </View>
      </ScreenContainer>

      <LessonDetailModal
        visible={Boolean(selectedLesson)}
        lesson={selectedLesson}
        practiced={selectedLesson ? practicedLessonIds.includes(selectedLesson.id) : false}
        notes={noteDraft}
        onClose={handleCloseModal}
        onTogglePractice={() => {
          if (selectedLesson && resolvedWeekId) {
            toggleLesson(resolvedWeekId, selectedLesson.id);
          }
        }}
        onChangeNotes={handleNoteChange}
      />
    </>
  );
};

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center"
  }
});

type LessonDetailModalProps = {
  visible: boolean;
  lesson?: LessonDetail;
  practiced: boolean;
  notes: string;
  onClose: () => void;
  onTogglePractice: () => void;
  onChangeNotes: (text: string) => void;
};

const LessonDetailModal: React.FC<LessonDetailModalProps> = ({
  visible,
  lesson,
  practiced,
  notes,
  onClose,
  onTogglePractice,
  onChangeNotes
}) => {
  const theme = useTheme();

  if (!lesson) {
    return null;
  }

  return (
    <Modal
      animationType="slide"
      presentationStyle="pageSheet"
      visible={visible}
      onRequestClose={onClose}
    >
      <View
        style={[
          stylesModal.container,
          {
            backgroundColor: theme.colors.background,
            paddingTop: Platform.OS === "android" ? theme.spacing(3) : theme.spacing(2)
          }
        ]}
      >
        <View style={[stylesModal.header, { paddingHorizontal: theme.spacing(1.5) }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close lesson details"
            hitSlop={12}
            onPress={onClose}
            style={[
              stylesModal.iconButton,
              {
                borderRadius: theme.radius.lg,
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border
              }
            ]}
          >
            <Feather name="x" size={20} color={theme.colors.textPrimary} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={practiced ? "Mark as not practiced" : "Mark as practiced"}
            onPress={onTogglePractice}
            style={[
              stylesModal.practiceButton,
              {
                borderRadius: theme.radius.pill,
                backgroundColor: practiced ? theme.colors.primary : theme.colors.surface,
                borderColor: practiced ? theme.colors.primary : theme.colors.border,
                paddingVertical: theme.spacing(0.75),
                paddingHorizontal: theme.spacing(1.5)
              }
            ]}
          >
            <Feather
              name={practiced ? "check-circle" : "circle"}
              size={18}
              color={practiced ? theme.colors.onPrimary : theme.colors.textSecondary}
            />
            <Text
              style={[
                theme.typography.textVariants.button,
                {
                  color: practiced ? theme.colors.onPrimary : theme.colors.textPrimary,
                  marginLeft: theme.spacing(0.5)
                }
              ]}
            >
              {practiced ? "Practiced" : "Mark practiced"}
            </Text>
          </Pressable>
        </View>

        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: theme.spacing(1.5),
            paddingBottom: theme.spacing(3)
          }}
        >
          <Text
            style={[
              theme.typography.textVariants.title,
              { color: theme.colors.textPrimary }
            ]}
          >
            {lesson.title}
          </Text>
          {lesson.objective ? (
            <Text
              style={[
                theme.typography.textVariants.body,
                {
                  color: theme.colors.textSecondary,
                  marginTop: theme.spacing(0.75)
                }
              ]}
            >
              {lesson.objective}
            </Text>
          ) : null}

          <View style={{ marginTop: theme.spacing(1.5) }}>
            {lesson.duration ? (
              <InfoRow
                icon="clock"
                label="Time"
                value={lesson.duration}
              />
            ) : null}
            {lesson.materials && lesson.materials.length > 0 ? (
              <InfoRow
                icon="package"
                label="Materials"
                value={lesson.materials.join(", ")}
                containerStyle={{ marginTop: theme.spacing(0.75) }}
              />
            ) : null}
          </View>

          {lesson.steps && lesson.steps.length > 0 ? (
            <View style={{ marginTop: theme.spacing(2) }}>
              <SectionTitle title="Steps" />
              {lesson.steps.map((step, index) => (
                <View
                  key={`${lesson.id}-step-${index}`}
                  style={[
                    stylesModal.stepRow,
                    {
                      marginTop: index === 0 ? theme.spacing(0.75) : theme.spacing(0.5)
                    }
                  ]}
                >
                  <View
                    style={[
                      stylesModal.stepBadge,
                      {
                        backgroundColor: theme.colors.primarySoft,
                        borderRadius: theme.radius.pill
                      }
                    ]}
                  >
                    <Text
                      style={[
                        theme.typography.textVariants.caption,
                        { color: theme.colors.primary }
                      ]}
                    >
                      {index + 1}
                    </Text>
                  </View>
                  <Text
                    style={[
                      theme.typography.textVariants.body,
                      {
                        color: theme.colors.textPrimary,
                        flex: 1,
                        marginLeft: theme.spacing(1)
                      }
                    ]}
                  >
                    {step}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {lesson.supportGuidelines && lesson.supportGuidelines.length > 0 ? (
            <View style={{ marginTop: theme.spacing(2) }}>
              <SectionTitle title="What to do if..." />
              {lesson.supportGuidelines.map((guideline, index) => (
                <View
                  key={`${lesson.id}-guideline-${index}`}
                  style={[
                    stylesModal.bulletRow,
                    { marginTop: theme.spacing(0.75) }
                  ]}
                >
                  <View
                    style={[
                      stylesModal.bullet,
                      {
                        backgroundColor: theme.colors.primary,
                        borderRadius: theme.radius.pill
                      }
                    ]}
                  />
                  <Text
                    style={[
                      theme.typography.textVariants.body,
                      {
                        color: theme.colors.textPrimary,
                        flex: 1,
                        marginLeft: theme.spacing(1)
                      }
                    ]}
                  >
                    {guideline}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {lesson.safetyNotes ? (
            <View style={{ marginTop: theme.spacing(2) }}>
              <SectionTitle title="Safety" />
              <Text
                style={[
                  theme.typography.textVariants.body,
                  {
                    color: theme.colors.textPrimary,
                    marginTop: theme.spacing(0.75)
                  }
                ]}
              >
                {lesson.safetyNotes}
              </Text>
            </View>
          ) : null}

          <View style={{ marginTop: theme.spacing(2.5) }}>
            <SectionTitle title="Notes" />
            <Text
              style={[
                theme.typography.textVariants.caption,
                {
                  color: theme.colors.textMuted,
                  marginTop: theme.spacing(0.5)
                }
              ]}
            >
              Jot reminders or adjustments specific to this lesson. Notes stay on your device.
            </Text>
            <TextInput
              multiline
              placeholder="Add your notes..."
              placeholderTextColor={theme.colors.textMuted}
              value={notes}
              onChangeText={onChangeNotes}
              style={[
                stylesModal.notesInput,
                {
                  borderRadius: theme.radius.md,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
                  marginTop: theme.spacing(1),
                  color: theme.colors.textPrimary
                }
              ]}
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

type SectionTitleProps = {
  title: string;
};

const SectionTitle: React.FC<SectionTitleProps> = ({ title }) => {
  const theme = useTheme();
  return (
    <Text
      style={[
        theme.typography.textVariants.bodyStrong,
        {
          color: theme.colors.textPrimary,
          textTransform: "uppercase",
          letterSpacing: 0.8
        }
      ]}
    >
      {title}
    </Text>
  );
};

type InfoRowProps = {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  containerStyle?: StyleProp<ViewStyle>;
};

const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value, containerStyle }) => {
  const theme = useTheme();
  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center"
        },
        containerStyle
      ]}
    >
      <View
        style={[
          stylesModal.iconBadge,
          {
            borderRadius: theme.radius.pill,
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border
          }
        ]}
      >
        <Feather name={icon} size={16} color={theme.colors.textSecondary} />
      </View>
      <Text
        style={[
          theme.typography.textVariants.caption,
          {
            color: theme.colors.textMuted,
            marginLeft: theme.spacing(0.75)
          }
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          theme.typography.textVariants.body,
          {
            color: theme.colors.textPrimary,
            marginLeft: theme.spacing(0.5),
            flex: 1
          }
        ]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
};

const stylesModal = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  iconButton: {
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth
  },
  practiceButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start"
  },
  stepBadge: {
    minWidth: 28,
    paddingVertical: 4,
    alignItems: "center",
    justifyContent: "center"
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start"
  },
  bullet: {
    width: 6,
    height: 6,
    marginTop: 8,
    borderRadius: 3
  },
  iconBadge: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth
  },
  notesInput: {
    minHeight: 120,
    paddingHorizontal: 16,
    paddingVertical: 12,
    textAlignVertical: "top",
    borderWidth: StyleSheet.hairlineWidth
  }
});
