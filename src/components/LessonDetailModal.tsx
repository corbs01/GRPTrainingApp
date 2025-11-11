import React from "react";
import {
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TextInput,
  View,
  ViewStyle
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";

import { Illustration } from "@components/Illustration";
import { useTheme } from "@theme/index";
import type { AppTheme } from "@theme/theme";
import { LessonDetail, getLessonDetailById, getSupportItemById } from "@data/index";
import { getLessonIllustrationKey } from "@data/illustrations";
import { useLessonStepChecklist } from "@lib/dailySteps";

export type NoteSaveStatus = "idle" | "debouncing" | "saving" | "saved" | "error";

const SPRING_CONFIG = {
  stiffness: 230,
  damping: 28,
  mass: 0.8
} as const;

const AnimatedView = Animated.createAnimatedComponent(View);

type SupportShortcut = { id: string; title: string };

export type LessonDetailModalProps = {
  visible: boolean;
  lessonId?: string | null;
  practiced: boolean;
  notes: string;
  noteStatus: NoteSaveStatus;
  onClose: () => void;
  onTogglePractice: () => void;
  onChangeNotes: (text: string) => void;
  onRetrySave: () => void;
  onOpenSupportTopic: (supportId: string) => void;
  onAddPhoto?: (lessonId: string) => void;
};

export const LessonDetailModal: React.FC<LessonDetailModalProps> = ({
  visible,
  lessonId,
  practiced,
  notes,
  noteStatus,
  onClose,
  onTogglePractice,
  onChangeNotes,
  onRetrySave,
  onOpenSupportTopic,
  onAddPhoto
}) => {
  const theme = useTheme();
  const windowHeight = Dimensions.get("window").height;
  const hiddenTranslateY = windowHeight * 0.85;
  const [modalVisible, setModalVisible] = React.useState(visible);
  const sheetTranslateY = useSharedValue(hiddenTranslateY);
  const backdropOpacity = useSharedValue(0);
  const [whatIfOpen, setWhatIfOpen] = React.useState(false);
  const noteInputRef = React.useRef<TextInput | null>(null);

  const lesson: LessonDetail | undefined = React.useMemo(
    () => (lessonId ? getLessonDetailById(lessonId) : undefined),
    [lessonId]
  );
  const steps = lesson?.steps ?? [];
  const checklist = useLessonStepChecklist(lesson?.id ?? "__lesson-detail__", steps.length);
  const illustrationKey = React.useMemo(
    () => (lesson ? getLessonIllustrationKey(lesson.id) : undefined),
    [lesson]
  );
  const supportShortcuts = React.useMemo<SupportShortcut[]>(() => {
    if (!lesson?.supportTopics?.length) {
      return [];
    }
    return lesson.supportTopics
      .map((topicId) => {
        const lookup = getSupportItemById(topicId);
        if (!lookup) {
          return null;
        }
        return { id: topicId, title: lookup.item.title };
      })
      .filter((entry): entry is SupportShortcut => Boolean(entry));
  }, [lesson?.supportTopics]);

  React.useEffect(() => {
    if (visible) {
      setModalVisible(true);
      sheetTranslateY.value = hiddenTranslateY;
      backdropOpacity.value = 0;
      requestAnimationFrame(() => {
        backdropOpacity.value = withTiming(1, { duration: 180 });
        sheetTranslateY.value = withSpring(0, SPRING_CONFIG);
      });
    } else if (modalVisible) {
      backdropOpacity.value = withTiming(0, { duration: 160 });
      sheetTranslateY.value = withTiming(hiddenTranslateY, { duration: 220 }, () => {
        runOnJS(setModalVisible)(false);
      });
    }
  }, [backdropOpacity, hiddenTranslateY, modalVisible, sheetTranslateY, visible]);

  React.useEffect(() => {
    setWhatIfOpen(false);
  }, [lessonId]);

  const dismiss = React.useCallback(() => {
    if (visible) {
      onClose();
      return;
    }
    // Already closing; ignore duplicate presses.
  }, [onClose, visible]);

  const dragThreshold = Math.min(windowHeight * 0.2, 240);
  const sheetGesture = React.useMemo(
    () =>
      Gesture.Pan()
        .onUpdate((event) => {
          if (event.translationY > 0) {
            sheetTranslateY.value = event.translationY;
            backdropOpacity.value = Math.max(
              0,
              1 - Math.min(event.translationY / hiddenTranslateY, 1) * 0.6
            );
          }
        })
        .onEnd((event) => {
          const shouldClose = event.translationY > dragThreshold || event.velocityY > 1400;
          if (shouldClose) {
            runOnJS(onClose)();
            return;
          }
          sheetTranslateY.value = withSpring(0, SPRING_CONFIG);
          backdropOpacity.value = withTiming(1, { duration: 120 });
        }),
    [backdropOpacity, dragThreshold, hiddenTranslateY, onClose, sheetTranslateY]
  );

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }]
  }));

  if (!modalVisible) {
    return null;
  }

  const renderNoteStatus = () => {
    const noteMeta = getNoteMetaStyles(theme);
    switch (noteStatus) {
      case "saving":
      case "debouncing":
        return (
          <Text style={[theme.typography.textVariants.caption, noteMeta.saving]}>
            Saving…
          </Text>
        );
      case "saved":
        return (
          <Text style={[theme.typography.textVariants.caption, noteMeta.saved]}>
            Saved ✓
          </Text>
        );
      case "error":
        return (
          <Pressable onPress={onRetrySave}>
            <Text style={[theme.typography.textVariants.caption, noteMeta.error]}>
              Didn&apos;t save. Tap to retry.
            </Text>
          </Pressable>
        );
      default:
        return null;
    }
  };

  const hasSupportContent =
    (lesson?.supportGuidelines?.length ?? 0) > 0 || supportShortcuts.length > 0;

  const sheetContent = (
    <GestureDetector gesture={sheetGesture}>
      <AnimatedView
        style={[
          styles.sheet,
          {
            backgroundColor: theme.colors.surface,
            borderTopLeftRadius: theme.radius.xl,
            borderTopRightRadius: theme.radius.xl
          },
          sheetStyle
        ]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardAvoider}
        >
          <View style={styles.sheetHandle}>
            <View
              style={[
                styles.handleBar,
                { backgroundColor: theme.colors.border, opacity: theme.mode === "dark" ? 0.8 : 1 }
              ]}
            />
          </View>
          <ScrollView
            bounces={false}
            contentContainerStyle={{
              paddingBottom: theme.spacing(4),
              paddingHorizontal: theme.spacing(2)
            }}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headerRow}>
              <View style={[styles.iconCircle, { backgroundColor: theme.palette.softMist }]}>
                {illustrationKey ? (
                  <Illustration name={illustrationKey} size={theme.spacing(4)} />
                ) : (
                  <Text
                    style={[
                      theme.typography.textVariants.title,
                      { color: theme.colors.textPrimary }
                    ]}
                  >
                    🐾
                  </Text>
                )}
              </View>
              <View style={styles.headerText}>
                <Text
                  style={[
                    theme.typography.textVariants.caption,
                    { color: theme.colors.textSecondary, textTransform: "uppercase", letterSpacing: 1 }
                  ]}
                >
                  Trainer sheet
                </Text>
                <Text
                  numberOfLines={2}
                  style={[
                    theme.typography.textVariants.title,
                    { color: theme.colors.textPrimary, marginTop: theme.spacing(0.25) }
                  ]}
                >
                  {lesson?.title ?? "Lesson details"}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Toggle practiced"
                style={[
                  styles.practiceButton,
                  {
                    borderRadius: theme.radius.pill,
                    backgroundColor: practiced ? theme.colors.primary : theme.colors.surface,
                    borderColor: practiced ? theme.colors.primary : theme.colors.border
                  }
                ]}
                onPress={onTogglePractice}
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

            <SectionCard theme={theme}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close lesson details"
                hitSlop={8}
                onPress={dismiss}
                style={[
                  styles.closeButton,
                  {
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surface
                  }
                ]}
              >
                <Feather name="x" size={18} color={theme.colors.textPrimary} />
              </Pressable>
              {lesson?.objective ? (
                <>
                  <Text style={[sectionHeadingStyle(theme), { marginBottom: theme.spacing(0.5) }]}>
                    Why this matters
                  </Text>
                  <Text
                    style={[
                      theme.typography.textVariants.body,
                      { color: theme.colors.textSecondary }
                    ]}
                  >
                    {lesson.objective}
                  </Text>
                </>
              ) : (
                <Text
                  style={[
                    theme.typography.textVariants.body,
                    { color: theme.colors.textSecondary }
                  ]}
                >
                  Pop into this sheet whenever you need the micro plan for today&apos;s skill.
                </Text>
              )}
            </SectionCard>

            {(lesson?.duration || lesson?.materials?.length) && (
              <SectionCard theme={theme}>
                {lesson?.duration ? (
                  <InfoRow icon="clock" label="Duration" value={lesson.duration} />
                ) : null}
                {lesson?.materials?.length ? (
                  <View style={{ marginTop: theme.spacing(1) }}>
                    <Text style={sectionHeadingStyle(theme)}>Materials</Text>
                    <View style={{ marginTop: theme.spacing(0.5) }}>
                      {lesson.materials.map((item, index) => (
                        <View key={`${lesson.id}-material-${index}`} style={styles.materialRow}>
                          <View
                            style={[
                              styles.bulletDot,
                              { backgroundColor: theme.colors.primary }
                            ]}
                          />
                          <Text
                            style={[
                              theme.typography.textVariants.body,
                              { color: theme.colors.textPrimary, flex: 1 }
                            ]}
                          >
                            {item}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}
              </SectionCard>
            )}

            {steps.length > 0 ? (
              <SectionCard theme={theme}>
                <Text style={sectionHeadingStyle(theme)}>Steps</Text>
                <View style={{ marginTop: theme.spacing(1) }}>
                  {steps.map((step, index) => {
                    const completed = checklist.completed[index];
                    return (
                      <Pressable
                        key={`${lesson?.id}-step-${index}`}
                        style={styles.stepRow}
                        onPress={() => checklist.toggleStep(index)}
                      >
                        <View
                          style={[
                            styles.stepCheck,
                            {
                              borderColor: completed ? theme.colors.primary : theme.colors.border,
                              backgroundColor: completed ? theme.colors.primarySoft : "transparent"
                            }
                          ]}
                        >
                          <Feather
                            name={completed ? "check" : "circle"}
                            size={16}
                            color={completed ? theme.colors.primary : theme.colors.textMuted}
                          />
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
                          {index + 1}. {step}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </SectionCard>
            ) : null}

            {hasSupportContent ? (
              <SectionCard theme={theme}>
                <Pressable
                  style={styles.collapsibleHeader}
                  onPress={() => setWhatIfOpen((prev) => !prev)}
                >
                  <Text style={sectionHeadingStyle(theme)}>What to do if…</Text>
                  <Feather
                    name={whatIfOpen ? "chevron-up" : "chevron-down"}
                    size={18}
                    color={theme.colors.textSecondary}
                  />
                </Pressable>
                {whatIfOpen ? (
                  <View style={{ marginTop: theme.spacing(1) }}>
                    {lesson?.supportGuidelines?.map((guideline, index) => (
                      <Text
                        key={`${lesson?.id}-guideline-${index}`}
                        style={[
                          theme.typography.textVariants.body,
                          {
                            color: theme.colors.textSecondary,
                            marginBottom: theme.spacing(0.5)
                          }
                        ]}
                      >
                        • {guideline}
                      </Text>
                    ))}
                    {supportShortcuts.length ? (
                      <View style={styles.chipRow}>
                        {supportShortcuts.map((topic) => (
                          <Pressable
                            key={topic.id}
                            onPress={() => onOpenSupportTopic(topic.id)}
                            style={[
                              styles.chip,
                              {
                                borderColor: theme.colors.border,
                                backgroundColor: theme.colors.surface
                              }
                            ]}
                          >
                            <Text
                              style={[
                                theme.typography.textVariants.caption,
                                {
                                  color: theme.colors.textPrimary,
                                  textTransform: "uppercase",
                                  letterSpacing: 0.6
                                }
                              ]}
                            >
                              {topic.title}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </SectionCard>
            ) : null}

            {lesson?.safetyNotes ? (
              <View
                style={[
                  styles.safetyCard,
                  {
                    backgroundColor: theme.palette.blush,
                    borderColor: theme.palette.blush,
                    borderRadius: theme.radius.lg
                  }
                ]}
              >
                <View style={styles.safetyIcon}>
                  <Feather name="alert-triangle" size={18} color={theme.colors.error} />
                </View>
                <View style={{ flex: 1, marginLeft: theme.spacing(1) }}>
                  <Text
                    style={[
                      theme.typography.textVariants.caption,
                      { color: theme.colors.textPrimary, textTransform: "uppercase", letterSpacing: 0.8 }
                    ]}
                  >
                    Safety note
                  </Text>
                  <Text
                    style={[
                      theme.typography.textVariants.body,
                      { color: theme.colors.textPrimary, marginTop: theme.spacing(0.5) }
                    ]}
                  >
                    {lesson.safetyNotes}
                  </Text>
                </View>
              </View>
            ) : null}

            <SectionCard theme={theme}>
              <View style={styles.notesHeader}>
                <Text style={sectionHeadingStyle(theme)}>Session notes</Text>
                {renderNoteStatus()}
              </View>
              <Text
                style={[
                  theme.typography.textVariants.caption,
                  { color: theme.colors.textMuted, marginBottom: theme.spacing(0.5) }
                ]}
              >
                Jot quick wins or things to revisit. Autosaves after a breath.
              </Text>
              <TextInput
                ref={noteInputRef}
                editable={Boolean(lessonId)}
                multiline
                placeholder="Add your note..."
                placeholderTextColor={theme.colors.textMuted}
                value={notes}
                onChangeText={onChangeNotes}
                style={[
                  styles.notesInput,
                  {
                    borderColor: theme.colors.border,
                    borderRadius: theme.radius.md,
                    color: theme.colors.textPrimary,
                    backgroundColor: theme.colors.surface
                  }
                ]}
              />
            </SectionCard>

            <View style={styles.footerActions}>
              <InlineActionButton
                icon="edit-3"
                label="Add note"
                style={[styles.footerActionButton, { marginRight: 12 }]}
                onPress={() => noteInputRef.current?.focus()}
                disabled={!lessonId}
              />
              <InlineActionButton
                icon="image"
                label="Add photo"
                style={styles.footerActionButton}
                onPress={() => {
                  if (lessonId) {
                    onAddPhoto?.(lessonId);
                  }
                }}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </AnimatedView>
    </GestureDetector>
  );

  const overlayTint = theme.mode === "dark" ? "rgba(6, 8, 12, 0.55)" : "rgba(13, 18, 23, 0.38)";

  const content = (
    <View style={styles.portalContainer}>
      <AnimatedView
        style={[
          StyleSheet.absoluteFillObject,
          styles.backdrop,
          backdropStyle
        ]}
      >
        <BlurView
          intensity={theme.mode === "dark" ? 40 : 55}
          tint={theme.mode === "dark" ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: overlayTint }]} />
        <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
      </AnimatedView>
      {sheetContent}
    </View>
  );

  return (
    <Modal
      animationType="none"
      transparent
      statusBarTranslucent
      visible={modalVisible}
      onRequestClose={dismiss}
    >
      {content}
    </Modal>
  );
};

const InlineActionButton: React.FC<{
  icon: keyof typeof Feather.glyphMap;
  label: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}> = ({ icon, label, disabled, style, onPress }) => {
  const theme = useTheme();
  return (
    <Pressable
      style={[
        styles.inlineAction,
        {
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
          opacity: disabled ? 0.4 : 1
        },
        style
      ]}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
    >
      <Feather name={icon} size={16} color={theme.colors.textPrimary} />
      <Text
        style={[
          theme.typography.textVariants.button,
          { color: theme.colors.textPrimary, marginLeft: theme.spacing(0.5) }
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const InfoRow: React.FC<{
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
}> = ({ icon, label, value }) => {
  const theme = useTheme();
  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIcon, { borderColor: theme.colors.border }]}>
        <Feather name={icon} size={14} color={theme.colors.primary} />
      </View>
      <View style={{ marginLeft: theme.spacing(1) }}>
        <Text style={infoLabelStyle(theme)}>{label}</Text>
        <Text
          style={[
            theme.typography.textVariants.body,
            { color: theme.colors.textPrimary, marginTop: 2 }
          ]}
        >
          {value}
        </Text>
      </View>
    </View>
  );
};

const SectionCard: React.FC<{ children: React.ReactNode; theme: ReturnType<typeof useTheme> }> = ({
  children,
  theme
}) => (
  <View
    style={[
      styles.sectionCard,
      {
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.lg
      }
    ]}
  >
    {children}
  </View>
);

const styles = StyleSheet.create({
  portalContainer: {
    flex: 1,
    justifyContent: "flex-end"
  },
  keyboardAvoider: {
    flex: 1
  },
  sheet: {
    maxHeight: "92%"
  },
  sheetHandle: {
    alignItems: "center",
    paddingVertical: 12
  },
  handleBar: {
    width: 64,
    height: 5,
    borderRadius: 999
  },
  backdrop: {
    justifyContent: "flex-end"
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center"
  },
  headerText: {
    flex: 1,
    marginLeft: 16,
    marginRight: 8
  },
  practiceButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: StyleSheet.hairlineWidth
  },
  closeButton: {
    position: "absolute",
    right: 16,
    top: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth
  },
  sectionCard: {
    padding: 16,
    marginBottom: 16,
    borderWidth: StyleSheet.hairlineWidth
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center"
  },
  materialRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 10
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 8
  },
  stepCheck: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center"
  },
  collapsibleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    marginRight: 8,
    marginBottom: 8
  },
  safetyCard: {
    flexDirection: "row",
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 16
  },
  safetyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.4)"
  },
  notesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6
  },
  notesInput: {
    minHeight: 110,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
    textAlignVertical: "top"
  },
  footerActions: {
    flexDirection: "row",
    marginTop: 8
  },
  footerActionButton: {
    flex: 1
  },
  inlineAction: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth
  }
});

const sectionHeadingStyle = (theme: AppTheme): TextStyle => ({
  ...theme.typography.textVariants.caption,
  color: theme.colors.textSecondary,
  textTransform: "uppercase",
  letterSpacing: 0.9
});

const infoLabelStyle = (theme: AppTheme): TextStyle => ({
  ...theme.typography.textVariants.caption,
  color: theme.colors.textSecondary
});

const getNoteMetaStyles = (theme: AppTheme) => ({
  saving: { color: theme.colors.textSecondary },
  saved: { color: theme.colors.success },
  error: { color: theme.colors.error }
});
