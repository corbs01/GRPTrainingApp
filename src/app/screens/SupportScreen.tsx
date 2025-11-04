import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TextInput, Pressable } from "react-native";

import { Card } from "@components/Card";
import { ScreenContainer } from "@components/ScreenContainer";
import {
  getSupportCategories,
  searchSupportLibrary,
  SupportCategory,
  SupportTip
} from "@data/index";
import { AppTheme, useTheme } from "@theme/index";

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
    tipRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginTop: theme.spacing(0.75)
    },
    tipBullet: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.primary,
      marginTop: theme.spacing(0.75)
    },
    tipText: {
      ...theme.typography.textVariants.body,
      color: theme.colors.textPrimary,
      flex: 1,
      marginLeft: theme.spacing(1)
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
};

const SupportItemCard: React.FC<SupportItemCardProps> = ({ item, styles }) => (
  <View>
    <Text style={styles.itemTitle}>{item.title}</Text>
    <Text style={styles.itemSummary}>{item.summary}</Text>

    {item.tips.map((tip) => (
      <View key={tip} style={styles.tipRow}>
        <View style={styles.tipBullet} />
        <Text style={styles.tipText}>{tip}</Text>
      </View>
    ))}
  </View>
);

type SupportCategorySectionProps = {
  category: SupportCategory;
  isExpanded: boolean;
  onToggle: (categoryId: string) => void;
  styles: SupportStyles;
};

const SupportCategorySection: React.FC<SupportCategorySectionProps> = ({
  category,
  isExpanded,
  onToggle,
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
          {category.items.map((item) => (
            <Card key={item.id} tone="subtle" style={styles.itemWrapper}>
              <SupportItemCard item={item} styles={styles} />
            </Card>
          ))}
        </View>
      ) : null}
    </View>
  );
};

export const SupportScreen: React.FC = () => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);

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

  const handleToggleCategory = (categoryId: string) => {
    setExpandedCategoryId((current) => (current === categoryId ? null : categoryId));
  };

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
            styles={styles}
          />
        ))
      )}
    </ScreenContainer>
  );
};
