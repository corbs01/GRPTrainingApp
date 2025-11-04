import React, { useMemo, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { ScreenContainer } from "@components/ScreenContainer";
import { Button } from "@components/Button";
import { useTheme } from "@theme/index";
import { getAllWeeks, getWeekLessonSummaries, WeekSummary } from "@data/index";
import { useJournalStore, JournalEntry } from "@state/journalStore";

const columns = 3;

type GallerySection = {
  key: string;
  title: string;
  week?: WeekSummary;
  items: JournalEntry[];
};

export const GalleryScreen: React.FC = () => {
  const theme = useTheme();
  const [selectedWeek, setSelectedWeek] = useState<string | "all">("all");
  const [activeEntry, setActiveEntry] = useState<JournalEntry | null>(null);

  const entries = useJournalStore((state) => state.entries);

  const weeks = useMemo(() => getAllWeeks(), []);
  const weekMap = useMemo(
    () => new Map(weeks.map((week) => [week.id, week])),
    [weeks]
  );
  const lessonsLookup = useMemo(() => {
    const map = new Map<string, Map<string, string>>();
    weeks.forEach((week) => {
      const lessons = getWeekLessonSummaries(week.id);
      map.set(
        week.id,
        new Map(lessons.map((lesson) => [lesson.id, lesson.title]))
      );
    });
    return map;
  }, [weeks]);

  const sections = useMemo<GallerySection[]>(() => {
    const withPhotos = entries.filter((entry) => Boolean(entry.photoUri));
    const filtered =
      selectedWeek === "all"
        ? withPhotos
        : withPhotos.filter((entry) => entry.weekId === selectedWeek);

    const grouped = new Map<string, GallerySection>();
    filtered.forEach((entry) => {
      const week = weekMap.get(entry.weekId);
      const key = week?.id ?? "unassigned";
      const title = week
        ? `Week ${week.number} • ${week.title}`
        : "Unassigned Week";
      const next = grouped.get(key);
      if (next) {
        next.items.push(entry);
      } else {
        grouped.set(key, {
          key,
          title,
          week,
          items: [entry]
        });
      }
    });

    return Array.from(grouped.values())
      .map((section) => ({
        ...section,
        items: [...section.items].sort((a, b) => b.createdAt - a.createdAt)
      }))
      .sort((a, b) => (b.week?.number ?? 0) - (a.week?.number ?? 0));
  }, [entries, selectedWeek, weekMap]);

  const weekFilters = useMemo(
    () => [
      { value: "all" as const, label: "All Photos" },
      ...weeks.map((week) => ({
        value: week.id,
        label: `Week ${week.number}`
      }))
    ],
    [weeks]
  );

  const renderSection = (section: GallerySection) => (
    <View key={section.key} style={styles.section}>
      <View
        style={[
          styles.sectionHeader,
          { borderColor: theme.colors.border }
        ]}
      >
        <Text
          style={[
            styles.sectionTitle,
            { color: theme.colors.textPrimary }
          ]}
        >
          {section.title}
        </Text>
      </View>
      <View style={styles.grid}>
        {section.items.map((entry, index) => {
          const isLastInRow = (index + 1) % columns === 0;
          return (
            <Pressable
              key={entry.id}
              onPress={() => setActiveEntry(entry)}
              style={[
                styles.photoTile,
                !isLastInRow && styles.photoTileSpacing
              ]}
            >
              <Image
                source={{ uri: entry.photoUri }}
                style={[
                  styles.photo,
                  { borderColor: theme.colors.border }
                ]}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  const lessonTitle = (entry: JournalEntry) =>
    entry.lessonId
      ? lessonsLookup.get(entry.weekId)?.get(entry.lessonId)
      : undefined;

  const activeWeek = activeEntry ? weekMap.get(activeEntry.weekId) : undefined;

  return (
    <ScreenContainer scrollable>
      <Text
        style={[
          styles.heading,
          { color: theme.colors.textPrimary }
        ]}
      >
        Gallery
      </Text>
      <Text
        style={[
          styles.body,
          { color: theme.colors.textSecondary }
        ]}
      >
        A visual scrapbook of your training journey, organized by week.
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {weekFilters.map((filter) => {
          const isSelected = selectedWeek === filter.value;
          return (
            <Pressable
              key={filter.value}
              onPress={() => setSelectedWeek(filter.value)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isSelected
                    ? theme.colors.accent
                    : theme.colors.surface,
                  borderColor: theme.colors.border
                }
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  {
                    color: isSelected
                      ? theme.colors.onAccent
                      : theme.colors.textPrimary
                  }
                ]}
              >
                {filter.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {sections.length > 0 ? (
        sections.map(renderSection)
      ) : (
        <View style={styles.emptyState}>
          <Feather
            name="image"
            size={36}
            color={theme.colors.textSecondary}
            style={styles.emptyIcon}
          />
          <Text
            style={[
              styles.emptyHeading,
              { color: theme.colors.textPrimary }
            ]}
          >
            No photos yet
          </Text>
          <Text
            style={[
              styles.emptyBody,
              { color: theme.colors.textSecondary }
            ]}
          >
            Add a photo while creating a journal entry to build your gallery.
          </Text>
        </View>
      )}

      <Modal
        visible={Boolean(activeEntry)}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveEntry(null)}
      >
        <View style={styles.lightboxBackdrop}>
          <View
            style={[
              styles.lightboxCard,
              { backgroundColor: theme.colors.card }
            ]}
          >
            <View style={styles.lightboxHeader}>
              <View>
                <Text
                  style={[
                    styles.lightboxTitle,
                    { color: theme.colors.textPrimary }
                  ]}
                >
                  {activeWeek
                    ? `Week ${activeWeek.number}`
                    : "Training Moment"}
                </Text>
                {activeEntry && (
                  <Text
                    style={[
                      styles.lightboxSub,
                      { color: theme.colors.textSecondary }
                    ]}
                  >
                    {lessonTitle(activeEntry) ?? "Captured in your journal"}
                  </Text>
                )}
              </View>
              <Pressable onPress={() => setActiveEntry(null)} hitSlop={16}>
                <Feather
                  name="x"
                  size={22}
                  color={theme.colors.textSecondary}
                />
              </Pressable>
            </View>
            {activeEntry && (
              <>
                <Image
                  source={{ uri: activeEntry.photoUri }}
                  style={[
                    styles.lightboxImage,
                    { borderColor: theme.colors.border }
                  ]}
                />
                <ScrollView
                  style={styles.lightboxScroll}
                  showsVerticalScrollIndicator={false}
                >
                  <Text
                    style={[
                      styles.lightboxText,
                      { color: theme.colors.textPrimary }
                    ]}
                  >
                    {activeEntry.text}
                  </Text>
                </ScrollView>
              </>
            )}
            <Button
              label="Close"
              variant="outline"
              onPress={() => setActiveEntry(null)}
            />
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  heading: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 10
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 16
  },
  filterRow: {
    flexDirection: "row",
    marginBottom: 20
  },
  filterChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8
  },
  filterText: {
    fontSize: 14,
    fontWeight: "600"
  },
  section: {
    marginBottom: 24
  },
  sectionHeader: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 6,
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600"
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginRight: -8
  },
  photoTile: {
    width: "31%",
    aspectRatio: 1,
    marginBottom: 12
  },
  photoTileSpacing: {
    marginRight: 8
  },
  photo: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60
  },
  emptyIcon: {
    marginBottom: 12
  },
  emptyHeading: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 6
  },
  emptyBody: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 240
  },
  lightboxBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    paddingHorizontal: 20
  },
  lightboxCard: {
    borderRadius: 20,
    padding: 18,
    maxHeight: "80%"
  },
  lightboxHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12
  },
  lightboxTitle: {
    fontSize: 20,
    fontWeight: "700"
  },
  lightboxSub: {
    fontSize: 14,
    marginTop: 2
  },
  lightboxImage: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12
  },
  lightboxScroll: {
    marginBottom: 16
  },
  lightboxText: {
    fontSize: 15,
    lineHeight: 22
  }
});
