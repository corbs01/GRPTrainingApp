import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  FadeInDown,
  interpolateColor,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";

import { LessonSummary, LessonCategory, getLessonCategories } from "@data/index";
import { useTheme } from "@theme/index";
import type { AppTheme } from "@theme/theme";
import { usePractice } from "@lib/practiceLog";

const CARD_HEIGHT = 140;
const CARD_SPACING = 16;
const ITEM_HEIGHT = CARD_HEIGHT + CARD_SPACING;

type Positions = Record<string, number>;

type DailyPlanBoardProps = {
  lessons: LessonSummary[];
  onLessonPress: (lesson: LessonSummary) => void;
  onLessonOrderChange: (lessonIds: string[]) => void;
  onLessonToggle: (lessonId: string) => void;
};

const createPositions = (lessons: LessonSummary[]): Positions =>
  lessons.reduce<Positions>((acc, lesson, index) => {
    acc[lesson.id] = index;
    return acc;
  }, {});

const clamp = (value: number, lower: number, upper: number) =>
  Math.min(Math.max(value, lower), upper);

const reorderPositions = (positions: Positions, movingId: string, to: number): Positions => {
  const from = positions[movingId];
  if (from === undefined || from === to) {
    return positions;
  }

  const next: Positions = { ...positions };
  Object.keys(next).forEach((id) => {
    if (id === movingId) {
      return;
    }
    const value = next[id];
    if (value === undefined) {
      return;
    }
    if (from < to && value > from && value <= to) {
      next[id] = value - 1;
    } else if (from > to && value < from && value >= to) {
      next[id] = value + 1;
    }
  });

  next[movingId] = to;
  return next;
};

const orderedIdsFromPositions = (positions: Positions) =>
  Object.keys(positions).sort((a, b) => positions[a] - positions[b]);

export const DailyPlanBoard: React.FC<DailyPlanBoardProps> = ({
  lessons,
  onLessonPress,
  onLessonOrderChange,
  onLessonToggle
}) => {
  const positions = useSharedValue<Positions>(createPositions(lessons));
  const draggingId = useSharedValue<string | null>(null);
  const [activeDragId, setActiveDragId] = React.useState<string | null>(null);
  const signature = React.useMemo(() => lessons.map((lesson) => lesson.id).join("|"), [lessons]);

  React.useEffect(() => {
    positions.value = createPositions(lessons);
  }, [signature, lessons, positions]);

  if (lessons.length === 0) {
    return null;
  }

  const containerHeight = Math.max(
    CARD_HEIGHT,
    lessons.length * ITEM_HEIGHT - CARD_SPACING
  );

  return (
    <View style={{ height: containerHeight, position: "relative" }}>
      {lessons.map((lesson) => (
        <SortablePlanCard
          key={lesson.id}
          lesson={lesson}
          positions={positions}
          draggingId={draggingId}
          count={lessons.length}
          onLessonPress={onLessonPress}
          onLessonToggle={onLessonToggle}
          onLessonOrderChange={onLessonOrderChange}
          activeDragId={activeDragId}
          setActiveDragId={setActiveDragId}
        />
      ))}
    </View>
  );
};

type SortablePlanCardProps = {
  lesson: LessonSummary;
  positions: Animated.SharedValue<Positions>;
  draggingId: Animated.SharedValue<string | null>;
  count: number;
  onLessonPress: (lesson: LessonSummary) => void;
  onLessonToggle: (lessonId: string) => void;
  onLessonOrderChange: (order: string[]) => void;
  activeDragId: string | null;
  setActiveDragId: (id: string | null) => void;
};

const SortablePlanCard: React.FC<SortablePlanCardProps> = ({
  lesson,
  positions,
  draggingId,
  count,
  onLessonPress,
  onLessonToggle,
  onLessonOrderChange,
  activeDragId,
  setActiveDragId
}) => {
  const theme = useTheme();
  const swipeRef = React.useRef<Swipeable | null>(null);
  const { practicedToday, toggle } = usePractice(lesson.id);
  const liftProgress = useSharedValue(0);
  const practiceProgress = useSharedValue(practicedToday ? 1 : 0);
  const offsetY = useSharedValue((positions.value[lesson.id] ?? 0) * ITEM_HEIGHT);
  const panContext = useSharedValue(offsetY.value);
  const categories = React.useMemo(() => getLessonCategories(lesson.id), [lesson.id]);

  React.useEffect(() => {
    practiceProgress.value = withTiming(practicedToday ? 1 : 0, { duration: 220 });
  }, [practiceProgress, practicedToday]);

  useAnimatedReaction(
    () => positions.value[lesson.id],
    (current) => {
      if (current == null) {
        return;
      }
      if (draggingId.value === lesson.id) {
        return;
      }
      offsetY.value = withSpring(current * ITEM_HEIGHT, {
        damping: 18,
        stiffness: 220
      });
    },
    [lesson.id]
  );

  const finishDrag = React.useCallback(
    (shouldCommit: boolean) => {
      if (shouldCommit) {
        const order = orderedIdsFromPositions(positions.value);
        onLessonOrderChange(order);
      }
      setActiveDragId(null);
    },
    [onLessonOrderChange, positions, setActiveDragId]
  );

  const longPressGesture = Gesture.LongPress()
    .minDuration(220)
    .onStart(() => {
      if (draggingId.value) {
        return;
      }
      draggingId.value = lesson.id;
      panContext.value = offsetY.value;
      runOnJS(setActiveDragId)(lesson.id);
    });

  const panGesture = Gesture.Pan()
    .onStart(() => {
      if (draggingId.value !== lesson.id) {
        return;
      }
      panContext.value = offsetY.value;
      liftProgress.value = withTiming(1, { duration: 160 });
    })
    .onChange((event) => {
      if (draggingId.value !== lesson.id) {
        return;
      }
      const upperBound = ITEM_HEIGHT * (count - 1);
      const nextOffset = clamp(panContext.value + event.translationY, 0, upperBound);
      offsetY.value = nextOffset;
      const nextOrder = clamp(Math.round(nextOffset / ITEM_HEIGHT), 0, count - 1);
      if (nextOrder !== positions.value[lesson.id]) {
        positions.value = reorderPositions(positions.value, lesson.id, nextOrder);
      }
    })
    .onEnd(() => {
      if (draggingId.value !== lesson.id) {
        return;
      }
      offsetY.value = withSpring((positions.value[lesson.id] ?? 0) * ITEM_HEIGHT, {
        damping: 20,
        stiffness: 260
      });
      draggingId.value = null;
      liftProgress.value = withTiming(0, { duration: 180 });
      runOnJS(finishDrag)(true);
    })
    .onFinalize(() => {
      if (draggingId.value === lesson.id) {
        draggingId.value = null;
        liftProgress.value = withTiming(0, { duration: 180 });
        runOnJS(finishDrag)(false);
      }
    });

  const composedGesture = Gesture.Simultaneous(longPressGesture, panGesture);

  const cardPositionStyle = useAnimatedStyle(() => {
    const isDraggingSelf = draggingId.value === lesson.id;
    return {
      top: offsetY.value,
      zIndex: isDraggingSelf ? 10 : 1,
      transform: [
        {
          scale: withTiming(isDraggingSelf ? 1.015 : 1, { duration: 140 })
        }
      ]
    };
  });

  const cardBackgroundStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      practiceProgress.value,
      [0, 1],
      [theme.colors.card, theme.colors.primarySoft]
    ),
    borderColor: interpolateColor(
      practiceProgress.value,
      [0, 1],
      [theme.colors.border, theme.colors.primary]
    )
  }));

  const pressableStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: 1 - liftProgress.value * 0.015
      }
    ]
  }));

  const markPracticed = React.useCallback(() => {
    if (!practicedToday) {
      toggle();
      onLessonToggle(lesson.id);
    }
    swipeRef.current?.close();
  }, [lesson.id, onLessonToggle, practicedToday, toggle]);

  const renderSwipeAction = () => (
    <View
      style={[
        styles.swipeAction,
        {
          backgroundColor: theme.colors.success,
          borderRadius: theme.radius.lg
        }
      ]}
    >
      <Feather name="check" size={20} color={theme.colors.onPrimary} />
      <Text
        style={[
          theme.typography.textVariants.button,
          { color: theme.colors.onPrimary, marginLeft: theme.spacing(0.5) }
        ]}
      >
        Logged
      </Text>
    </View>
  );

  const swipeEnabled = activeDragId !== lesson.id;

  const categoryBadges = categories.slice(0, 2).map((category) => (
    <View
      key={`${lesson.id}-${category}`}
      style={[
        styles.categoryBadge,
        {
          backgroundColor: getCategoryBadgeColor(category, theme),
          borderRadius: theme.radius.pill
        }
      ]}
    >
      <Feather
        name={getCategoryIcon(category)}
        size={12}
        color={theme.colors.onPrimary}
      />
    </View>
  ));

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View
        entering={FadeInDown.springify().damping(20)}
        style={[styles.cardWrapper, cardPositionStyle]}
      >
        <Swipeable
          ref={swipeRef}
          friction={2}
          overshootLeft={false}
          overshootRight={false}
          renderLeftActions={renderSwipeAction}
          onSwipeableOpen={(direction) => {
            if (direction === "left") {
              markPracticed();
            }
          }}
          enabled={swipeEnabled}
        >
          <Animated.View
            style={[
              styles.card,
              {
                borderRadius: theme.radius.lg,
                borderWidth: StyleSheet.hairlineWidth,
                shadowColor: theme.shadow.soft.shadowColor,
                shadowOpacity:
                  activeDragId === lesson.id ? theme.shadow.soft.shadowOpacity : 0.08,
                shadowRadius: theme.shadow.soft.shadowRadius,
                shadowOffset: theme.shadow.soft.shadowOffset,
                elevation: activeDragId === lesson.id ? theme.shadow.soft.elevation : 1
              },
              cardBackgroundStyle
            ]}
          >
            <Animated.View style={pressableStyle}>
              <Pressable onPress={() => onLessonPress(lesson)}>
                <View style={styles.cardHeader}>
                  <View style={styles.titleColumn}>
                    <Text
                      style={[
                        theme.typography.textVariants.title,
                        { color: theme.colors.textPrimary }
                      ]}
                      numberOfLines={1}
                    >
                      {lesson.title}
                    </Text>
                    <Text
                      style={[
                        theme.typography.textVariants.body,
                        {
                          color: theme.colors.textSecondary,
                          marginTop: theme.spacing(0.5)
                        }
                      ]}
                      numberOfLines={2}
                    >
                      {lesson.objective}
                    </Text>
                  </View>
                  <View style={styles.categoryColumn}>{categoryBadges}</View>
                </View>

                <View style={styles.cardFooter}>
                  <View style={styles.footerLeft}>
                    <View
                      style={[
                        styles.practicePill,
                        {
                          borderColor: theme.colors.primary,
                          backgroundColor: practicedToday
                            ? theme.colors.primary
                            : theme.colors.surface
                        }
                      ]}
                    >
                      <Feather
                        name="check"
                        size={12}
                        color={practicedToday ? theme.colors.onPrimary : theme.colors.primary}
                      />
                      <Text
                        style={[
                          theme.typography.textVariants.label,
                          {
                            color: practicedToday
                              ? theme.colors.onPrimary
                              : theme.colors.primary,
                            marginLeft: theme.spacing(0.25)
                          }
                        ]}
                      >
                        {practicedToday ? "Practiced" : "Swipe to log"}
                      </Text>
                    </View>
                    <Text
                      style={[
                        theme.typography.textVariants.caption,
                        { color: theme.colors.textMuted, marginLeft: theme.spacing(0.75) }
                      ]}
                    >
                      {lesson.duration}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={theme.colors.textSecondary} />
                </View>
              </Pressable>
            </Animated.View>
          </Animated.View>
        </Swipeable>
      </Animated.View>
    </GestureDetector>
  );
};

const badgeColorMap: Record<LessonCategory, string> = {
  foundation: "#C7D7C1",
  lifeManners: "#C7DDEE",
  socialization: "#F4DDE1"
};

const badgeIconMap: Record<LessonCategory, keyof typeof Feather.glyphMap> = {
  foundation: "activity",
  lifeManners: "wind",
  socialization: "users"
};

const getCategoryBadgeColor = (category: LessonCategory, theme: AppTheme) => {
  return badgeColorMap[category] ?? theme.colors.primarySoft;
};

const getCategoryIcon = (category: LessonCategory) => badgeIconMap[category] ?? "sun";

const styles = StyleSheet.create({
  cardWrapper: {
    position: "absolute",
    left: 0,
    right: 0
  },
  card: {
    padding: 16
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start"
  },
  titleColumn: {
    flex: 1,
    paddingRight: 12
  },
  categoryColumn: {
    flexDirection: "row",
    alignItems: "center"
  },
  categoryBadge: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16
  },
  footerLeft: {
    flexDirection: "row",
    alignItems: "center"
  },
  practicePill: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999
  },
  swipeAction: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20
  }
});
