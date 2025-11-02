import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  useFonts,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold
} from "@expo-google-fonts/nunito";

import { ThemeProvider, lightTheme } from "@theme/index";
import { AppNavigator } from "@app/navigation";

const App: React.FC = () => {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold
  });

  if (!fontsLoaded) {
    return (
      <View style={[styles.loader, { backgroundColor: lightTheme.colors.background }]}>
        <ActivityIndicator size="large" color={lightTheme.colors.accent} />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <AppNavigator />
      </SafeAreaProvider>
    </ThemeProvider>
  );
};

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  }
});

export default App;
