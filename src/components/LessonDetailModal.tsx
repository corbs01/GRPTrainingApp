import React from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "@theme/index";
import { LessonDetail, getSupportItemById } from "@data/index";
import { useLessonStepChecklist } from "@lib/dailySteps";

export type NoteSaveStatus = "idle" | "debouncing" | "saving" | "saved" | "error";

export type LessonDetailModalProps = {
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

export const LessonDetailModal: React.FC<LessonDetailModalProps> = ({
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
  const [sectionsOpen, setSectionsOpen] = React.useState({ support: false, safety: false });

  React.useEffect(() => {
    setSectionsOpen({ support: false, safety: false });
  }, [lesson?.id]);

  if (!lesson || !visible) {
    return null;
  }

  const steps = lesson.steps ?? [];
  const { completed, toggleStep } = useLessonStepChecklist(lesson.id, steps.length);
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
        return { id: topicId, title: lookup.item.title };
      })
      .filter((entry): entry is { id: string; title: string } => Boolean(entry));
  }, [lesson.supportTopics]);

  const renderNoteStatus = () => {
    switch (noteStatus) {
      case "saving":
      case "debouncing":
        return (
          <Text style={[theme.typography.textVariants.caption, { color: theme.colors.textSecondary }]}>Saving…</Text>
        );
      case "saved":
        return (
          <Text style={[theme.typography.textVariants.caption, { color: theme.colors.success }]}>Saved ✓</Text>
        );
      case "error":
        return (
          <Pressable onPress={onRetrySave}>
            <Text style={[theme.typography.textVariants.caption, { color: theme.colors.error }]}>Didn&apos;t save. Tap to retry.</Text>
          </Pressable>
        );
      default:
        return null;
    }
  };

  const content = (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          paddingTop: Platform.OS === "android" ? theme.spacing(3) : theme.spacing(2)
        }
      ]}
    >
      <View style={[styles.header, { paddingHorizontal: theme.spacing(1.5) }]}> 
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close lesson details"
          hitSlop={12}
          onPress={onClose}
          style={[
            styles.iconButton,
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
            styles.practiceButton,
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
        <Text style={[theme.typography.textVariants.title, { color: theme.colors.textPrimary }]}>{lesson.title}</Text>
        {lesson.objective ? (
          <Text
            style={[
              theme.typography.textVariants.body,
              { color: theme.colors.textSecondary, marginTop: theme.spacing(0.75) }
            ]}
          >
            {lesson.objective}
          </Text>
        ) : null}

        <View style={{ marginTop: theme.spacing(1.5) }}>
          {lesson.duration ? <InfoRow icon="clock" label="Time" value={lesson.duration} /> : null}
          {lesson.materials && lesson.materials.length > 0 ? (
            <InfoRow
              icon="package"
              label="Materials"
              value={lesson.materials.join(", ")}
              containerStyle={{ marginTop: theme.spacing(0.75) }}
            />
          ) : null}
        </View>

        {steps.length > 0 ? (
          <View style={{ marginTop: theme.spacing(2) }}>
            <SectionTitle title="Steps" />
            <View style={{ marginTop: theme.spacing(1) }}>
              {steps.map((step, index) => (
                <Pressable key={`${lesson.id}-step-${index}`} onPress={() => toggleStep(index)} style={{ marginBottom: theme.spacing(1) }}>
                  <View style={styles.stepRow}>
                    <View
                      style={[
                        styles.stepBadge,
                        {
                          borderRadius: theme.radius.lg,
                          borderColor: theme.colors.border,
                          backgroundColor: completed[index]
                            ? theme.colors.primarySoft
                            : theme.colors.surface
                        }
                      ]}
                    >
                      <Text
                        style={[
                          theme.typography.textVariants.caption,
                          {
                            color: completed[index]
                              ? theme.colors.primary
                              : theme.colors.textSecondary
                          }
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
                          marginLeft: theme.spacing(1),
                          flex: 1
                        }
                      ]}
                    >
                      {step}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {supportShortcuts.length > 0 ? (
          <View style={{ marginTop: theme.spacing(2) }}>
            <SectionTitle title="Support Boosters" />
            <View style={styles.supportChipRow}>
              {supportShortcuts.map((topic) => (
                <Pressable
                  key={`${lesson.id}-${topic.id}`}
                  style={[
                    styles.supportChip,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.surface
                    }
                  ]}
                  onPress={() => onOpenSupportTopic(topic.id)}
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
          </View>
        ) : null}

        {lesson.supportGuidelines && lesson.supportGuidelines.length > 0 ? (
          <View style={{ marginTop: theme.spacing(2) }}>
            <SectionTitle title="Coach Cues" />
            <View style={{ marginTop: theme.spacing(1) }}>
              {lesson.supportGuidelines.map((guideline, index) => (
                <View key={`${lesson.id}-guideline-${index}`} style={[styles.bulletRow, { marginBottom: theme.spacing(0.75) }]}> 
                  <View style={[styles.bullet, { backgroundColor: theme.colors.primary }]} />
                  <Text
                    style={[
                      theme.typography.textVariants.body,
                      {
                        color: theme.colors.textSecondary,
                        marginLeft: theme.spacing(1),
                        flex: 1
                      }
                    ]}
                  >
                    {guideline}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {lesson.safetyNotes ? (
          <View style={{ marginTop: theme.spacing(2) }}>
            <CollapsibleSection
              title="Safety notes"
              open={sectionsOpen.safety}
              onToggle={() =>
                setSectionsOpen((prev) => ({
                  ...prev,
                  safety: !prev.safety
                }))
              }
            >
              <Text style={[theme.typography.textVariants.body, { color: theme.colors.textSecondary }]}>
                {lesson.safetyNotes}
              </Text>
            </CollapsibleSection>
          </View>
        ) : null}

        <View style={{ marginTop: theme.spacing(2.5) }}>
          <SectionTitle title="Notes" />
          <Text style={[theme.typography.textVariants.caption, { color: theme.colors.textMuted, marginTop: theme.spacing(0.5) }]}>
            Drop quick reminders for today. Autosaves after a pause.
          </Text>
          <View style={styles.noteStatusRow}>{renderNoteStatus()}</View>
          <TextInput
            multiline
            placeholder="Add your notes..."
            placeholderTextColor={theme.colors.textMuted}
            value={notes}
            onChangeText={onChangeNotes}
            style={[
              styles.notesInput,
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
  );

  if (Platform.OS === "web") {
    return (
      <View
        style={[
          StyleSheet.absoluteFillObject,
          styles.webOverlay,
          { backgroundColor: "rgba(0,0,0,0.35)" }
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[
            styles.webSheet,
            {
              backgroundColor: theme.colors.background,
              borderTopLeftRadius: theme.radius.xl,
              borderTopRightRadius: theme.radius.xl,
              overflow: "hidden"
            }
          ]}
        >
          {content}
        </View>
      </View>
    );
  }

  return (
    <Modal
      animationType="slide"
      presentationStyle="pageSheet"
      visible={visible}
      onRequestClose={onClose}
    >
      {content}
    </Modal>
  );
};

const SectionTitle: React.FC<{ title: string }> = ({ title }) => {
  const theme = useTheme();
  return (
    <Text
      style={[
        theme.typography.textVariants.caption,
        {
          color: theme.colors.textSecondary,
          textTransform: "uppercase",
          letterSpacing: 0.8
        }
      ]}
    >
      {title}
    </Text>
  );
};

const InfoRow: React.FC<{
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  containerStyle?: StyleProp<ViewStyle>;
}> = ({ icon, label, value, containerStyle }) => {
  const theme = useTheme();
  return (
    <View style={[styles.infoRow, containerStyle]}> 
      <View style={[styles.iconBadge, { borderColor: theme.colors.border }]}>
        <Feather name={icon} size={14} color={theme.colors.primary} />
      </View>
      <View style={{ marginLeft: theme.spacing(1) }}>
        <Text style={[theme.typography.textVariants.caption, { color: theme.colors.textSecondary }]}>{label}</Text>
        <Text style={[theme.typography.textVariants.body, { color: theme.colors.textPrimary, marginTop: 2 }]}>
          {value}
        </Text>
      </View>
    </View>
  );
};

const CollapsibleSection: React.FC<{
  title: string;
  open: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}> = ({ title, open, onToggle, children }) => {
  const theme = useTheme();
  return (
    <View>
      <Pressable onPress={onToggle} style={[styles.collapsibleHeader, { paddingVertical: theme.spacing(0.5) }]}>
        <Text style={[theme.typography.textVariants.bodyStrong, { color: theme.colors.textPrimary }]}>
          {title}
        </Text>
        <Feather name={open ? "chevron-up" : "chevron-down"} size={18} color={theme.colors.textSecondary} />
      </Pressable>
      {open ? <View style={{ marginTop: theme.spacing(0.75) }}>{children}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
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
  iconBadge: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999
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
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4
  },
  collapsibleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  webOverlay: {
    justifyContent: "flex-end",
    zIndex: 10
  },
  webSheet: {
    width: "100%",
    maxWidth: 640,
    maxHeight: "100%",
    alignSelf: "center"
  }
});
