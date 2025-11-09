import React, { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";

import { Card } from "./Card";
import { Illustration } from "./Illustration";
import { useTheme } from "@theme/index";
import { LessonSummary } from "@data/index";
import { getLessonIllustrationKey } from "@data/illustrations";
import { usePractice } from "@lib/practiceLog";

type LessonCardProps = {
  lesson: LessonSummary;
  onPress?: () => void;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const LessonCard: React.FC<LessonCardProps> = ({ lesson, onPress }) => {
  const theme = useTheme();
  const { practicedToday, toggle } = usePractice(lesson.id);
  const progress = useSharedValue(practicedToday ? 1 : 0);
  const liftProgress = useSharedValue(0);
  const illustrationKey = React.useMemo(
    () => getLessonIllustrationKey(lesson.id),
    [lesson.id]
  );

  useEffect(() => {
    progress.value = withTiming(practicedToday ? 1 : 0, {
      duration: practicedToday ? 220 : 180,
      easing: Easing.out(Easing.cubic)
    });
  }, [practicedToday, progress]);

  const backgroundStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [theme.colors.surface, theme.colors.primarySoft]
    )
  }));

  const checkStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [theme.colors.surface, theme.colors.primary]
    ),
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      [theme.colors.border, theme.colors.primary]
    ),
    transform: [
      {
        scale: 0.9 + progress.value * 0.12
      }
    ]
  }));

  const bloomStyle = useAnimatedStyle(() => ({
    opacity: progress.value * 0.4,
    transform: [
      {
        scale: 1 + progress.value * 0.45
      }
    ]
  }));

  const iconStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      {
        scale: 0.85 + progress.value * 0.15
      }
    ]
  }));

  const circleSize = theme.spacing(3);
  const illustrationSize = theme.spacing(6);
  const liftOffset = theme.spacingTokens.xs;

  const cardLiftStyle = useAnimatedStyle(() => {
    const t = liftProgress.value;
    return {
      transform: [
        { translateY: -liftOffset * t },
        { scale: 1 + t * 0.01 }
      ],
      elevation: theme.shadow.soft.elevation * t,
      shadowColor: theme.shadow.soft.shadowColor,
      shadowOpacity: theme.shadow.soft.shadowOpacity * t,
      shadowRadius: theme.shadow.soft.shadowRadius * t,
      shadowOffset: {
        width: theme.shadow.soft.shadowOffset.width * t,
        height: theme.shadow.soft.shadowOffset.height * t
      }
    };
  });

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
    <Card tone="subtle" padding="md" style={[styles.cardOuter, cardLiftStyle]}>
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityState={{ checked: practicedToday }}
        accessibilityLabel={
          onPress
            ? `View details for ${lesson.title}`
            : `Mark ${lesson.title} as practiced`
        }
        accessibilityHint={
          onPress
            ? "Opens lesson details. Double tap the check icon to toggle completion."
            : "Marks the lesson as practiced."
        }
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onTouchCancel={handlePressOut}
        onPress={onPress ?? toggle}
        style={[
          styles.row,
          {
            borderRadius: theme.radius.md,
            paddingVertical: theme.spacing(1),
            paddingHorizontal: theme.spacing(1.25)
          },
          backgroundStyle
        ]}
      >
        <View style={styles.leftRail}>
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: practicedToday }}
            accessibilityLabel={`Mark ${lesson.title} as practiced`}
            hitSlop={12}
            onPress={(event) => {
              event.stopPropagation();
              toggle();
            }}
          >
            <View style={styles.checkWrapper}>
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.checkBloom,
                  {
                    borderRadius: circleSize,
                    backgroundColor: theme.colors.primarySoft
                  },
                  bloomStyle
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
                  checkStyle
                ]}
              >
                <Animated.View style={[styles.checkIcon, iconStyle]}>
                  <Feather name="check" size={18} color={theme.colors.onPrimary} />
                </Animated.View>
              </Animated.View>
            </View>
          </Pressable>
          <View style={[styles.content, { marginLeft: theme.spacing(1) }]}>
            <Text
              style={[
                theme.typography.textVariants.title,
                { color: theme.colors.textPrimary, marginBottom: theme.spacing(0.25) }
              ]}
            >
              {lesson.title}
            </Text>
            {lesson.objective ? (
              <Text
                style={[
                  theme.typography.textVariants.body,
                  { color: theme.colors.textSecondary }
                ]}
                numberOfLines={2}
              >
                {lesson.objective}
              </Text>
            ) : null}
            {lesson.duration ? (
              <Text
                style={[
                  theme.typography.textVariants.caption,
                  {
                    color: theme.colors.textMuted,
                    marginTop: theme.spacing(0.5)
                  }
                ]}
              >
                {lesson.duration}
              </Text>
            ) : null}
          </View>
        </View>
        <Illustration
          name={illustrationKey}
          size={illustrationSize}
          style={[
            styles.illustration,
            {
              marginLeft: theme.spacing(1),
              borderRadius: theme.radius.md
            }
          ]}
        />
      </AnimatedPressable>
    </Card>
  );
};

const styles = StyleSheet.create({
  cardOuter: {
    marginBottom: 12
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  leftRail: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center"
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
  checkIcon: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1
  },
  content: {
    flex: 1
  },
  illustration: {
    overflow: "hidden"
  }
});
