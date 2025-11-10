import React from "react";
import { GestureResponderEvent, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";

import { Illustration } from "@components/Illustration";
import { getLessonIllustrationKey } from "@data/illustrations";
import { getLessonDetailById } from "@data/index";
import type { LessonDetail } from "@data/index";
import type { IllustrationKey } from "@lib/illustrations";
import { useTheme } from "@theme/index";
import { useWeeksStore } from "@state/weeksStore";

type DailyPlanCardProps = {
  lessonId: string;
  title?: string;
  objective?: string;
  duration?: string;
  practiced?: boolean;
  icon?: string;
  isWeeklyFocus?: boolean;
  onPress?: (lessonId: string) => void;
  onTogglePractice?: (lessonId: string, nextPracticed: boolean) => void | Promise<void>;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const ILLUSTRATION_EMOJI: Partial<Record<IllustrationKey, string>> = {
  crate: "🛏️",
  handTarget: "👆",
  leaveIt: "🍪",
  leash: "🦮",
  looseLeash: "🦮",
  recall: "🎯",
  sit: "🐾",
  stay: "🧘",
  settle: "🪑",
  vet: "🩺",
  trade: "🔁",
  focus: "👀",
  independence: "🏠",
  distraction: "🎧",
  doorway: "🚪"
};

export const DailyPlanCard: React.FC<DailyPlanCardProps> = ({
  lessonId,
  title,
  objective,
  duration,
  practiced = false,
  icon,
  isWeeklyFocus,
  onPress,
  onTogglePractice
}) => {
  const theme = useTheme();
  const practicedOverride = useWeeksStore(
    React.useCallback((state) => state.practicedOverrides[lessonId], [lessonId])
  );
  const setLessonPracticeStatus = useWeeksStore((state) => state.setLessonPracticeStatus);
  const pressScale = useSharedValue(1);
  const [togglePending, setTogglePending] = React.useState(false);

  const lessonDetail = React.useMemo<LessonDetail | undefined>(
    () => getLessonDetailById(lessonId),
    [lessonId]
  );
  const illustrationKey = React.useMemo(
    () => getLessonIllustrationKey(lessonId),
    [lessonId]
  );
  const derivedTitle = title ?? lessonDetail?.title ?? "Training focus";
  const derivedObjective =
    objective ?? lessonDetail?.objective ?? "Open for micro-steps and coaching notes.";
  const derivedDuration = duration ?? lessonDetail?.duration ?? "1–3 min";
  const glyph =
    icon ?? (illustrationKey ? ILLUSTRATION_EMOJI[illustrationKey] : undefined) ?? "🐾";

  const [localPracticed, setLocalPracticed] = React.useState(
    practicedOverride ?? practiced ?? false
  );

  React.useEffect(() => {
    setLocalPracticed(practicedOverride ?? practiced ?? false);
  }, [practicedOverride, practiced]);

  const cardScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }]
  }));

  const handleTogglePractice = React.useCallback(
    (event?: GestureResponderEvent) => {
      event?.stopPropagation?.();
      if (togglePending) {
        return;
      }
      const next = !localPracticed;
      setLocalPracticed(next);
      setLessonPracticeStatus(lessonId, next);
      const maybePromise = onTogglePractice?.(lessonId, next);
      if (maybePromise && typeof (maybePromise as Promise<void>).then === "function") {
        setTogglePending(true);
        (maybePromise as Promise<void>)
          .catch(() => {
            // Revert if external toggle fails so UI stays truthful.
            setLocalPracticed((prev) => {
              if (prev === next) {
                setLessonPracticeStatus(lessonId, !next);
                return !next;
              }
              return prev;
            });
          })
          .finally(() => setTogglePending(false));
      }
    },
    [lessonId, localPracticed, onTogglePractice, setLessonPracticeStatus, togglePending]
  );

  const handlePressIn = React.useCallback(() => {
    pressScale.value = withTiming(0.95, { duration: 90 });
  }, [pressScale]);

  const handlePressOut = React.useCallback(() => {
    pressScale.value = withTiming(1, { duration: 160 });
  }, [pressScale]);

  const handleCardPress = React.useCallback(() => {
    onPress?.(lessonId);
  }, [lessonId, onPress]);

  return (
    <AnimatedPressable
      style={[
        styles.card,
        {
          borderRadius: theme.radius.lg,
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          opacity: localPracticed ? 0.78 : 1
        },
        cardScaleStyle
      ]}
      onPress={handleCardPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityHint="Opens lesson details"
      accessibilityLabel={`${derivedTitle} plan`}
    >
      <View style={styles.cornerAccent}>
        <Illustration name={illustrationKey} size={theme.spacing(5)} />
      </View>
      <View style={styles.headerRow}>
        <View style={[styles.iconChip, { backgroundColor: theme.palette.softMist }]}>
          <Text style={[theme.typography.textVariants.body, styles.iconText]}>{glyph}</Text>
        </View>
        {isWeeklyFocus ? (
          <View
            style={[
              styles.focusBadge,
              {
                backgroundColor: theme.palette.warmHighlight,
                borderRadius: theme.radius.pill
              }
            ]}
          >
            <Text
              style={[
                theme.typography.textVariants.caption,
                { color: theme.colors.textPrimary, fontWeight: "600" }
              ]}
            >
              This week’s focus
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.titleBlock}>
        <Text
          numberOfLines={2}
          style={[
            theme.typography.textVariants.title,
            { color: theme.colors.textPrimary, flex: 1 }
          ]}
        >
          {derivedTitle}
        </Text>
      </View>

      <View style={styles.metaRow}>
        <Text
          style={[
            theme.typography.textVariants.caption,
            { color: theme.colors.textSecondary, fontWeight: "600" }
          ]}
        >
          {derivedDuration}
        </Text>
        <View
          style={[
            styles.dot,
            { backgroundColor: theme.colors.border, marginHorizontal: 8 }
          ]}
        />
        <Text
          numberOfLines={2}
          style={[
            theme.typography.textVariants.body,
            {
              color: theme.colors.textSecondary,
              flex: 1
            }
          ]}
        >
          {derivedObjective}
        </Text>
      </View>

      <Pressable
        hitSlop={8}
        style={[
          styles.checkButton,
          {
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
            opacity: togglePending ? 0.5 : 1
          }
        ]}
        accessibilityRole="switch"
        accessibilityState={{ checked: localPracticed, busy: togglePending }}
        accessibilityLabel={
          localPracticed ? "Mark as not practiced" : "Mark lesson as practiced"
        }
        onPress={handleTogglePractice}
      >
        <Feather name="check" size={18} color={localPracticed ? theme.colors.textMuted : theme.colors.primary} />
      </Pressable>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
    overflow: "hidden"
  },
  cornerAccent: {
    position: "absolute",
    right: 16,
    top: 12,
    opacity: 0.65
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  iconChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999
  },
  iconText: {
    lineHeight: 20
  },
  focusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3
  },
  titleBlock: {
    marginTop: 10,
    marginBottom: 8
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    opacity: 0.6
  },
  checkButton: {
    position: "absolute",
    right: 12,
    bottom: 12,
    padding: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth
  }
});
