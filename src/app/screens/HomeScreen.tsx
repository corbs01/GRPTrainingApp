import React, { useEffect, useMemo } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";

import { ScreenContainer } from "@components/ScreenContainer";
import { Card } from "@components/Card";
import { LessonCard } from "@components/LessonCard";
import { useTheme } from "@theme/index";
import { usePuppyStore } from "@state/puppyStore";
import { useDailyPlanStore, getDailyPlanKey } from "@state/dailyPlanStore";
import { getDefaultWeek, getLessonSummariesFromIds, getWeekByNumber, WeekSummary } from "@data/index";
import { RootTabParamList } from "@app/navigation/types";

type HomeTabNavigation = BottomTabNavigationProp<RootTabParamList>;

const formatDateKey = (date: Date) => date.toISOString().split("T")[0];

const shortcuts: Array<{ label: string; icon: keyof typeof Feather.glyphMap; route: keyof RootTabParamList }> = [
  { label: "Journal", icon: "edit-3", route: "Journal" },
  { label: "Gallery", icon: "image", route: "Gallery" }
];

export const HomeScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<HomeTabNavigation>();
  const puppy = usePuppyStore((state) => state.puppy);
  const currentWeekNumber = usePuppyStore((state) => state.getCurrentWeekNumber());
  const todayKey = useMemo(() => formatDateKey(new Date()), []);

  const weekSummary: WeekSummary | undefined = useMemo(() => {
    if (currentWeekNumber) {
      return getWeekByNumber(currentWeekNumber) ?? getDefaultWeek();
    }
    return getDefaultWeek();
  }, [currentWeekNumber]);

  const lessonPoolIds = weekSummary?.lessonIds ?? [];
  const ensurePlan = useDailyPlanStore((state) => state.ensurePlan);
  const toggleLesson = useDailyPlanStore((state) => state.toggleLesson);
  const plan = useDailyPlanStore(
    React.useCallback(
      (state) =>
        weekSummary ? state.plans[getDailyPlanKey(weekSummary.id, todayKey)] : undefined,
      [weekSummary, todayKey]
    )
  );

  useEffect(() => {
    if (weekSummary && lessonPoolIds.length > 0) {
      ensurePlan(weekSummary.id, todayKey, lessonPoolIds);
    }
  }, [ensurePlan, weekSummary, todayKey, lessonPoolIds]);

  const planLessons = useMemo(
    () =>
      weekSummary && plan
        ? getLessonSummariesFromIds(weekSummary.id, plan.lessonIds)
        : [],
    [plan, weekSummary]
  );

  const practicedIds = plan?.practicedLessonIds ?? [];
  const allPracticed = planLessons.length > 0 && practicedIds.length === planLessons.length;

  const displayName = puppy?.name?.trim() || "Golden friend";
  const headerSubtitle = weekSummary
    ? `Week ${weekSummary.number} · ${weekSummary.title}`
    : "Training plan ready";

  return (
    <ScreenContainer scrollable>
      <HeaderSection puppyPhoto={puppy?.photoUri} title={`Hi, ${displayName}`} subtitle={headerSubtitle} focus={weekSummary?.focus} />

      <Card tone="subtle" style={{ marginTop: theme.spacing(2) }}>
        <Text
          style={[
            theme.typography.textVariants.title,
            { color: theme.colors.textPrimary }
          ]}
        >
          Today&apos;s plan
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
          {allPracticed
            ? "Everything is checked off—nice work! Add a journal note or revisit a favorite skill."
            : "Practice these short sessions to keep training fun and consistent today."}
        </Text>

        <View style={{ marginTop: theme.spacing(1.5) }}>
          {planLessons.length > 0 ? (
            planLessons.map((lesson) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                practiced={practicedIds.includes(lesson.id)}
                onToggle={() => {
                  if (weekSummary) {
                    toggleLesson(weekSummary.id, todayKey, lesson.id);
                  }
                }}
              />
            ))
          ) : (
            <EmptyPlan />
          )}
        </View>
      </Card>

      <Card style={{ marginTop: theme.spacing(2) }}>
        <Text
          style={[
            theme.typography.textVariants.title,
            { color: theme.colors.textPrimary }
          ]}
        >
          Quick captures
        </Text>
        <Text
          style={[
            theme.typography.textVariants.body,
            { color: theme.colors.textSecondary, marginTop: theme.spacing(0.5) }
          ]}
        >
          Save today&apos;s wins while they&apos;re fresh.
        </Text>
        <View style={[styles.shortcutsRow, { marginTop: theme.spacing(1.5) }]}>
          {shortcuts.map((shortcut, index) => (
            <Pressable
              key={shortcut.route}
              onPress={() => navigation.navigate(shortcut.route)}
              style={[
                styles.shortcut,
                {
                  borderRadius: theme.radius.md,
                  borderColor: theme.colors.border,
                  padding: theme.spacing(1.25),
                  marginRight: index === shortcuts.length - 1 ? 0 : theme.spacing(1)
                }
              ]}
            >
              <View
                style={[
                  styles.shortcutIcon,
                  {
                    borderRadius: theme.radius.pill,
                    backgroundColor: theme.colors.primarySoft,
                    marginBottom: theme.spacing(0.75)
                  }
                ]}
              >
                <Feather name={shortcut.icon} size={18} color={theme.colors.primary} />
              </View>
              <Text
                style={[
                  theme.typography.textVariants.button,
                  { color: theme.colors.textPrimary }
                ]}
              >
                {shortcut.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>
    </ScreenContainer>
  );
};

type HeaderSectionProps = {
  puppyPhoto?: string;
  title: string;
  subtitle: string;
  focus?: string;
};

const HeaderSection: React.FC<HeaderSectionProps> = ({ puppyPhoto, title, subtitle, focus }) => {
  const theme = useTheme();

  return (
    <View style={styles.header}>
      <View
        style={[
          styles.avatar,
          {
            borderRadius: theme.radius.lg,
            backgroundColor: theme.colors.surface,
            shadowColor: theme.shadow.soft.shadowColor,
            shadowOpacity: theme.shadow.soft.shadowOpacity,
            shadowRadius: theme.shadow.soft.shadowRadius,
            shadowOffset: theme.shadow.soft.shadowOffset
          }
        ]}
      >
        {puppyPhoto ? (
          <Image
            source={{ uri: puppyPhoto }}
            style={[styles.avatarImage, { borderRadius: theme.radius.lg }]}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[
              styles.avatarFallback,
              {
                borderRadius: theme.radius.lg,
                backgroundColor: theme.colors.primarySoft
              }
            ]}
          >
            <Feather name="smile" size={28} color={theme.colors.primary} />
          </View>
        )}
      </View>
      <View style={styles.headerContent}>
        <Text
          style={[
            theme.typography.textVariants.heading,
            { color: theme.colors.textPrimary }
          ]}
        >
          {title}
        </Text>
        <Text
          style={[
            theme.typography.textVariants.body,
            { color: theme.colors.textSecondary, marginTop: theme.spacing(0.25) }
          ]}
        >
          {subtitle}
        </Text>
        {focus ? (
          <Text
            style={[
              theme.typography.textVariants.caption,
              { color: theme.colors.textMuted, marginTop: theme.spacing(0.5) }
            ]}
            numberOfLines={2}
          >
            {focus}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

const EmptyPlan: React.FC = () => {
  const theme = useTheme();

  return (
    <View style={styles.emptyState}>
      <Feather name="calendar" size={20} color={theme.colors.textMuted} />
      <Text
        style={[
          theme.typography.textVariants.body,
          {
            color: theme.colors.textSecondary,
            marginTop: theme.spacing(0.75),
            textAlign: "center"
          }
        ]}
      >
        Add or confirm your puppy details to see a personalized plan.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center"
  },
  avatar: {
    width: 72,
    height: 72,
    overflow: "hidden"
  },
  avatarImage: {
    width: "100%",
    height: "100%"
  },
  avatarFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  headerContent: {
    flex: 1,
    marginLeft: 16
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24
  },
  shortcutsRow: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  shortcut: {
    flex: 1,
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth
  },
  shortcutIcon: {
    padding: 8
  }
});
