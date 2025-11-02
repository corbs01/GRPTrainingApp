import React from "react";
import { View, StyleSheet, ScrollView, ViewProps } from "react-native";

import { useTheme } from "@theme/index";

type ScreenContainerProps = ViewProps & {
  scrollable?: boolean;
  children: React.ReactNode;
};

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  scrollable = false,
  style,
  ...rest
}) => {
  const theme = useTheme();
  const containerStyle = [
    styles.base,
    {
      backgroundColor: theme.colors.background
    },
    style
  ];

  if (scrollable) {
    return (
      <ScrollView contentContainerStyle={styles.scrollContent} style={containerStyle}>
        <View style={styles.inner}>{children}</View>
      </ScrollView>
    );
  }

  return (
    <View style={[containerStyle, styles.inner]} {...rest}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    flex: 1
  },
  inner: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 24
  },
  scrollContent: {
    flexGrow: 1
  }
});
