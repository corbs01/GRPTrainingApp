import React from "react";
import {
  FlatList,
  ListRenderItem,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ScreenContainer } from "@components/ScreenContainer";
import { useTheme } from "@theme/index";
import { RootStackParamList } from "@app/navigation/types";
import { getAllWeeks, getWeekLessonSummaries, WeekSummary } from "@data/index";
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
  illustrationLabel: string;
  status: "available" | "placeholder";
};

const DUMMY_WEEK_DATA: Record<
  number,
  {
    title: string;
    focus: string;
    skills: string[];
    illustrationLabel: string;
  }
> = {
  8: {
    title: "Welcome Home & Bonding",
    focus: "Get cozy, set routines, and build trust together.",
    skills: ["Name Game", "Crate Comfort", "Potty Rhythm"],
    illustrationLabel: "Homecoming Huddle"
  },
  9: {
    title: "First Cues & Alone Time",
    focus: "Layer in simple cues and practice gentle independence.",
    skills: ["Sit Foundations", "Hand Target", "Calm Alone Time"],
    illustrationLabel: "First Cues"
  },
  10: {
    title: "Down & Leave-It Foundations",
    focus: "Introduce impulse control games and polite manners.",
    skills: ["Easy Down", "Leave-It Basics", "Calm Cat Intro"],
    illustrationLabel: "Impulse Control"
  },
  11: {
    title: "Recall & Confidence",
    focus: "Boost response to your call and crate confidence.",
    skills: ["Recall Party", "Trade Game", "Crate Love"],
    illustrationLabel: "Recall Party"
  },
  12: {
    title: "Leash & Calm Greetings",
    focus: "Introduce walking gear and polite social hellos.",
    skills: ["Harness Happy", "Indoor Leash Start", "Calm Greetings"],
    illustrationLabel: "Leash Practice"
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

    const lessonTitles =
      definedWeek?.id && !dummyWeek
        ? getWeekLessonSummaries(definedWeek.id).slice(0, 3).map((lesson) => lesson.title)
        : dummyWeek?.skills ?? [];

    milestones.push({
      id: definedWeek?.id ?? null,
      weekNumber,
      title: dummyWeek?.title ?? definedWeek?.title ?? fallbackTitle,
      focus: dummyWeek?.focus ?? definedWeek?.focus ?? fallbackFocus,
      skills: lessonTitles.length > 0 ? lessonTitles : ["Details to be announced"],
      illustrationLabel: dummyWeek?.illustrationLabel ?? `Week ${weekNumber}`,
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

  React.useEffect(() => {
    const index = data.findIndex((item) => item.weekNumber === currentWeek);
    if (index >= 0) {
      requestAnimationFrame(() => {
        listRef.current?.scrollToIndex({
          index,
          animated: true,
          viewPosition: 0.5
        });
      });
    }
  }, [currentWeek, data, orientation]);

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
        <Pressable
          onPress={() => handleNavigate(item)}
          disabled={!isAvailable}
          style={({ pressed }) => [
            styles.card,
            {
              borderColor: isCurrent ? theme.colors.accent : theme.colors.border,
              borderWidth: isCurrent ? 2 : StyleSheet.hairlineWidth,
              backgroundColor: theme.colors.card,
              width: orientation === "horizontal" ? horizontalCardWidth : verticalCardWidth,
              height: cardHeight,
              opacity: pressed ? 0.95 : 1
            },
            !isAvailable && styles.cardDisabled
          ]}
        >
          <View
            style={[
              styles.illustration,
              {
                backgroundColor: theme.palette.softMist,
                borderRadius: theme.radius.md
              }
            ]}
          >
            <Text
              style={[
                theme.typography.textVariants.caption,
                styles.illustrationLabel,
                { color: theme.colors.onSecondary }
              ]}
            >
              {item.illustrationLabel}
            </Text>
          </View>

          <Text
            style={[
              theme.typography.textVariants.caption,
              styles.weekLabel,
              { color: theme.colors.textMuted }
            ]}
          >
            Week {item.weekNumber}
          </Text>
          <Text
            style={[
              theme.typography.textVariants.title,
              styles.cardTitle,
              { color: theme.colors.textPrimary }
            ]}
          >
            {item.title}
          </Text>
          <Text
            style={[
              theme.typography.textVariants.body,
              styles.cardFocus,
              { color: theme.colors.textSecondary }
            ]}
          >
            {item.focus}
          </Text>

          <View style={styles.skillsBlock}>
            <Text
              style={[
                theme.typography.textVariants.caption,
                styles.skillsHeading,
                { color: theme.colors.textMuted }
              ]}
            >
              Key Skills Preview
            </Text>
            {item.skills.map((skill) => (
              <Text
                key={skill}
                style={[
                  theme.typography.textVariants.body,
                  styles.skillRow,
                  { color: theme.colors.textPrimary }
                ]}
              >
                • {skill}
              </Text>
            ))}
          </View>

          <View style={styles.footerRow}>
            <Text
              style={[
                theme.typography.textVariants.button,
                {
                  color: isAvailable ? theme.colors.accent : theme.colors.textMuted
                }
              ]}
            >
              {isAvailable ? "Go to week" : "Coming soon"}
            </Text>
          </View>
        </Pressable>
      );
    },
    [
      cardHeight,
      currentWeek,
      handleNavigate,
      horizontalCardWidth,
      orientation,
      theme.colors.accent,
      theme.colors.card,
      theme.colors.onSecondary,
      theme.colors.textMuted,
      theme.colors.textPrimary,
      theme.colors.textSecondary,
      theme.colors.border,
      theme.palette.softMist,
      theme.radius.md,
      theme.typography.textVariants.body,
      theme.typography.textVariants.button,
      theme.typography.textVariants.caption,
      theme.typography.textVariants.title,
      verticalCardWidth
    ]
  );

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
    </ScreenContainer>
  );
};

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
  card: {
    borderRadius: 24,
    padding: 20,
    justifyContent: "space-between"
  },
  cardDisabled: {
    opacity: 0.6
  },
  illustration: {
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16
  },
  illustrationLabel: {
    textTransform: "uppercase",
    letterSpacing: 1
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
  }
});
