import React from "react";
import {
  FlatList,
  ListRenderItem,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  View,
  useWindowDimensions
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ScreenContainer } from "@components/ScreenContainer";
import { Button } from "@components/Button";
import { Illustration } from "@components/Illustration";
import { useTheme } from "@theme/index";
import { RootStackParamList } from "@app/navigation/types";
import { getAllWeeks, getWeekLessonSummaries, WeekSummary } from "@data/index";
import { getWeekIllustrationKey } from "@data/illustrations";
import { IllustrationKey, ILLUSTRATION_FALLBACK } from "@lib/illustrations";
import { usePuppyStore } from "@state/puppyStore";

const MIN_WEEK = 8;
const MAX_WEEK = 52;

type TimelineOrientation = "horizontal" | "vertical";

type TimelineMilestone = {
  id: string | null;
  weekNumber: number;
  title: string;
  focus: string;
  skills: string[];
  illustrationKey: IllustrationKey;
  status: "available" | "placeholder";
};

const DUMMY_WEEK_DATA: Record<
  number,
  {
    title: string;
    focus: string;
    skills: string[];
    illustrationKey: IllustrationKey;
  }
> = {
  8: {
    title: "Welcome Home & Bonding",
    focus: "Get cozy, set routines, and build trust together.",
    skills: ["Name Game", "Crate Comfort", "Potty Rhythm"],
    illustrationKey: "homecoming"
  },
  9: {
    title: "First Cues & Alone Time",
    focus: "Layer in simple cues and practice gentle independence.",
    skills: ["Sit Foundations", "Hand Target", "Calm Alone Time"],
    illustrationKey: "sit"
  },
  10: {
    title: "Down & Leave-It Foundations",
    focus: "Introduce impulse control games and polite manners.",
    skills: ["Easy Down", "Leave-It Basics", "Calm Cat Intro"],
    illustrationKey: "leaveIt"
  },
  11: {
    title: "Recall & Confidence",
    focus: "Boost response to your call and crate confidence.",
    skills: ["Recall Party", "Trade Game", "Crate Love"],
    illustrationKey: "recall"
  },
  12: {
    title: "Leash & Calm Greetings",
    focus: "Introduce walking gear and polite social hellos.",
    skills: ["Harness Happy", "Indoor Leash Start", "Calm Greetings"],
    illustrationKey: "leash"
  }
};

const generateTimelineData = (weeks: WeekSummary[]): TimelineMilestone[] => {
  const knownWeeks = new Map<number, WeekSummary>();
  weeks.forEach((week) => {
    knownWeeks.set(week.number, week);
  });

  const milestones: TimelineMilestone[] = [];
  for (let weekNumber = MIN_WEEK; weekNumber <= MAX_WEEK; weekNumber += 1) {
    const definedWeek = knownWeeks.get(weekNumber);
    const dummyWeek = DUMMY_WEEK_DATA[weekNumber];

    const fallbackTitle = `Week ${weekNumber}`;
    const fallbackFocus = "Training roadmap coming soon.";
    const fallbackIllustration = ILLUSTRATION_FALLBACK;

    const lessonTitles =
      definedWeek?.id && !dummyWeek
        ? getWeekLessonSummaries(definedWeek.id).slice(0, 3).map((lesson) => lesson.title)
        : dummyWeek?.skills ?? [];

    const illustrationKey: IllustrationKey =
      definedWeek?.id
        ? getWeekIllustrationKey(definedWeek.id)
        : dummyWeek?.illustrationKey ?? fallbackIllustration;

    milestones.push({
      id: definedWeek?.id ?? null,
      weekNumber,
      title: dummyWeek?.title ?? definedWeek?.title ?? fallbackTitle,
      focus: dummyWeek?.focus ?? definedWeek?.focus ?? fallbackFocus,
      skills: lessonTitles.length > 0 ? lessonTitles : ["Details to be announced"],
      illustrationKey,
      status: definedWeek ? "available" : "placeholder"
    });
  }

  return milestones;
};

export const TimelineScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { width } = useWindowDimensions();
  const [orientation, setOrientation] = React.useState<TimelineOrientation>("horizontal");
  const [data] = React.useState<TimelineMilestone[]>(() => generateTimelineData(getAllWeeks()));
  const listRef = React.useRef<FlatList<TimelineMilestone>>(null);
  const cardThemeValues = React.useMemo(
    () => ({
      card: theme.colors.card,
      border: theme.colors.border,
      accent: theme.colors.accent,
      textPrimary: theme.colors.textPrimary,
      textSecondary: theme.colors.textSecondary,
      textMuted: theme.colors.textMuted,
      paletteSoft: theme.palette.softMist,
      radius: theme.radius.md,
      button: theme.typography.textVariants.button,
      body: theme.typography.textVariants.body,
      caption: theme.typography.textVariants.caption,
      title: theme.typography.textVariants.title
    }),
    [
      theme.colors.accent,
      theme.colors.border,
      theme.colors.card,
      theme.colors.textMuted,
      theme.colors.textPrimary,
      theme.colors.textSecondary,
      theme.palette.softMist,
      theme.radius.md,
      theme.typography.textVariants.body,
      theme.typography.textVariants.button,
      theme.typography.textVariants.caption,
      theme.typography.textVariants.title
    ]
  );

  const rawCurrentWeek = usePuppyStore((state) => state.getCurrentWeekNumber());
  const currentWeek = React.useMemo(() => {
    if (!rawCurrentWeek) {
      return MIN_WEEK;
    }
    if (rawCurrentWeek < MIN_WEEK) {
      return MIN_WEEK;
    }
    if (rawCurrentWeek > MAX_WEEK) {
      return MAX_WEEK;
    }
    return rawCurrentWeek;
  }, [rawCurrentWeek]);

  const cardGap = theme.spacing(1.5);
  const cardHeight = 260;
  const horizontalCardWidth = Math.min(width * 0.72, 360);
  const verticalCardWidth = width - theme.spacing(5);
  const itemLength = orientation === "horizontal" ? horizontalCardWidth : cardHeight;
  const snapInterval = itemLength + cardGap;

  const handleNavigate = React.useCallback(
    (milestone: TimelineMilestone) => {
      if (milestone.id) {
        navigation.navigate("Week", { weekId: milestone.id });
      }
    },
    [navigation]
  );

  const scrollToWeek = React.useCallback(
    (weekNumber: number, animated = true) => {
      const index = data.findIndex((item) => item.weekNumber === weekNumber);
      if (index < 0) {
        return;
      }
      requestAnimationFrame(() => {
        listRef.current?.scrollToIndex({
          index,
          animated,
          viewPosition: orientation === "horizontal" ? 0.5 : 0
        });
      });
    },
    [data, orientation]
  );

  React.useEffect(() => {
    scrollToWeek(currentWeek, false);
  }, [currentWeek, scrollToWeek]);

  const handleJumpToCurrent = React.useCallback(() => {
    scrollToWeek(currentWeek);
  }, [currentWeek, scrollToWeek]);

  const getItemLayout = React.useCallback(
    (_: unknown, index: number) => ({
      index,
      length: itemLength,
      offset: index * (itemLength + cardGap)
    }),
    [cardGap, itemLength]
  );

  const renderItem = React.useCallback<ListRenderItem<TimelineMilestone>>(
    ({ item }) => {
      const isCurrent = item.weekNumber === currentWeek;
      const isAvailable = item.status === "available" && Boolean(item.id);

      return (
        <TimelineMilestoneCard
          milestone={item}
          isCurrent={isCurrent}
          isAvailable={isAvailable}
          dimensions={{
            width: orientation === "horizontal" ? horizontalCardWidth : verticalCardWidth,
            height: cardHeight
          }}
          themeValues={cardThemeValues}
          onPress={() => handleNavigate(item)}
        />
      );
    },
    [
      cardHeight,
      currentWeek,
      handleNavigate,
      horizontalCardWidth,
      orientation,
      cardThemeValues,
      verticalCardWidth
    ]
  );

  const nextWeekPreview = React.useMemo(() => {
    const nextWeekNumber = Math.min(MAX_WEEK, currentWeek + 1);
    if (nextWeekNumber === currentWeek) {
      return null;
    }
    const preview = data.find((item) => item.weekNumber === nextWeekNumber);
    if (!preview) {
      return null;
    }
    const goals = preview.skills.slice(0, 3);
    if (goals.length === 0) {
      return null;
    }
    return { week: preview, goals };
  }, [currentWeek, data]);

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.header}>
        <Text
          style={[
            theme.typography.textVariants.heading,
            { color: theme.colors.textPrimary }
          ]}
        >
          Training Timeline
        </Text>
        <Text
          style={[
            theme.typography.textVariants.body,
            styles.subtitle,
            { color: theme.colors.textSecondary }
          ]}
        >
          Swipe through the training story, preview key skills, and jump directly into any week.
        </Text>
      </View>

      <View style={styles.toggleRow}>
        <Text
          style={[
            theme.typography.textVariants.caption,
            { color: theme.colors.textMuted }
          ]}
        >
          Storybook layout
        </Text>
        <View style={styles.toggleButtons}>
          <Pressable
            onPress={() => setOrientation("horizontal")}
            style={[
              styles.toggleButton,
              {
                backgroundColor:
                  orientation === "horizontal" ? theme.colors.primarySoft : theme.colors.surface,
                borderColor:
                  orientation === "horizontal" ? theme.colors.primary : theme.colors.border
              }
            ]}
          >
            <Text
              style={[
                theme.typography.textVariants.button,
                {
                  color:
                    orientation === "horizontal"
                      ? theme.colors.onPrimary
                      : theme.colors.textSecondary
                }
              ]}
            >
              Horizontal
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setOrientation("vertical")}
            style={[
              styles.toggleButton,
              {
                backgroundColor:
                  orientation === "vertical" ? theme.colors.primarySoft : theme.colors.surface,
                borderColor:
                  orientation === "vertical" ? theme.colors.primary : theme.colors.border
              }
            ]}
          >
            <Text
              style={[
                theme.typography.textVariants.button,
                {
                  color:
                    orientation === "vertical"
                      ? theme.colors.onPrimary
                      : theme.colors.textSecondary
                }
              ]}
            >
              Vertical
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={[styles.jumpRow, { paddingHorizontal: theme.spacing(2) }]}>
        <Button
          label="Jump to current week"
          variant="secondary"
          fullWidth
          onPress={handleJumpToCurrent}
        />
      </View>

      <FlatList
        ref={listRef}
        data={data}
        key={orientation}
        horizontal={orientation === "horizontal"}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() =>
          orientation === "horizontal" ? (
            <View style={{ width: cardGap }} />
          ) : (
            <View style={{ height: cardGap }} />
          )
        }
        snapToInterval={snapInterval}
        snapToAlignment="start"
        decelerationRate="fast"
        getItemLayout={getItemLayout}
        onScrollToIndexFailed={(info) => {
          requestAnimationFrame(() => {
            listRef.current?.scrollToOffset({
              offset: info.index * snapInterval,
              animated: true
            });
          });
        }}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingVertical: theme.spacing(3),
            paddingHorizontal: orientation === "horizontal" ? theme.spacing(1) : 0
          }
        ]}
        renderItem={renderItem}
        keyExtractor={(item) => `${item.weekNumber}`}
      />

      {nextWeekPreview && (
        <View
          style={[
            styles.previewContainer,
            {
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
              marginHorizontal: theme.spacing(2),
              marginBottom: theme.spacing(3)
            }
          ]}
        >
          <Text
            style={[
              theme.typography.textVariants.title,
              { color: theme.colors.textPrimary }
            ]}
          >
            Coming up next week
          </Text>
          <Text
            style={[
              theme.typography.textVariants.body,
              styles.previewSubtitle,
              { color: theme.colors.textSecondary }
            ]}
          >
            Week {nextWeekPreview.week.weekNumber} · {nextWeekPreview.week.title}
          </Text>

          <View style={styles.previewChipRow}>
            {nextWeekPreview.goals.map((goal) => (
              <View
                key={goal}
                style={[
                  styles.previewChip,
                  {
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.primarySoft
                  }
                ]}
              >
                <Text
                  style={[
                    theme.typography.textVariants.caption,
                    styles.previewChipTitle,
                    { color: theme.colors.textMuted }
                  ]}
                >
                  Focus peek
                </Text>
                <Text
                  style={[
                    theme.typography.textVariants.body,
                    styles.previewChipGoal,
                    { color: theme.colors.textPrimary }
                  ]}
                >
                  {goal}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScreenContainer>
  );
};

type TimelineCardThemeValues = {
  card: string;
  border: string;
  accent: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  paletteSoft: string;
  radius: number;
  button: TextStyle;
  body: TextStyle;
  caption: TextStyle;
  title: TextStyle;
};

type TimelineMilestoneCardProps = {
  milestone: TimelineMilestone;
  isCurrent: boolean;
  isAvailable: boolean;
  dimensions: { width: number; height: number };
  onPress: () => void;
  themeValues: TimelineCardThemeValues;
};

const AnimatedCardContainer = Animated.createAnimatedComponent(View);

const TimelineMilestoneCard: React.FC<TimelineMilestoneCardProps> = React.memo(
  ({ milestone, isCurrent, isAvailable, dimensions, onPress, themeValues }) => {
    const scale = useSharedValue(isCurrent ? 1 : 0.97);

    React.useEffect(() => {
      scale.value = withSpring(isCurrent ? 1 : 0.97, {
        damping: 18,
        stiffness: 240,
        mass: 0.85
      });
    }, [isCurrent, scale]);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }]
    }));

    const artSize = React.useMemo(
      () => Math.min(dimensions.width * 0.55, 140),
      [dimensions.width]
    );

    return (
      <AnimatedCardContainer
        style={[
          styles.cardContainer,
          {
            width: dimensions.width,
            height: dimensions.height
          },
          animatedStyle
        ]}
      >
        <Pressable
          onPress={onPress}
          disabled={!isAvailable}
          style={({ pressed }) => [
            styles.card,
            {
              borderColor: isCurrent ? themeValues.accent : themeValues.border,
              borderWidth: isCurrent ? 2 : StyleSheet.hairlineWidth,
              backgroundColor: themeValues.card,
              opacity: pressed ? 0.95 : 1
            },
            !isAvailable && styles.cardDisabled
          ]}
        >
          <View
            style={[
              styles.illustration,
              {
                backgroundColor: themeValues.paletteSoft,
                borderRadius: themeValues.radius
              }
            ]}
          >
            <Illustration
              name={milestone.illustrationKey}
              size={artSize}
              style={styles.illustrationImage}
            />
          </View>

          <Text
            style={[
              themeValues.caption,
              styles.weekLabel,
              { color: themeValues.textMuted }
            ]}
          >
            Week {milestone.weekNumber}
          </Text>
          <Text
            style={[
              themeValues.title,
              styles.cardTitle,
              { color: themeValues.textPrimary }
            ]}
          >
            {milestone.title}
          </Text>
          <Text
            style={[
              themeValues.body,
              styles.cardFocus,
              { color: themeValues.textSecondary }
            ]}
          >
            {milestone.focus}
          </Text>

          <View style={styles.skillsBlock}>
            <Text
              style={[
                themeValues.caption,
                styles.skillsHeading,
                { color: themeValues.textMuted }
              ]}
            >
              Key Skills Preview
            </Text>
            {milestone.skills.map((skill) => (
              <Text
                key={skill}
                style={[
                  themeValues.body,
                  styles.skillRow,
                  { color: themeValues.textPrimary }
                ]}
              >
                • {skill}
              </Text>
            ))}
          </View>

          <View style={styles.footerRow}>
            <Text
              style={[
                themeValues.button,
                {
                  color: isAvailable ? themeValues.accent : themeValues.textMuted
                }
              ]}
            >
              {isAvailable ? "Go to week" : "Coming soon"}
            </Text>
          </View>
        </Pressable>
      </AnimatedCardContainer>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24
  },
  subtitle: {
    marginTop: 8
  },
  jumpRow: {
    paddingTop: 16,
    paddingBottom: 12
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16
  },
  toggleButtons: {
    flexDirection: "row",
    gap: 8
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1
  },
  listContent: {
    paddingBottom: 24,
    paddingHorizontal: 20
  },
  cardContainer: {
    flexShrink: 0
  },
  card: {
    borderRadius: 24,
    padding: 20,
    justifyContent: "space-between",
    flex: 1
  },
  cardDisabled: {
    opacity: 0.6
  },
  illustration: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16
  },
  illustrationImage: {
    alignSelf: "center"
  },
  weekLabel: {
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4
  },
  cardTitle: {
    marginBottom: 8
  },
  cardFocus: {
    marginBottom: 12
  },
  skillsBlock: {
    marginBottom: 16
  },
  skillsHeading: {
    marginBottom: 4
  },
  skillRow: {
    marginBottom: 2
  },
  footerRow: {
    marginTop: 8
  },
  previewContainer: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 20,
    padding: 20
  },
  previewSubtitle: {
    marginTop: 4
  },
  previewChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 16
  },
  previewChip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginRight: 8,
    marginBottom: 8
  },
  previewChipTitle: {
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  previewChipGoal: {
    marginTop: 4
  }
});
