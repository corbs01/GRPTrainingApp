import React from "react";
import { Image, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  Extrapolate,
  FadeIn,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";

import { DailyPlanBoard } from "@components/home/DailyPlanBoard";
import { LessonDetailModal } from "@components/LessonDetailModal";
import { useTheme } from "@theme/index";
import { RootTabParamList } from "@app/navigation/types";
import {
  getDefaultWeek,
  getLessonDetailById,
  getWeekById,
  getWeekByNumber,
  LessonSummary,
  WeekSummary
} from "@data/index";
import { usePuppyStore } from "@state/puppyStore";
import { useDailyPlanStore, generateDailyPlan } from "@state/dailyPlanStore";
import { useWeeksStore } from "@state/weeksStore";
import { useMidnightPlanReset } from "@hooks/useMidnightPlanReset";
import { useLessonNotes } from "@hooks/useLessonNotes";
import { usePracticeEntries, getPracticeDateKey, usePractice } from "@lib/practiceLog";

const JOURNAL_PROMPTS = [
  "What made your puppy proud today?",
  "Where did you both pause and reset with ease?",
  "Which cue felt softer or clearer than yesterday?",
  "When did you notice your puppy taking a deep breath?",
  "What tiny win do you want to remember from today?",
  "How did you stay calm together when things got wiggly?"
];

type HomeTabNavigation = BottomTabNavigationProp<RootTabParamList>;

export const HomeScreen: React.FC = () => {
  useMidnightPlanReset();
  const theme = useTheme();
  const navigation = useNavigation<HomeTabNavigation>();
  const puppy = usePuppyStore((state) => state.puppy);
  const currentWeekNumber = usePuppyStore((state) => state.getCurrentWeekNumber());
  const planSelector = React.useMemo(() => generateDailyPlan(currentWeekNumber), [currentWeekNumber]);
  const plan = useDailyPlanStore(planSelector);
  const reorderLessons = useDailyPlanStore((state) => state.reorderLessons);
  const toggleLesson = useDailyPlanStore((state) => state.toggleLesson);
  const resetDailyPlan = useWeeksStore((state) => state.resetDailyPlan);
  const orderedLessonIds = useWeeksStore((state) => state.orderedLessonIds);
  const setLessonOrdering = useWeeksStore((state) => state.setLessonOrdering);
  const setActivePlanDate = useWeeksStore((state) => state.setActiveDate);

  const [selectedLessonId, setSelectedLessonId] = React.useState<string | null>(null);
  const detailPractice = usePractice(selectedLessonId ?? "__home__");

  const { noteDraft, noteStatus, handleNoteChange, handleRetrySave } = useLessonNotes({
    lessonId: selectedLessonId
  });

  const rawPlanLessons = plan?.lessons ?? [];
  const planLessons = React.useMemo(() => {
    if (!rawPlanLessons.length || orderedLessonIds.length === 0) {
      return rawPlanLessons;
    }
    const assigned = new Set<string>();
    const prioritized: LessonSummary[] = [];
    orderedLessonIds.forEach((lessonId) => {
      const match = rawPlanLessons.find((lesson) => lesson.id === lessonId);
      if (match && !assigned.has(lessonId)) {
        prioritized.push(match);
        assigned.add(lessonId);
      }
    });
    if (prioritized.length === rawPlanLessons.length) {
      return prioritized;
    }
    const remainder = rawPlanLessons.filter((lesson) => !assigned.has(lesson.id));
    return [...prioritized, ...remainder];
  }, [orderedLessonIds, rawPlanLessons]);
  const planWeekSummary: WeekSummary | undefined = React.useMemo(() => {
    if (plan?.weekId) {
      return getWeekById(plan.weekId) ?? getDefaultWeek();
    }
    if (currentWeekNumber) {
      return getWeekByNumber(currentWeekNumber) ?? getDefaultWeek();
    }
    return getDefaultWeek();
  }, [plan?.weekId, currentWeekNumber]);

  React.useEffect(() => {
    if (plan?.date) {
      setActivePlanDate(plan.date);
    }
  }, [plan?.date, setActivePlanDate]);

  const practiceEntries = usePracticeEntries();
  const todayKey = React.useMemo(() => getPracticeDateKey(new Date()), []);
  const practicedSet = React.useMemo(() => {
    const ids = new Set<string>();
    practiceEntries.forEach((entry) => {
      if (entry.dateKey === todayKey) {
        ids.add(entry.lessonId);
      }
    });
    return ids;
  }, [practiceEntries, todayKey]);

  const practicedCount = planLessons.filter((lesson) => practicedSet.has(lesson.id)).length;
  const allPracticed = planLessons.length > 0 && practicedCount === planLessons.length;

  const displayName = puppy?.name?.trim() || "Golden friend";
  const headerSummary = planWeekSummary
    ? `Week ${planWeekSummary.number} · ${planWeekSummary.title}`
    : "Training plan";

  const quickTip = React.useMemo(() => {
    if (planLessons.length === 0) {
      return undefined;
    }
    const seed = new Date().getDay() % planLessons.length;
    const detail = getLessonDetailById(planLessons[seed].id);
    if (!detail) {
      return undefined;
    }
    const text =
      detail.supportGuidelines?.[0] ??
      detail.steps?.[0] ??
      detail.objective ??
      "Notice their breath before you cue.";
    return {
      title: detail.title,
      text
    };
  }, [planLessons]);

  const journalPrompt = React.useMemo(() => {
    const seed = plan?.date ?? todayKey;
    const charTotal = seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const index = charTotal % JOURNAL_PROMPTS.length;
    return JOURNAL_PROMPTS[index];
  }, [plan?.date, todayKey]);

  const handleJournalPromptPress = React.useCallback(() => {
    navigation.navigate("Journal", {
      quickAdd: true,
      weekId: plan?.weekId,
      prompt: journalPrompt
    });
  }, [journalPrompt, navigation, plan?.weekId]);

  const scrollY = useSharedValue(0);
  const fabProgress = useSharedValue(0);
  const [fabOpen, setFabOpen] = React.useState(false);

  React.useEffect(() => {
    fabProgress.value = withTiming(fabOpen ? 1 : 0, { duration: 180 });
  }, [fabOpen, fabProgress]);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const headerStyle = useAnimatedStyle(() => {
    const translateY = interpolate(scrollY.value, [0, 90], [0, -26], Extrapolate.CLAMP);
    const scale = interpolate(scrollY.value, [0, 90], [1, 0.94], Extrapolate.CLAMP);
    return {
      transform: [{ translateY }, { scale }]
    };
  });

  const handleLessonPress = React.useCallback((lesson: LessonSummary) => {
    setSelectedLessonId(lesson.id);
  }, []);

  const handlePlanToggle = React.useCallback(
    (lessonId: string) => {
      if (plan) {
        toggleLesson(plan.weekId, plan.date, lessonId);
      }
    },
    [plan, toggleLesson]
  );

  const handlePlanOrderChange = React.useCallback(
    (orderedIds: string[]) => {
      if (plan) {
        reorderLessons(plan.weekId, plan.date, orderedIds);
        setLessonOrdering(orderedIds);
      }
    },
    [plan, reorderLessons, setLessonOrdering]
  );

  const handleModalTogglePractice = React.useCallback(() => {
    if (!plan || !selectedLessonId) {
      return;
    }
    detailPractice.toggle();
    toggleLesson(plan.weekId, plan.date, selectedLessonId);
  }, [detailPractice, plan, selectedLessonId, toggleLesson]);

  const closeFab = React.useCallback(() => setFabOpen(false), []);

  const scrollContentPadding = theme.spacing(3);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}> 
      <Animated.ScrollView
        style={styles.flex}
        contentContainerStyle={{ paddingBottom: theme.spacing(6) }}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onScrollBeginDrag={closeFab}
      >
        <View style={[styles.container, { paddingHorizontal: theme.spacing(2.5) }]}> 
          <Animated.View style={[styles.headerCard, headerStyle, { backgroundColor: theme.colors.surface, borderRadius: theme.radius.xl, padding: theme.spacing(2) }]}> 
            <HeaderSummary
              title={`Hi, ${displayName}`}
              subtitle={headerSummary}
              focus={planWeekSummary?.focus}
              photoUri={puppy?.photoUri}
              practicedCount={practicedCount}
              totalLessons={planLessons.length}
              allPracticed={allPracticed}
            />
          </Animated.View>

          <View style={{ marginTop: scrollContentPadding }}>
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
                { color: theme.colors.textSecondary, marginTop: theme.spacing(0.5) }
              ]}
            >
              {allPracticed
                ? "Everything is checked off — revisit a favorite skill or jot a note."
                : "Blend these short stories into your day. Long-press to reorder, swipe to log."}
            </Text>

            {planLessons.length > 0 ? (
              <View style={{ marginTop: theme.spacing(1.5) }}>
                <DailyPlanBoard
                  lessons={planLessons}
                  onLessonPress={handleLessonPress}
                  onLessonToggle={handlePlanToggle}
                  onLessonOrderChange={handlePlanOrderChange}
                />
              </View>
            ) : (
              <View style={{ marginTop: theme.spacing(2) }}>
                <EmptyPlanState onRefresh={resetDailyPlan} />
              </View>
            )}

            <JournalPromptFootnote
              prompt={journalPrompt}
              onPress={handleJournalPromptPress}
              style={{ marginTop: theme.spacing(2) }}
            />
          </View>

          {quickTip ? (
            <QuickTipCard
              style={{ marginTop: scrollContentPadding }}
              lessonTitle={quickTip.title}
              tip={quickTip.text}
            />
          ) : null}
        </View>
      </Animated.ScrollView>

      <FloatingActionMenu
        open={fabOpen}
        progress={fabProgress}
        onToggle={() => setFabOpen((prev) => !prev)}
        actions={[
          {
            label: "Add Note",
            icon: "edit-3",
            onPress: () => {
              closeFab();
              navigation.navigate("Journal", {
                quickAdd: true,
                weekId: plan?.weekId,
                lessonId: planLessons[0]?.id
              });
            }
          },
          {
            label: "Add Photo",
            icon: "image",
            onPress: () => {
              closeFab();
              navigation.navigate("Gallery");
            }
          }
        ]}
      />

      <LessonDetailModal
        visible={Boolean(selectedLessonId)}
        lessonId={selectedLessonId}
        practiced={selectedLessonId ? detailPractice.practicedToday : false}
        notes={noteDraft}
        noteStatus={noteStatus}
        onClose={() => setSelectedLessonId(null)}
        onTogglePractice={handleModalTogglePractice}
        onChangeNotes={handleNoteChange}
        onRetrySave={handleRetrySave}
        onOpenSupportTopic={(supportId) =>
          navigation.navigate("Support", { focusSupportId: supportId })
        }
      />
    </SafeAreaView>
  );
};

type HeaderSummaryProps = {
  title: string;
  subtitle: string;
  focus?: string;
  photoUri?: string;
  practicedCount: number;
  totalLessons: number;
  allPracticed: boolean;
};

const HeaderSummary: React.FC<HeaderSummaryProps> = ({
  title,
  subtitle,
  focus,
  photoUri,
  practicedCount,
  totalLessons,
  allPracticed
}) => {
  const theme = useTheme();
  return (
    <View style={styles.headerRow}>
      <View style={[styles.avatarShell, { borderRadius: theme.radius.lg }]}> 
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.avatarImage} />
        ) : (
          <View style={[styles.avatarFallback, { backgroundColor: theme.colors.primarySoft }]}> 
            <Feather name="sun" size={28} color={theme.colors.primary} />
          </View>
        )}
      </View>
      <View style={{ flex: 1, marginLeft: theme.spacing(1.5) }}>
        <Text
          style={[theme.typography.textVariants.heading, { color: theme.colors.textPrimary }]}
          numberOfLines={1}
        >
          {title}
        </Text>
        <Text
          style={[theme.typography.textVariants.body, { color: theme.colors.textSecondary, marginTop: theme.spacing(0.25) }]}
          numberOfLines={1}
        >
          {subtitle}
        </Text>
        {focus ? (
          <Text
            style={[theme.typography.textVariants.caption, { color: theme.colors.textMuted, marginTop: theme.spacing(0.5) }]}
            numberOfLines={2}
          >
            {focus}
          </Text>
        ) : null}
        <View style={[styles.progressRow, { marginTop: theme.spacing(1) }]}>
          <Feather
            name={allPracticed ? "check-circle" : "clock"}
            size={16}
            color={allPracticed ? theme.colors.success : theme.colors.primary}
          />
          <Text
            style={[theme.typography.textVariants.body, { color: theme.colors.textPrimary, marginLeft: theme.spacing(0.5) }]}
          >
            {totalLessons > 0
              ? `${practicedCount}/${totalLessons} practiced`
              : "Plan arrives at midnight"}
          </Text>
        </View>
      </View>
    </View>
  );
};

type QuickTipCardProps = {
  lessonTitle: string;
  tip: string;
  style?: StyleProp<ViewStyle>;
};

const QuickTipCard: React.FC<QuickTipCardProps> = ({ lessonTitle, tip, style }) => {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.quickTip,
        style,
        {
          backgroundColor: theme.colors.primarySoft,
          borderRadius: theme.radius.lg,
          borderColor: theme.colors.primary,
          borderWidth: StyleSheet.hairlineWidth
        }
      ]}
    >
      <Text
        style={[theme.typography.textVariants.caption, { color: theme.colors.primary }]}
      >
        Quick tip · {lessonTitle}
      </Text>
      <Text
        style={[theme.typography.textVariants.body, { color: theme.colors.textPrimary, marginTop: theme.spacing(0.5) }]}
      >
        {tip}
      </Text>
    </View>
  );
};

type JournalPromptProps = {
  prompt: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

const JournalPromptFootnote: React.FC<JournalPromptProps> = ({ prompt, onPress, style }) => {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Add journal entry from prompt">
      <Animated.View
        entering={FadeIn.duration(350).delay(120)}
        style={[
          styles.promptContainer,
          style,
          {
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.lg
          }
        ]}
      > 
        <Text
          style={[
            theme.typography.textVariants.body,
            {
              color: theme.colors.textMuted,
              fontStyle: "italic",
              textAlign: "center",
              flex: 1
            }
          ]}
        >
          {prompt}
        </Text>
      </Animated.View>
    </Pressable>
  );
};

type EmptyPlanStateProps = {
  onRefresh: () => void;
};

const EmptyPlanState: React.FC<EmptyPlanStateProps> = ({ onRefresh }) => {
  const theme = useTheme();
  return (
    <View
      style={[styles.emptyPlan, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg }]}
    >
      <Text
        style={[theme.typography.textVariants.bodyStrong, { color: theme.colors.textPrimary }]}
      >
        Your new plan is ready — fetch it below 👇
      </Text>
      <Pressable
        onPress={onRefresh}
        style={[styles.refreshButton, { backgroundColor: theme.colors.primary, borderRadius: theme.radius.pill }]}
      >
        <Text style={[theme.typography.textVariants.button, { color: theme.colors.onPrimary }]}>Refresh plan</Text>
      </Pressable>
    </View>
  );
};

type FloatingActionMenuProps = {
  open: boolean;
  progress: SharedValue<number>;
  onToggle: () => void;
  actions: Array<{ label: string; icon: keyof typeof Feather.glyphMap; onPress: () => void }>;
};

const FloatingActionMenu: React.FC<FloatingActionMenuProps> = ({ open, progress, onToggle, actions }) => {
  const theme = useTheme();

  const menuStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      {
        translateY: (1 - progress.value) * 12
      }
    ]
  }));

  return (
    <View style={styles.fabContainer}>
      <Animated.View style={[styles.fabMenu, menuStyle]}> 
        {actions.map((action) => (
          <Pressable
            key={action.label}
            style={[styles.fabAction, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            onPress={action.onPress}
          >
            <Feather name={action.icon} size={16} color={theme.colors.primary} />
            <Text
              style={[theme.typography.textVariants.button, { color: theme.colors.textPrimary, marginLeft: theme.spacing(0.5) }]}
            >
              {action.label}
            </Text>
          </Pressable>
        ))}
      </Animated.View>
      <Pressable
        onPress={onToggle}
        style={[styles.fabButton, { backgroundColor: theme.colors.primary, borderRadius: theme.radius.pill }]}
      >
        <Feather
          name={open ? "x" : "plus"}
          size={22}
          color={theme.colors.onPrimary}
        />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1
  },
  flex: {
    flex: 1
  },
  container: {
    flex: 1
  },
  headerCard: {
    width: "100%"
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  avatarShell: {
    width: 80,
    height: 80,
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
  progressRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  quickTip: {
    padding: 18
  },
  promptContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: StyleSheet.hairlineWidth
  },
  emptyPlan: {
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20,
    alignItems: "center",
    justifyContent: "center"
  },
  refreshButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginTop: 16
  },
  fabContainer: {
    position: "absolute",
    bottom: 32,
    right: 24,
    alignItems: "flex-end"
  },
  fabMenu: {
    marginBottom: 12
  },
  fabAction: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 10
  },
  fabButton: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center"
  }
});
