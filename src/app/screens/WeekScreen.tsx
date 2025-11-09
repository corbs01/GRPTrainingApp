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
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ScreenContainer } from "@components/ScreenContainer";
import { Card } from "@components/Card";
import { LessonCard } from "@components/LessonCard";
import { Illustration } from "@components/Illustration";
import { useTheme } from "@theme/index";
import { RootStackParamList } from "@app/navigation/types";
import {
  getDefaultWeek,
  getSupportItemById,
  getWeekById,
  getWeekLessonContent,
  LessonDetail,
  WeekLessonContent
} from "@data/index";
import { getWeekIllustrationKey } from "@data/illustrations";
import { useTrainingStore } from "@state/trainingStore";
import { usePractice } from "@lib/practiceLog";
import { useLessonStepChecklist } from "@lib/dailySteps";

type WeekScreenRoute = RouteProp<RootStackParamList, "Week">;
type WeekScreenNavigation = NativeStackNavigationProp<RootStackParamList>;
type NoteSaveStatus = "idle" | "debouncing" | "saving" | "saved" | "error";
type PendingNoteSave = {
  weekId: string;
  lessonId: string;
  text: string;
};
const NOTE_DEBOUNCE_MS = 300;
const NOTE_STATUS_RESET_MS = 2000;

export const WeekScreen: React.FC = () => {
  const theme = useTheme();
  const route = useRoute<WeekScreenRoute>();
  const navigation = useNavigation<WeekScreenNavigation>();
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

  React.useEffect(() => {
    const targetLessonId = route.params?.lessonId;
    if (!targetLessonId || !weekContent) {
      return;
    }
    const exists = weekContent.lessons.some((lesson) => lesson.id === targetLessonId);
    if (exists) {
      setSelectedLessonId(targetLessonId);
    }
  }, [route.params?.lessonId, weekContent]);

  const lessonNotes = useTrainingStore(
    React.useCallback(
      (state) => (resolvedWeekId ? state.weeks[resolvedWeekId]?.lessonNotes ?? {} : {}),
      [resolvedWeekId]
    )
  );
  const setActiveWeek = useTrainingStore((state) => state.setActiveWeek);
  const updateLessonNotes = useTrainingStore((state) => state.updateLessonNotes);

  const [selectedLessonId, setSelectedLessonId] = React.useState<string | null>(null);
  const [noteDraft, setNoteDraft] = React.useState<string>("");
  const [noteStatus, setNoteStatus] = React.useState<NoteSaveStatus>("idle");
  const saveTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedAckTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSaveRef = React.useRef<PendingNoteSave | null>(null);

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
    setNoteStatus("idle");
    pendingSaveRef.current = null;
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    if (savedAckTimeoutRef.current) {
      clearTimeout(savedAckTimeoutRef.current);
      savedAckTimeoutRef.current = null;
    }
  }, [lessonNotes, selectedLessonId]);

  const handleCloseModal = React.useCallback(() => {
    setSelectedLessonId(null);
  }, []);

  const flushPendingSave = React.useCallback(() => {
    const payload = pendingSaveRef.current;
    if (!payload) {
      return;
    }
    setNoteStatus("saving");
    try {
      updateLessonNotes(payload.weekId, payload.lessonId, payload.text);
      pendingSaveRef.current = null;
      if (savedAckTimeoutRef.current) {
        clearTimeout(savedAckTimeoutRef.current);
      }
      setNoteStatus("saved");
      savedAckTimeoutRef.current = setTimeout(() => {
        setNoteStatus("idle");
      }, NOTE_STATUS_RESET_MS);
    } catch {
      setNoteStatus("error");
    }
  }, [updateLessonNotes]);

  const queueNoteSave = React.useCallback(
    (text: string) => {
      if (!resolvedWeekId || !selectedLessonId) {
        return;
      }
      pendingSaveRef.current = {
        weekId: resolvedWeekId,
        lessonId: selectedLessonId,
        text
      };
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      setNoteStatus("debouncing");
      saveTimeoutRef.current = setTimeout(() => {
        saveTimeoutRef.current = null;
        flushPendingSave();
      }, NOTE_DEBOUNCE_MS);
    },
    [resolvedWeekId, selectedLessonId, flushPendingSave]
  );

  const handleNoteChange = React.useCallback(
    (text: string) => {
      setNoteDraft(text);
      queueNoteSave(text);
    },
    [queueNoteSave]
  );

  const handleRetrySave = React.useCallback(() => {
    if (!pendingSaveRef.current && resolvedWeekId && selectedLessonId) {
      pendingSaveRef.current = {
        weekId: resolvedWeekId,
        lessonId: selectedLessonId,
        text: noteDraft
      };
    }
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    flushPendingSave();
  }, [flushPendingSave, noteDraft, resolvedWeekId, selectedLessonId]);

  const handleOpenSupportTopic = React.useCallback(
    (supportId: string) => {
      navigation.navigate("RootTabs", {
        screen: "Support",
        params: { focusSupportId: supportId }
      });
    },
    [navigation]
  );

  React.useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (savedAckTimeoutRef.current) {
        clearTimeout(savedAckTimeoutRef.current);
      }
    };
  }, []);

  const detailPractice = usePractice(selectedLessonId ?? "__lesson-detail__");

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
            Tap a lesson to get the plan and track today&apos;s work.
          </Text>
        </View>

        <View style={{ marginTop: theme.spacing(1.5) }}>
          {weekContent.lessons.map((lesson) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              onPress={() => setSelectedLessonId(lesson.id)}
            />
          ))}
        </View>
      </ScreenContainer>

      <LessonDetailModal
        visible={Boolean(selectedLesson)}
        lesson={selectedLesson}
        practiced={selectedLesson ? detailPractice.practicedToday : false}
        notes={noteDraft}
        noteStatus={noteStatus}
        onClose={handleCloseModal}
        onTogglePractice={() => {
          if (selectedLesson) {
            detailPractice.toggle();
          }
        }}
        onChangeNotes={handleNoteChange}
        onRetrySave={handleRetrySave}
        onOpenSupportTopic={handleOpenSupportTopic}
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
  noteStatus: NoteSaveStatus;
  onClose: () => void;
  onTogglePractice: () => void;
  onChangeNotes: (text: string) => void;
  onRetrySave: () => void;
  onOpenSupportTopic: (supportId: string) => void;
};

const LessonDetailModal: React.FC<LessonDetailModalProps> = ({
  visible,
  lesson,
  practiced,
  notes,
  noteStatus,
  onClose,
  onTogglePractice,
  onChangeNotes,
  onRetrySave,
  onOpenSupportTopic
}) => {
  const theme = useTheme();
  const [sectionsOpen, setSectionsOpen] = React.useState({
    support: false,
    safety: false
  });

  React.useEffect(() => {
    setSectionsOpen({
      support: false,
      safety: false
    });
  }, [lesson?.id]);

  if (!lesson) {
    return null;
  }

  const lessonSteps = lesson.steps ?? [];
  const { completed, toggleStep } = useLessonStepChecklist(lesson.id, lessonSteps.length);
  const supportShortcuts = React.useMemo(() => {
    if (!lesson.supportTopics || lesson.supportTopics.length === 0) {
      return [];
    }

    return lesson.supportTopics
      .map((topicId) => {
        const lookup = getSupportItemById(topicId);
        if (!lookup) {
          return null;
        }
        return {
          id: topicId,
          title: lookup.item.title
        };
      })
      .filter((entry): entry is { id: string; title: string } => Boolean(entry));
  }, [lesson.supportTopics]);

  const renderNoteStatus = () => {
    switch (noteStatus) {
      case "saving":
      case "debouncing":
        return (
          <Text
            style={[
              theme.typography.textVariants.caption,
              { color: theme.colors.textSecondary }
            ]}
          >
            Saving…
          </Text>
        );
      case "saved":
        return (
          <Text
            style={[
              theme.typography.textVariants.caption,
              { color: theme.colors.success }
            ]}
          >
            Saved ✓
          </Text>
        );
      case "error":
        return (
          <Pressable onPress={onRetrySave}>
            <Text
              style={[
                theme.typography.textVariants.caption,
                { color: theme.colors.error }
              ]}
            >
              Didn&apos;t save. Tap to retry.
            </Text>
          </Pressable>
        );
      default:
        return null;
    }
  };

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

          {lessonSteps.length > 0 ? (
            <View style={{ marginTop: theme.spacing(2) }}>
              <SectionTitle title="Steps" />
              <Text
                style={[
                  theme.typography.textVariants.caption,
                  {
                    color: theme.colors.textMuted,
                    marginTop: theme.spacing(0.5)
                  }
                ]}
              >
                Tap each move as you coach. Checks clear tomorrow.
              </Text>
              {lessonSteps.map((step, index) => {
                const done = completed[index];
                return (
                  <Pressable
                    key={`${lesson.id}-step-${index}`}
                    style={[
                      stylesModal.stepRow,
                      {
                        marginTop: index === 0 ? theme.spacing(0.75) : theme.spacing(0.5)
                      }
                    ]}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: done }}
                    onPress={() => toggleStep(index)}
                  >
                    <View
                      style={[
                        stylesModal.stepBadge,
                        {
                          backgroundColor: done
                            ? theme.colors.primary
                            : theme.colors.primarySoft,
                          borderRadius: theme.radius.pill
                        }
                      ]}
                    >
                      <Text
                        style={[
                          theme.typography.textVariants.caption,
                          {
                            color: done ? theme.colors.onPrimary : theme.colors.primary
                          }
                        ]}
                      >
                        {done ? "✓" : index + 1}
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
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {(supportShortcuts.length > 0 ||
            (lesson.supportGuidelines && lesson.supportGuidelines.length > 0)) ? (
            <View style={{ marginTop: theme.spacing(2) }}>
              <CollapsibleSection
                title="What to do if..."
                open={sectionsOpen.support}
                onToggle={() =>
                  setSectionsOpen((prev) => ({ ...prev, support: !prev.support }))
                }
              >
                {supportShortcuts.length > 0 ? (
                  <View>
                    <Text
                      style={[
                        theme.typography.textVariants.caption,
                        { color: theme.colors.textMuted }
                      ]}
                    >
                      Jump to a support card
                    </Text>
                    <View style={stylesModal.supportChipRow}>
                      {supportShortcuts.map((topic) => (
                        <Pressable
                          key={`${lesson.id}-${topic.id}`}
                          style={[
                            stylesModal.supportChip,
                            {
                              borderColor: theme.colors.border,
                              backgroundColor: theme.colors.card
                            }
                          ]}
                          onPress={() => onOpenSupportTopic(topic.id)}
                          accessibilityRole="button"
                        >
                          <Text
                            style={[
                              stylesModal.supportChipText,
                              { color: theme.colors.primary }
                            ]}
                          >
                            {topic.title}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                ) : null}

                {lesson.supportGuidelines && lesson.supportGuidelines.length > 0
                  ? lesson.supportGuidelines.map((guideline, index) => (
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
                    ))
                  : null}
              </CollapsibleSection>
            </View>
          ) : null}

          {lesson.safetyNotes ? (
            <View style={{ marginTop: theme.spacing(2) }}>
              <CollapsibleSection
                title="Safety"
                open={sectionsOpen.safety}
                onToggle={() =>
                  setSectionsOpen((prev) => ({ ...prev, safety: !prev.safety }))
                }
              >
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
              </CollapsibleSection>
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
              Drop quick reminders for today. Autosaves after a pause.
            </Text>
            <View style={stylesModal.noteStatusRow}>{renderNoteStatus()}</View>
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

type CollapsibleSectionProps = {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
};

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  open,
  onToggle,
  children
}) => {
  const theme = useTheme();
  return (
    <View>
      <Pressable
        accessibilityRole="button"
        onPress={onToggle}
        style={[
          stylesModal.collapsibleHeader,
          {
            paddingVertical: theme.spacing(0.75)
          }
        ]}
      >
        <SectionTitle title={title} />
        <Feather
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color={theme.colors.textSecondary}
        />
      </Pressable>
      {open ? <View style={{ marginTop: theme.spacing(0.5) }}>{children}</View> : null}
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
  supportChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8
  },
  supportChip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginTop: 8
  },
  supportChipText: {
    fontWeight: "600"
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
  },
  noteStatusRow: {
    minHeight: 18,
    justifyContent: "flex-end",
    flexDirection: "row",
    marginTop: 4
  },
  collapsibleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  }
});
