import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from "react-native-reanimated";
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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const DailyPlanCard: React.FC<DailyPlanCardProps> = ({ lesson, onToggle, onQuickAdd }) => {
  const theme = useTheme();
  const categories = React.useMemo(() => getLessonCategories(lesson.id), [lesson.id]);
  const [isPending, setIsPending] = React.useState(false);
  const { practicedToday, toggle } = usePractice(lesson.id);
  const practiceProgress = useSharedValue(practicedToday ? 1 : 0);
  const liftProgress = useSharedValue(0);
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

  React.useEffect(() => {
    practiceProgress.value = withTiming(practicedToday ? 1 : 0, {
      duration: practicedToday ? 220 : 160,
      easing: Easing.out(Easing.cubic)
    });
  }, [practiceProgress, practicedToday]);

  const circleSize = theme.spacing(3);
  const pillSpacing = theme.spacing(0.5);
  const liftOffset = theme.spacingTokens.xs;

  const cardStyle = useAnimatedStyle(() => {
    const background = interpolateColor(
      practiceProgress.value,
      [0, 1],
      [theme.colors.surface, theme.colors.primarySoft]
    );
    const border = interpolateColor(
      practiceProgress.value,
      [0, 1],
      [theme.colors.border, theme.colors.primary]
    );

    return {
      backgroundColor: background,
      borderColor: border,
      transform: [
        { translateY: -liftOffset * liftProgress.value },
        { scale: 1 + liftProgress.value * 0.02 }
      ],
      elevation: theme.shadow.soft.elevation * liftProgress.value,
      shadowColor: theme.shadow.soft.shadowColor,
      shadowOpacity: theme.shadow.soft.shadowOpacity * liftProgress.value,
      shadowRadius: theme.shadow.soft.shadowRadius * liftProgress.value,
      shadowOffset: {
        width: theme.shadow.soft.shadowOffset.width * liftProgress.value,
        height: theme.shadow.soft.shadowOffset.height * liftProgress.value
      }
    };
  });

  const checkCircleStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      practiceProgress.value,
      [0, 1],
      [theme.colors.border, theme.colors.primary]
    ),
    backgroundColor: interpolateColor(
      practiceProgress.value,
      [0, 1],
      ["transparent", theme.colors.primary]
    ),
    transform: [
      {
        scale: 0.92 + practiceProgress.value * 0.12
      }
    ]
  }));

  const checkBloomStyle = useAnimatedStyle(() => ({
    opacity: practiceProgress.value * 0.4,
    transform: [
      {
        scale: 1 + practiceProgress.value * 0.45
      }
    ]
  }));

  const checkIconStyle = useAnimatedStyle(() => ({
    opacity: practiceProgress.value,
    transform: [
      {
        scale: 0.85 + practiceProgress.value * 0.15
      }
    ]
  }));

  const handlePressIn = React.useCallback(() => {
    liftProgress.value = withTiming(1, {
      duration: 140,
      easing: Easing.out(Easing.quad)
    });
  }, [liftProgress]);

  const handlePressOut = React.useCallback(() => {
    liftProgress.value = withTiming(0, {
      duration: 220,
      easing: Easing.out(Easing.cubic)
    });
  }, [liftProgress]);

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ checked: practicedToday, busy: isPending }}
      accessibilityLabel={`Mark ${lesson.title} as practiced`}
      onPress={handleToggle}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onTouchCancel={handlePressOut}
      style={[
        styles.card,
        {
          borderRadius: theme.radius.md
        },
        cardStyle,
        isPending && { opacity: 0.85 }
      ]}
    >
      <View style={styles.row}>
        <View style={styles.checkWrapper}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.checkBloom,
              {
                borderRadius: circleSize,
                backgroundColor: theme.colors.primarySoft
              },
              checkBloomStyle
            ]}
          />
          <Animated.View
            style={[
              styles.checkCircle,
              {
                borderRadius: circleSize / 2,
                width: circleSize,
                height: circleSize
              },
              checkCircleStyle
            ]}
          >
            <Animated.View style={checkIconStyle}>
              <Feather name="check" size={16} color={theme.colors.onPrimary} />
            </Animated.View>
          </Animated.View>
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
    </AnimatedPressable>
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
  checkWrapper: {
    alignItems: "center",
    justifyContent: "center"
  },
  checkCircle: {
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center"
  },
  checkBloom: {
    ...StyleSheet.absoluteFillObject
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
