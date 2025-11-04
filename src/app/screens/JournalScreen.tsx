import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";

import { ScreenContainer } from "@components/ScreenContainer";
import { Button } from "@components/Button";
import { useTheme } from "@theme/index";
import {
  getAllWeeks,
  getWeekLessonSummaries,
  LessonSummary,
  WeekSummary
} from "@data/index";
import { useJournalStore, JournalEntry } from "@state/journalStore";

export const JournalScreen: React.FC = () => {
  const theme = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [entryText, setEntryText] = useState("");
  const [selectedWeekId, setSelectedWeekId] = useState<string>();
  const [selectedLessonId, setSelectedLessonId] = useState<string>();
  const [photoUri, setPhotoUri] = useState<string>();

  const entries = useJournalStore((state) => state.entries);
  const addEntry = useJournalStore((state) => state.addEntry);

  const weeks = useMemo<WeekSummary[]>(() => getAllWeeks(), []);
  const weekMap = useMemo(
    () => new Map(weeks.map((week) => [week.id, week])),
    [weeks]
  );
  const lessonsLookup = useMemo(() => {
    const map = new Map<string, Map<string, LessonSummary>>();
    weeks.forEach((week) => {
      const lessons = getWeekLessonSummaries(week.id);
      map.set(
        week.id,
        new Map(lessons.map((lesson) => [lesson.id, lesson]))
      );
    });
    return map;
  }, [weeks]);

  const weekOptions = useMemo(
    () =>
      weeks.map((week) => ({
        id: week.id,
        label: `Week ${week.number}`
      })),
    [weeks]
  );

  const sections = useMemo(() => {
    const grouped = new Map<
      string,
      { title: string; data: JournalEntry[]; week?: WeekSummary }
    >();
    const normalizedQuery = searchQuery.trim().toLowerCase();

    entries.forEach((entry) => {
      const week = weekMap.get(entry.weekId);
      const label = week
        ? `Week ${week.number} • ${week.title}`
        : "Unassigned Week";
      const matches =
        normalizedQuery.length === 0 ||
        label.toLowerCase().includes(normalizedQuery);
      if (!matches) {
        return;
      }

      const key = week?.id ?? "unassigned";
      const existing = grouped.get(key);
      if (existing) {
        existing.data.push(entry);
      } else {
        grouped.set(key, {
          title: label,
          week,
          data: [entry]
        });
      }
    });

    return Array.from(grouped.values())
      .map((section) => ({
        ...section,
        data: [...section.data].sort((a, b) => b.createdAt - a.createdAt)
      }))
      .sort((a, b) => (b.week?.number ?? 0) - (a.week?.number ?? 0));
  }, [entries, searchQuery, weekMap]);

  const lessonsForSelectedWeek = useMemo(() => {
    if (!selectedWeekId) {
      return [];
    }

    return Array.from(
      lessonsLookup.get(selectedWeekId)?.values() ?? []
    );
  }, [lessonsLookup, selectedWeekId]);

  const openModal = () => {
    setSelectedWeekId((prev) => prev ?? weeks[0]?.id);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEntryText("");
    setSelectedWeekId(undefined);
    setSelectedLessonId(undefined);
    setPhotoUri(undefined);
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission needed",
        "Media library access is required to attach a photo."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      quality: 0.8
    });

    if (!result.canceled && result.assets?.length > 0) {
      setPhotoUri(result.assets[0]?.uri);
    }
  };

  const handleSaveEntry = () => {
    const trimmed = entryText.trim();

    if (!selectedWeekId) {
      Alert.alert("Incomplete entry", "Please choose a training week.");
      return;
    }

    if (!trimmed) {
      Alert.alert("Empty entry", "Add some notes before saving.");
      return;
    }

    addEntry({
      weekId: selectedWeekId,
      lessonId: selectedLessonId,
      text: trimmed,
      photoUri
    });

    closeModal();
  };

  const renderSectionHeader = ({
    section
  }: {
    section: { title: string; week?: WeekSummary };
  }) => (
    <View
      style={[
        styles.sectionHeader,
        {
          borderColor: theme.colors.border
        }
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
  );

  const renderEntry = ({ item }: { item: JournalEntry }) => {
    const week = weekMap.get(item.weekId);
    const lessonTitle = item.lessonId
      ? lessonsLookup.get(item.weekId)?.get(item.lessonId)?.title
      : undefined;
    const createdAt = new Date(item.createdAt);
    const formattedDate = createdAt.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric"
    });

    return (
      <View
        style={[
          styles.entryCard,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border
          },
          theme.shadow.soft
        ]}
      >
        <View style={styles.entryHeader}>
          <Text
            style={[
              styles.entryWeek,
              { color: theme.colors.textSecondary }
            ]}
          >
            {week ? `Week ${week.number}` : "Unassigned"}
          </Text>
          <Text
            style={[
              styles.entryDate,
              { color: theme.colors.textMuted }
            ]}
          >
            {formattedDate}
          </Text>
        </View>
        {lessonTitle && (
          <View
            style={[
              styles.lessonTag,
              {
                backgroundColor: theme.palette.softMist,
                borderColor: theme.colors.border
              }
            ]}
          >
            <Feather
              name="bookmark"
              size={14}
              color={theme.colors.accent}
              style={styles.lessonIcon}
            />
            <Text
              style={[
                styles.lessonText,
                { color: theme.colors.textPrimary }
              ]}
            >
              {lessonTitle}
            </Text>
          </View>
        )}
        <Text
          style={[
            styles.entryText,
            { color: theme.colors.textPrimary }
          ]}
        >
          {item.text}
        </Text>
        {item.photoUri && (
          <Image
            source={{ uri: item.photoUri }}
            style={styles.entryImage}
          />
        )}
      </View>
    );
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <View style={styles.headingBlock}>
          <Text
            style={[
              styles.heading,
              { color: theme.colors.textPrimary }
            ]}
          >
            Daily Journal
          </Text>
          <Text
            style={[
              styles.body,
              { color: theme.colors.textSecondary }
            ]}
          >
            Log wins, challenges, and insights for each training lesson.
          </Text>
        </View>
        <Button
          label="Add Entry"
          icon={
            <Feather
              name="plus"
              size={18}
              color={theme.colors.onPrimary}
            />
          }
          onPress={openModal}
        />
      </View>

      <View
        style={[
          styles.searchBar,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border
          }
        ]}
      >
        <Feather
          name="search"
          size={18}
          color={theme.colors.textSecondary}
          style={styles.searchIcon}
        />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Filter by week (e.g. Week 10)"
          placeholderTextColor={theme.colors.textMuted}
          style={[
            styles.searchInput,
            { color: theme.colors.textPrimary }
          ]}
        />
      </View>

      {sections.length > 0 ? (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderSectionHeader={renderSectionHeader}
          renderItem={renderEntry}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Feather
            name="book-open"
            size={32}
            color={theme.colors.textSecondary}
            style={styles.emptyIcon}
          />
          <Text
            style={[
              styles.emptyHeading,
              { color: theme.colors.textPrimary }
            ]}
          >
            No journal entries yet
          </Text>
          <Text
            style={[
              styles.emptyBody,
              { color: theme.colors.textSecondary }
            ]}
          >
            Start tracking your progress by adding notes for a week or lesson.
          </Text>
        </View>
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.modalWrapper}
          >
            <View
              style={[
                styles.modalContent,
                { backgroundColor: theme.colors.card }
              ]}
            >
              <View style={styles.modalHeader}>
                <Text
                  style={[
                    styles.modalTitle,
                    { color: theme.colors.textPrimary }
                  ]}
                >
                  New Journal Entry
                </Text>
                <Pressable onPress={closeModal} hitSlop={16}>
                  <Feather
                    name="x"
                    size={22}
                    color={theme.colors.textSecondary}
                  />
                </Pressable>
              </View>
              <ScrollView
                contentContainerStyle={styles.modalScrollContent}
                showsVerticalScrollIndicator={false}
              >
                <Text
                  style={[
                    styles.label,
                    { color: theme.colors.textSecondary }
                  ]}
                >
                  Training Week
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipRow}
                >
                  {weekOptions.map((option) => {
                    const isSelected = selectedWeekId === option.id;
                    return (
                      <Pressable
                        key={option.id}
                        onPress={() => {
                          setSelectedWeekId(option.id);
                          setSelectedLessonId(undefined);
                        }}
                        style={[
                          styles.chip,
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
                            styles.chipText,
                            {
                              color: isSelected
                                ? theme.colors.onAccent
                                : theme.colors.textPrimary
                            }
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                {selectedWeekId && lessonsForSelectedWeek.length > 0 && (
                  <>
                    <Text
                      style={[
                        styles.label,
                        { color: theme.colors.textSecondary }
                      ]}
                    >
                      Lesson (optional)
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.chipRow}
                    >
                      {lessonsForSelectedWeek.map((lesson) => {
                        const isSelected =
                          selectedLessonId === lesson.id;
                        return (
                          <Pressable
                            key={lesson.id}
                            onPress={() =>
                              setSelectedLessonId(
                                isSelected ? undefined : lesson.id
                              )
                            }
                            style={[
                              styles.chip,
                              {
                                backgroundColor: isSelected
                                  ? theme.colors.secondary
                                  : theme.colors.surface,
                                borderColor: theme.colors.border
                              }
                            ]}
                          >
                            <Text
                              style={[
                                styles.chipText,
                                {
                                  color: isSelected
                                    ? theme.colors.onSecondary
                                    : theme.colors.textPrimary
                                }
                              ]}
                            >
                              {lesson.title}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  </>
                )}

                <Text
                  style={[
                    styles.label,
                    { color: theme.colors.textSecondary }
                  ]}
                >
                  Notes
                </Text>
                <TextInput
                  value={entryText}
                  onChangeText={setEntryText}
                  placeholder="What happened during training?"
                  placeholderTextColor={theme.colors.textMuted}
                  multiline
                  textAlignVertical="top"
                  style={[
                    styles.textArea,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.surface,
                      color: theme.colors.textPrimary
                    }
                  ]}
                />

                <View style={styles.photoRow}>
                  <Button
                    label={photoUri ? "Change Photo" : "Add Photo"}
                    variant="outline"
                    icon={
                      <Feather
                        name="image"
                        size={16}
                        color={theme.colors.textPrimary}
                      />
                    }
                    onPress={handlePickImage}
                  />
                  {photoUri && (
                    <Pressable
                      onPress={() => setPhotoUri(undefined)}
                      style={styles.clearPhoto}
                      hitSlop={16}
                    >
                      <Feather
                        name="trash-2"
                        size={18}
                        color={theme.colors.textSecondary}
                      />
                    </Pressable>
                  )}
                </View>
                {photoUri && (
                  <Image
                    source={{ uri: photoUri }}
                    style={styles.previewImage}
                  />
                )}
              </ScrollView>

              <View style={styles.modalActions}>
                <Button
                  label="Cancel"
                  variant="outline"
                  onPress={closeModal}
                  style={styles.modalActionButton}
                />
                <Button
                  label="Save Entry"
                  onPress={handleSaveEntry}
                  disabled={!selectedWeekId || entryText.trim().length === 0}
                  style={styles.modalActionButton}
                />
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16
  },
  headingBlock: {
    flex: 1,
    paddingRight: 16
  },
  heading: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 6
  },
  body: {
    fontSize: 16,
    lineHeight: 22
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12
  },
  searchIcon: {
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    fontSize: 16
  },
  listContent: {
    paddingBottom: 40
  },
  sectionHeader: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 4,
    marginTop: 16,
    marginBottom: 10
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600"
  },
  entryCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8
  },
  entryWeek: {
    fontSize: 14,
    fontWeight: "600"
  },
  entryDate: {
    fontSize: 12
  },
  lessonTag: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10
  },
  lessonIcon: {
    marginRight: 6
  },
  lessonText: {
    fontSize: 13,
    fontWeight: "600"
  },
  entryText: {
    fontSize: 15,
    lineHeight: 22
  },
  entryImage: {
    height: 160,
    borderRadius: 12,
    marginTop: 12
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60
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
    textAlign: "center",
    maxWidth: 240,
    lineHeight: 22
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end"
  },
  modalWrapper: {
    flex: 1,
    justifyContent: "flex-end"
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
    maxHeight: "92%"
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700"
  },
  modalScrollContent: {
    paddingBottom: 20
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8
  },
  chipRow: {
    flexDirection: "row",
    marginBottom: 12
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8
  },
  chipText: {
    fontSize: 14,
    fontWeight: "600"
  },
  textArea: {
    minHeight: 120,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 16
  },
  photoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12
  },
  clearPhoto: {
    padding: 8
  },
  previewImage: {
    height: 180,
    borderRadius: 16,
    marginBottom: 16
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  modalActionButton: {
    flex: 1,
    marginHorizontal: 4
  }
});
