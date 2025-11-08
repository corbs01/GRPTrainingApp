import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { ScreenContainer } from "@components/ScreenContainer";
import { Button } from "@components/Button";
import { useTheme } from "@theme/index";
import { getAllWeeks, getWeekLessonSummaries } from "@data/index";
import { useJournalStore, JournalEntry } from "@state/journalStore";
import { deleteJournalMedia } from "@lib/media";

const columns = 3;
const ITEM_GAP = 8;

export const GalleryScreen: React.FC = () => {
  const theme = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const [selectedWeek, setSelectedWeek] = useState<string | "all">("all");
  const [selectedLesson, setSelectedLesson] = useState<string | "all">("all");
  const [activeEntry, setActiveEntry] = useState<JournalEntry | null>(null);

  const entries = useJournalStore((state) => state.entries);
  const stripMediaByUri = useJournalStore((state) => state.stripMediaByUri);

  const weeks = useMemo(() => getAllWeeks(), []);
  const weekMap = useMemo(() => new Map(weeks.map((week) => [week.id, week])), [weeks]);
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

  useEffect(() => {
    if (selectedWeek === "all") {
      setSelectedLesson("all");
      return;
    }
    if (selectedLesson === "all") {
      return;
    }
    const lessonExists = lessonsLookup.get(selectedWeek)?.has(selectedLesson);
    if (!lessonExists) {
      setSelectedLesson("all");
    }
  }, [lessonsLookup, selectedLesson, selectedWeek]);

  const weekFilters = useMemo(
    () => [
      { value: "all" as const, label: "All weeks" },
      ...weeks.map((week) => ({
        value: week.id,
        label: `Week ${week.number}`
      }))
    ],
    [weeks]
  );

  const lessonFilters = useMemo(() => {
    if (selectedWeek === "all") {
      return [];
    }
    const map = lessonsLookup.get(selectedWeek);
    if (!map) {
      return [];
    }
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [lessonsLookup, selectedWeek]);

  const filteredEntries = useMemo(() => {
    return entries
      .filter((entry) => Boolean(entry.photoUri))
      .filter((entry) => (selectedWeek === "all" ? true : entry.weekId === selectedWeek))
      .filter((entry) => (selectedLesson === "all" ? true : entry.lessonId === selectedLesson))
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [entries, selectedLesson, selectedWeek]);

  const availableWidth = useMemo(() => Math.max(windowWidth - 40, 200), [windowWidth]);
  const itemSize = useMemo(
    () => (availableWidth - ITEM_GAP * (columns - 1)) / columns,
    [availableWidth]
  );
  const rowHeight = itemSize + ITEM_GAP;

  const lessonTitle = useCallback(
    (entry: JournalEntry) =>
      entry.lessonId
        ? lessonsLookup.get(entry.weekId)?.get(entry.lessonId)
        : undefined,
    [lessonsLookup]
  );

  const activeWeek = activeEntry ? weekMap.get(activeEntry.weekId) : undefined;

  const getItemLayout = useCallback(
    (_: unknown, index: number) => {
      const row = Math.floor(index / columns);
      return {
        length: rowHeight,
        offset: row * rowHeight,
        index
      };
    },
    [rowHeight]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: JournalEntry; index: number }) => {
      const isLastInRow = (index + 1) % columns === 0;
      const sourceUri = item.thumbnailUri ?? item.photoUri;
      if (!sourceUri) {
        return null;
      }
      return (
        <Pressable
          onPress={() => setActiveEntry(item)}
          style={[
            styles.photoTile,
            {
              width: itemSize,
              height: itemSize,
              marginRight: isLastInRow ? 0 : ITEM_GAP,
              marginBottom: ITEM_GAP
            }
          ]}
        >
          <Image
            source={{ uri: sourceUri }}
            style={[
              styles.photo,
              {
                borderColor: theme.colors.border
              }
            ]}
          />
        </Pressable>
      );
    },
    [itemSize, theme.colors.border]
  );

  const handleDeleteActivePhoto = useCallback(() => {
    if (!activeEntry?.photoUri) {
      return;
    }
    const photoUri = activeEntry.photoUri;
    const thumbnailUri = activeEntry.thumbnailUri;
    Alert.alert(
      "Remove photo?",
      "This deletes the media from every journal entry that references it.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            stripMediaByUri(photoUri);
            void deleteJournalMedia(photoUri);
            void deleteJournalMedia(thumbnailUri);
            setActiveEntry(null);
          }
        }
      ]
    );
  }, [activeEntry, stripMediaByUri]);

  const listHeader = (
    <View style={styles.listHeader}>
      <Text style={[styles.heading, { color: theme.colors.textPrimary }]}>Gallery</Text>
      <Text style={[styles.body, { color: theme.colors.textSecondary }]}>
        A visual scrapbook of your training journey. Use filters to jump to a week or lesson.
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
                  backgroundColor: isSelected ? theme.colors.accent : theme.colors.surface,
                  borderColor: theme.colors.border
                }
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  {
                    color: isSelected ? theme.colors.onAccent : theme.colors.textPrimary
                  }
                ]}
              >
                {filter.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {selectedWeek !== "all" && lessonFilters.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          <Pressable
            key="lesson-all"
            onPress={() => setSelectedLesson("all")}
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  selectedLesson === "all" ? theme.colors.secondary : theme.colors.surface,
                borderColor: theme.colors.border
              }
            ]}
          >
            <Text
              style={[
                styles.filterText,
                {
                  color: selectedLesson === "all" ? theme.colors.onSecondary : theme.colors.textPrimary
                }
              ]}
            >
              All lessons
            </Text>
          </Pressable>
          {lessonFilters.map((lesson) => {
            const isSelected = selectedLesson === lesson.id;
            return (
              <Pressable
                key={lesson.id}
                onPress={() => setSelectedLesson(lesson.id)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected ? theme.colors.secondary : theme.colors.surface,
                    borderColor: theme.colors.border
                  }
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    {
                      color: isSelected ? theme.colors.onSecondary : theme.colors.textPrimary
                    }
                  ]}
                >
                  {lesson.title}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}
    </View>
  );

  return (
    <ScreenContainer>
      <FlatList
        data={filteredEntries}
        numColumns={columns}
        renderItem={renderItem}
        style={{ flex: 1 }}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather
              name="image"
              size={36}
              color={theme.colors.textSecondary}
              style={styles.emptyIcon}
            />
            <Text style={[styles.emptyHeading, { color: theme.colors.textPrimary }]}>No photos yet</Text>
            <Text style={[styles.emptyBody, { color: theme.colors.textSecondary }]}>
              Add a photo while writing a journal entry to build your gallery.
            </Text>
          </View>
        }
        getItemLayout={getItemLayout}
        initialNumToRender={18}
        windowSize={5}
        maxToRenderPerBatch={columns * 4}
        removeClippedSubviews
        contentContainerStyle={{ paddingBottom: 32, paddingTop: 12 }}
      />

      <Modal
        visible={Boolean(activeEntry)}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveEntry(null)}
      >
        <View style={styles.lightboxBackdrop}>
          <View style={[styles.lightboxCard, { backgroundColor: theme.colors.card }]}>
            <View style={styles.lightboxHeader}>
              <View>
                <Text style={[styles.lightboxTitle, { color: theme.colors.textPrimary }]}>
                  {activeWeek ? `Week ${activeWeek.number}` : "Training moment"}
                </Text>
                {activeEntry && (
                  <Text style={[styles.lightboxSub, { color: theme.colors.textSecondary }]}>
                    {lessonTitle(activeEntry) ?? "Captured in your journal"}
                  </Text>
                )}
              </View>
              <Pressable onPress={() => setActiveEntry(null)} hitSlop={16}>
                <Feather name="x" size={22} color={theme.colors.textSecondary} />
              </Pressable>
            </View>
            {activeEntry && (
              <>
                <Image
                  source={{ uri: activeEntry.photoUri }}
                  style={[styles.lightboxImage, { borderColor: theme.colors.border }]}
                />
                <ScrollView style={styles.lightboxScroll} showsVerticalScrollIndicator={false}>
                  <Text style={[styles.lightboxText, { color: theme.colors.textPrimary }]}>
                    {activeEntry.text}
                  </Text>
                </ScrollView>
                <Pressable
                  onPress={handleDeleteActivePhoto}
                  style={[styles.deleteButton, { borderColor: theme.colors.warning }]}
                >
                  <Feather name="trash-2" size={16} color={theme.colors.warning} style={{ marginRight: 6 }} />
                  <Text style={[styles.deleteText, { color: theme.colors.warning }]}>Remove photo</Text>
                </Pressable>
              </>
            )}
            <Button label="Close" variant="outline" onPress={() => setActiveEntry(null)} />
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  listHeader: {
    marginBottom: 16
  },
  heading: {
    fontSize: 26,
    fontWeight: "700"
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
    marginTop: 8
  },
  filterRow: {
    flexDirection: "row",
    marginTop: 16
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
  photoTile: {
    borderRadius: 14,
    overflow: "hidden"
  },
  photo: {
    flex: 1,
    borderRadius: 14,
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
    maxHeight: "85%"
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
    marginBottom: 12
  },
  lightboxText: {
    fontSize: 15,
    lineHeight: 22
  },
  deleteButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginBottom: 12
  },
  deleteText: {
    fontSize: 14,
    fontWeight: "600"
  }
});
