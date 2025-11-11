import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ScreenContainer } from "@components/ScreenContainer";
import { Card } from "@components/Card";
import { LessonCard } from "@components/LessonCard";
import { Illustration } from "@components/Illustration";
import { LessonDetailModal, NoteSaveStatus } from "@components/LessonDetailModal";
import { useLessonNotes } from "@hooks/useLessonNotes";
import { useTheme } from "@theme/index";
import { RootStackParamList } from "@app/navigation/types";
import {
  getDefaultWeek,
  getWeekById,
  getWeekLessonContent,
  WeekLessonContent
} from "@data/index";
import { getWeekIllustrationKey } from "@data/illustrations";
import { useTrainingStore } from "@state/trainingStore";
import { usePractice } from "@lib/practiceLog";

type WeekScreenRoute = RouteProp<RootStackParamList, "Week">;
type WeekScreenNavigation = NativeStackNavigationProp<RootStackParamList>;
export const WeekScreen: React.FC = () => {
  const theme = useTheme();
  const route = useRoute<WeekScreenRoute>();
  const navigation = useNavigation<WeekScreenNavigation>();
  const requestedWeekId = route.params?.weekId;

  const weekSummary = React.useMemo(() => {
    if (requestedWeekId) {
      return getWeekById(requestedWeekId) ?? getDefaultWeek();
    }

    return getDefaultWeek();
  }, [requestedWeekId]);

  const resolvedWeekId = weekSummary?.id ?? requestedWeekId;
  const weekContent = React.useMemo<WeekLessonContent | undefined>(
    () => (resolvedWeekId ? getWeekLessonContent(resolvedWeekId) : undefined),
    [resolvedWeekId]
  );

  React.useEffect(() => {
    const targetLessonId = route.params?.lessonId;
    if (!targetLessonId || !weekContent) {
      return;
    }
    const exists = weekContent.lessons.some((lesson) => lesson.id === targetLessonId);
    if (exists) {
      setSelectedLessonId(targetLessonId);
    }
  }, [route.params?.lessonId, weekContent]);

  const setActiveWeek = useTrainingStore((state) => state.setActiveWeek);

  const [selectedLessonId, setSelectedLessonId] = React.useState<string | null>(null);

  const { noteDraft, noteStatus, handleNoteChange, handleRetrySave } = useLessonNotes({
    lessonId: selectedLessonId
  });

  React.useEffect(() => {
    if (resolvedWeekId) {
      setActiveWeek(resolvedWeekId);
    }
  }, [resolvedWeekId, setActiveWeek]);

  const handleCloseModal = React.useCallback(() => {
    setSelectedLessonId(null);
  }, []);

  const handleOpenSupportTopic = React.useCallback(
    (supportId: string) => {
      navigation.navigate("RootTabs", {
        screen: "Support",
        params: { focusSupportId: supportId }
      });
    },
    [navigation]
  );

  const detailPractice = usePractice(selectedLessonId ?? "__lesson-detail__");

  const heroIllustrationKey = React.useMemo(
    () => getWeekIllustrationKey(weekSummary?.id ?? ""),
    [weekSummary?.id]
  );

  if (!resolvedWeekId || !weekContent) {
    return (
      <ScreenContainer>
        <View style={styles.fallback}>
          <Text
            style={[
              theme.typography.textVariants.title,
              { color: theme.colors.textPrimary, marginBottom: theme.spacing(0.5) }
            ]}
          >
            Week unavailable
          </Text>
          <Text
            style={[
              theme.typography.textVariants.body,
              { color: theme.colors.textSecondary }
            ]}
          >
            We couldn&apos;t find the training plan details for this week.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <>
      <ScreenContainer scrollable>
        <Card tone="highlight">
          <View
            style={[
              styles.heroRow,
              {
                marginBottom: theme.spacing(1.5)
              }
            ]}
          >
            <View style={{ flex: 1, paddingRight: theme.spacing(1) }}>
              <Text
                style={[
                  theme.typography.textVariants.caption,
                  {
                    color: theme.colors.primary,
                    textTransform: "uppercase",
                    letterSpacing: 1.1
                  }
                ]}
              >
                Week {weekSummary?.number ?? ""}
              </Text>
              <Text
                style={[
                  theme.typography.textVariants.title,
                  {
                    color: theme.colors.textPrimary,
                    marginTop: theme.spacing(0.5)
                  }
                ]}
              >
                {weekContent.title}
              </Text>
              {weekSummary?.focus ? (
                <Text
                  style={[
                    theme.typography.textVariants.body,
                    {
                      color: theme.colors.textSecondary,
                      marginTop: theme.spacing(0.75)
                    }
                  ]}
                >
                  Focus: {weekSummary.focus}
                </Text>
              ) : null}
              {weekContent.summary ? (
                <Text
                  style={[
                    theme.typography.textVariants.body,
                    {
                      color: theme.colors.textSecondary,
                      marginTop: theme.spacing(0.75)
                    }
                  ]}
                >
                  {weekContent.summary}
                </Text>
              ) : null}
            </View>
            <Illustration
              name={heroIllustrationKey}
              size={theme.spacing(10)}
              style={{
                borderRadius: theme.radius.lg,
                backgroundColor: theme.palette.softMist
              }}
            />
          </View>
        </Card>

        <View style={{ marginTop: theme.spacing(2) }}>
          <Text
            style={[
              theme.typography.textVariants.title,
              { color: theme.colors.textPrimary }
            ]}
          >
            Lessons this week
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
            Tap a lesson to get the plan and track today&apos;s work.
          </Text>
        </View>

        <View style={{ marginTop: theme.spacing(1.5) }}>
          {weekContent.lessons.map((lesson) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              onPress={() => setSelectedLessonId(lesson.id)}
            />
          ))}
        </View>
      </ScreenContainer>

      <LessonDetailModal
        visible={Boolean(selectedLessonId)}
        lessonId={selectedLessonId}
        practiced={selectedLessonId ? detailPractice.practicedToday : false}
        notes={noteDraft}
        noteStatus={noteStatus}
        onClose={handleCloseModal}
        onTogglePractice={() => {
          if (selectedLessonId) {
            detailPractice.toggle();
          }
        }}
        onChangeNotes={handleNoteChange}
        onRetrySave={handleRetrySave}
        onOpenSupportTopic={handleOpenSupportTopic}
      />
    </>
  );
};

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center"
  }
});
