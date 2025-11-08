import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Illustration } from "@components/Illustration";
import { getLessonIllustrationKey } from "@data/illustrations";
import { LessonCategory, LessonSummary, getLessonCategories } from "@data/index";
import { useTheme } from "@theme/index";
import { usePractice } from "@lib/practiceLog";

type DailyPlanCardProps = {
  lesson: LessonSummary;
  onToggle?: () => void | Promise<void>;
  onQuickAdd?: (lesson: LessonSummary) => void;
};

const CATEGORY_LABELS: Record<LessonCategory, string> = {
  foundation: "Foundation",
  lifeManners: "Life + Manners",
  socialization: "Socialization"
};

export const DailyPlanCard: React.FC<DailyPlanCardProps> = ({ lesson, onToggle, onQuickAdd }) => {
  const theme = useTheme();
  const categories = React.useMemo(() => getLessonCategories(lesson.id), [lesson.id]);
  const [isPending, setIsPending] = React.useState(false);
  const { practicedToday, toggle } = usePractice(lesson.id);
  const handleQuickAdd = React.useCallback(() => {
    onQuickAdd?.(lesson);
  }, [lesson, onQuickAdd]);

  const handleToggle = React.useCallback(() => {
    toggle();
    if (!onToggle) {
      return;
    }
    try {
      const maybePromise = onToggle();
      if (maybePromise && typeof (maybePromise as Promise<void>).then === "function") {
        setIsPending(true);
        (maybePromise as Promise<void>).finally(() => setIsPending(false));
      }
    } catch {
      setIsPending(false);
    }
  }, [onToggle, toggle]);

  const illustrationKey = React.useMemo(
    () => getLessonIllustrationKey(lesson.id),
    [lesson.id]
  );

  const circleSize = theme.spacing(3);
  const pillSpacing = theme.spacing(0.5);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ checked: practicedToday, busy: isPending }}
      accessibilityLabel={`Mark ${lesson.title} as practiced`}
      onPress={handleToggle}
      style={[
        styles.card,
        {
          borderRadius: theme.radius.md,
          borderColor: theme.colors.border,
          backgroundColor: practicedToday ? theme.colors.primarySoft : theme.colors.surface,
          opacity: isPending ? 0.8 : 1
        }
      ]}
    >
      <View style={styles.row}>
        <View
          style={[
            styles.checkCircle,
            {
              borderRadius: circleSize / 2,
              width: circleSize,
              height: circleSize,
              borderColor: practicedToday ? theme.colors.primary : theme.colors.border,
              backgroundColor: practicedToday ? theme.colors.primary : "transparent"
            }
          ]}
        >
          {practicedToday ? (
            <Feather name="check" size={16} color={theme.colors.onPrimary} />
          ) : null}
        </View>
        <View style={[styles.content, { marginLeft: theme.spacing(1) }]}>
          <View style={styles.titleRow}>
            <Text
              style={[
                theme.typography.textVariants.title,
                { color: theme.colors.textPrimary, flex: 1 }
              ]}
              numberOfLines={2}
            >
              {lesson.title}
            </Text>
            <View style={styles.titleActions}>
              {onQuickAdd ? (
                <Pressable
                  onPress={handleQuickAdd}
                  style={[
                    styles.quickAddButton,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.surface
                    }
                  ]}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel={`Add a journal entry for ${lesson.title}`}
                >
                  <Feather name="edit-3" size={14} color={theme.colors.primary} />
                </Pressable>
              ) : null}
              <Illustration
                name={illustrationKey}
                size={theme.spacing(5)}
                style={{ marginLeft: theme.spacing(1) }}
              />
            </View>
          </View>
          {lesson.objective ? (
            <Text
              style={[
                theme.typography.textVariants.body,
                { color: theme.colors.textSecondary, marginTop: theme.spacing(0.5) }
              ]}
              numberOfLines={2}
            >
              {lesson.objective}
            </Text>
          ) : null}
          <View style={[styles.metaRow, { marginTop: theme.spacing(0.75) }]}>
            {categories.map((category) => (
              <View
                key={`${lesson.id}-${category}`}
                style={[
                  styles.categoryPill,
                  {
                    borderRadius: theme.radius.pill,
                    backgroundColor: theme.palette.softMist,
                    paddingHorizontal: theme.spacing(0.75),
                    paddingVertical: theme.spacing(0.25),
                    marginRight: pillSpacing
                  }
                ]}
              >
                <Text
                  style={[
                    theme.typography.textVariants.caption,
                    { color: theme.colors.textMuted }
                  ]}
                >
                  {CATEGORY_LABELS[category]}
                </Text>
              </View>
            ))}
            {lesson.duration ? (
              <Text
                style={[
                  theme.typography.textVariants.caption,
                  { color: theme.colors.textMuted, marginLeft: categories.length > 0 ? pillSpacing : 0 }
                ]}
              >
                {lesson.duration}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 12
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start"
  },
  checkCircle: {
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center"
  },
  content: {
    flex: 1
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  titleActions: {
    flexDirection: "row",
    alignItems: "center"
  },
  quickAddButton: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    padding: 6,
    marginLeft: 8
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap"
  },
  categoryPill: {
    marginBottom: 4
  }
});
