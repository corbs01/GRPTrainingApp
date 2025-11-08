import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useContentStatus } from "@lib/useContentStatus";
import { useTheme } from "@theme/index";

export const ContentValidationBanner: React.FC = () => {
  const theme = useTheme();
  const { top } = useSafeAreaInsets();
  const status = useContentStatus();

  if (!status.initialized || status.valid || status.errors.length === 0) {
    return null;
  }

  const message = status.errors[0];

  return (
    <View
      pointerEvents="none"
      style={[
        styles.banner,
        {
          top: top + theme.spacing(1),
          backgroundColor: theme.colors.error ?? "#C62828",
          borderColor: (theme.colors.onError ?? theme.colors.surface) + "33"
        }
      ]}
    >
      <Text
        style={[
          styles.title,
          { color: theme.colors.onError ?? theme.colors.surface }
        ]}
      >
        Training content issue
      </Text>
      <Text
        style={[
          styles.body,
          { color: theme.colors.onError ?? theme.colors.surface }
        ]}
      >
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    left: 16,
    right: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    zIndex: 1000,
    elevation: 6,
    shadowColor: "rgba(0,0,0,0.2)",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }
  },
  title: {
    fontFamily: "Nunito_700Bold",
    fontSize: 15,
    marginBottom: 4
  },
  body: {
    fontFamily: "Inter_400Regular",
    fontSize: 13
  }
});
