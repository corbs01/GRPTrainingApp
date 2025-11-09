import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, TextInput, Pressable } from "react-native";
import {
  CompositeNavigationProp,
  RouteProp,
  useNavigation,
  useRoute
} from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { Card } from "@components/Card";
import { ScreenContainer } from "@components/ScreenContainer";
import {
  getSupportCategories,
  searchSupportLibrary,
  SupportCategory,
  SupportTip
} from "@data/index";
import { AppTheme, useTheme } from "@theme/index";
import { RootStackParamList, RootTabParamList } from "@app/navigation/types";

const createSupportStyles = (theme: AppTheme) =>
  StyleSheet.create({
    searchLabel: {
      ...theme.typography.textVariants.caption,
      color: theme.colors.textMuted,
      marginBottom: theme.spacing(0.5)
    },
    searchInput: {
      borderRadius: theme.radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: theme.spacing(1.5),
      paddingVertical: theme.spacing(1),
      color: theme.colors.textPrimary,
      ...theme.typography.textVariants.body
    },
    categoryContainer: {
      marginTop: theme.spacing(2)
    },
    categoryHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: theme.spacing(0.5)
    },
    categoryCopy: {
      flex: 1,
      marginRight: theme.spacing(1)
    },
    categoryTitle: {
      ...theme.typography.textVariants.title,
      color: theme.colors.textPrimary
    },
    categoryDescription: {
      ...theme.typography.textVariants.body,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing(0.5)
    },
    chevron: {
      ...theme.typography.textVariants.title,
      color: theme.colors.textSecondary
    },
    itemsContainer: {
      marginTop: theme.spacing(1)
    },
    itemWrapper: {
      marginTop: theme.spacing(1.5)
    },
    itemTitle: {
      ...theme.typography.textVariants.bodyStrong,
      color: theme.colors.textPrimary
    },
    itemSummary: {
      ...theme.typography.textVariants.body,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing(0.5)
    },
    itemSection: {
      marginTop: theme.spacing(1.25)
    },
    sectionLabel: {
      ...theme.typography.textVariants.caption,
      color: theme.colors.textMuted,
      letterSpacing: 0.4,
      textTransform: "uppercase"
    },
    sectionBody: {
      ...theme.typography.textVariants.body,
      color: theme.colors.textPrimary,
      marginTop: theme.spacing(0.25)
    },
    lessonLinkContainer: {
      marginTop: theme.spacing(1.5)
    },
    lessonLinkLabel: {
      ...theme.typography.textVariants.caption,
      color: theme.colors.textMuted
    },
    lessonChipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginTop: theme.spacing(0.5)
    },
    lessonChip: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.pill,
      paddingHorizontal: theme.spacing(1),
      paddingVertical: theme.spacing(0.5),
      marginTop: theme.spacing(0.5),
      marginRight: theme.spacing(0.75),
      backgroundColor: theme.colors.surface
    },
    lessonChipText: {
      ...theme.typography.textVariants.caption,
      color: theme.colors.primary,
      fontWeight: "600"
    },
    emptyCard: {
      marginTop: theme.spacing(3)
    },
    emptyTitle: {
      ...theme.typography.textVariants.title,
      color: theme.colors.textPrimary
    },
    emptyBody: {
      ...theme.typography.textVariants.body,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing(0.5)
    }
  });

type SupportStyles = ReturnType<typeof createSupportStyles>;

type SupportItemCardProps = {
  item: SupportTip;
  styles: SupportStyles;
  onOpenLesson: (lesson: SupportTip["relatedLessons"][number]) => void;
};

const SupportItemCard: React.FC<SupportItemCardProps> = ({ item, styles, onOpenLesson }) => {
  const sections: Array<{ label: string; text: string }> = [
    { label: "Do now", text: item.doNow },
    { label: "Prevent", text: item.prevent },
    { label: "Trainer tip", text: item.trainerTip }
  ];

  return (
    <View>
      <Text style={styles.itemTitle}>{item.title}</Text>
      <Text style={styles.itemSummary}>{item.summary}</Text>

      {sections.map((section) => (
        <View key={`${item.id}-${section.label}`} style={styles.itemSection}>
          <Text style={styles.sectionLabel}>{section.label}</Text>
          <Text style={styles.sectionBody}>{section.text}</Text>
        </View>
      ))}

      {item.relatedLessons.length > 0 ? (
        <View style={styles.lessonLinkContainer}>
          <Text style={styles.lessonLinkLabel}>Related lessons</Text>
          <View style={styles.lessonChipRow}>
            {item.relatedLessons.map((lesson) => (
              <Pressable
                key={lesson.id}
                style={styles.lessonChip}
                onPress={() => onOpenLesson(lesson)}
                accessibilityRole="button"
              >
                <Text style={styles.lessonChipText}>{lesson.title}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
};

type SupportCategorySectionProps = {
  category: SupportCategory;
  isExpanded: boolean;
  onToggle: (categoryId: string) => void;
  onOpenLesson: (lesson: SupportTip["relatedLessons"][number]) => void;
  highlightedItemId?: string | null;
  styles: SupportStyles;
};

type SupportScreenNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<RootTabParamList, "Support">,
  NativeStackNavigationProp<RootStackParamList>
>;
type SupportScreenRoute = RouteProp<RootTabParamList, "Support">;

const SupportCategorySection: React.FC<SupportCategorySectionProps> = ({
  category,
  isExpanded,
  onToggle,
  onOpenLesson,
  highlightedItemId,
  styles
}) => {
  return (
    <View style={styles.categoryContainer}>
      <Pressable
        onPress={() => onToggle(category.id)}
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded }}
      >
        <View style={styles.categoryHeader}>
          <View style={styles.categoryCopy}>
            <Text style={styles.categoryTitle}>{category.title}</Text>
            <Text style={styles.categoryDescription}>{category.description}</Text>
          </View>
          <Text style={styles.chevron}>{isExpanded ? "-" : "+"}</Text>
        </View>
      </Pressable>

      {isExpanded ? (
        <View style={styles.itemsContainer}>
          {category.items.map((item) => {
            const isFocused = highlightedItemId === item.id;
            return (
              <Card
                key={item.id}
                tone={isFocused ? "highlight" : "subtle"}
                style={styles.itemWrapper}
              >
                <SupportItemCard item={item} styles={styles} onOpenLesson={onOpenLesson} />
              </Card>
            );
          })}
        </View>
      ) : null}
    </View>
  );
};

export const SupportScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<SupportScreenNavigation>();
  const route = useRoute<SupportScreenRoute>();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const categories = useMemo(() => getSupportCategories(), []);
  const filteredCategories = useMemo<SupportCategory[]>(() => {
    if (!searchQuery.trim()) {
      return categories;
    }
    return searchSupportLibrary(searchQuery);
  }, [categories, searchQuery]);

  useEffect(() => {
    if (
      expandedCategoryId &&
      !filteredCategories.some((category) => category.id === expandedCategoryId)
    ) {
      setExpandedCategoryId(null);
    }
  }, [expandedCategoryId, filteredCategories]);

  const handleOpenLesson = useCallback(
    (lesson: SupportTip["relatedLessons"][number]) => {
      setHighlightedItemId(null);
      navigation.navigate("Week", {
        weekId: lesson.weekId,
        lessonId: lesson.id
      });
    },
    [navigation]
  );

  const handleToggleCategory = (categoryId: string) => {
    setExpandedCategoryId((current) => (current === categoryId ? null : categoryId));
  };

  const scrollToSupport = useCallback(
    (supportId: string) => {
      const category = categories.find((entry) =>
        entry.items.some((item) => item.id === supportId)
      );
      if (!category) {
        return;
      }

      setSearchQuery("");
      setExpandedCategoryId(category.id);
      setHighlightedItemId(supportId);
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
      highlightTimeoutRef.current = setTimeout(() => {
        setHighlightedItemId(null);
      }, 4000);
    },
    [categories]
  );

  useEffect(() => {
    const targetSupportId = route.params?.focusSupportId;
    if (!targetSupportId) {
      return;
    }
    scrollToSupport(targetSupportId);
    navigation.setParams({ focusSupportId: undefined });
  }, [navigation, route.params?.focusSupportId, scrollToSupport]);

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  const styles = useMemo(() => createSupportStyles(theme), [theme]);

  return (
    <ScreenContainer scrollable>
      <Text
        style={[
          theme.typography.textVariants.heading,
          { color: theme.colors.textPrimary, marginBottom: theme.spacing(2) }
        ]}
      >
        Support & Resources
      </Text>

      <Text style={styles.searchLabel}>Search guidelines</Text>
      <TextInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Try potty, crate, biting..."
        placeholderTextColor={theme.colors.textMuted}
        style={styles.searchInput}
        autoCorrect={false}
        autoCapitalize="none"
      />

      {filteredCategories.length === 0 ? (
        <Card tone="subtle" style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No matches yet</Text>
          <Text style={styles.emptyBody}>
            Try different keywords or open a category to explore trainer-approved tips.
          </Text>
        </Card>
      ) : (
        filteredCategories.map((category) => (
          <SupportCategorySection
            key={category.id}
            category={category}
            isExpanded={expandedCategoryId === category.id}
            onToggle={handleToggleCategory}
            onOpenLesson={handleOpenLesson}
            highlightedItemId={highlightedItemId}
            styles={styles}
          />
        ))
      )}
    </ScreenContainer>
  );
};
