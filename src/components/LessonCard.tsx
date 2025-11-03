import React, { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";

import { Card } from "./Card";
import { useTheme } from "@theme/index";
import { LessonSummary } from "@data/index";

type LessonCardProps = {
  lesson: LessonSummary;
  practiced: boolean;
  onToggle: () => void;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const LessonCard: React.FC<LessonCardProps> = ({ lesson, practiced, onToggle }) => {
  const theme = useTheme();
  const progress = useSharedValue(practiced ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(practiced ? 1 : 0, {
      damping: 16,
      stiffness: 180,
      mass: 0.9
    });
  }, [practiced, progress]);

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
        scale: 0.9 + progress.value * 0.1
      }
    ]
  }));

  const iconStyle = useAnimatedStyle(() => ({
    opacity: progress.value
  }));

  const circleSize = theme.spacing(3);

  return (
    <Card tone="subtle" padding="md" style={styles.cardOuter}>
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityState={{ checked: practiced }}
        accessibilityLabel={`Mark ${lesson.title} as practiced`}
        onPress={onToggle}
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
    alignItems: "center"
  },
  checkCircle: {
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center"
  },
  checkIcon: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1
  },
  content: {
    flex: 1
  }
});
