import React from "react";
import { NavigationContainer, DefaultTheme, Theme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { ActivityIndicator, View } from "react-native";

import {
  HomeScreen,
  WeekScreen,
  TimelineScreen,
  JournalScreen,
  GalleryScreen,
  SupportScreen,
  SettingsScreen,
  OnboardingScreen,
  EditPuppyProfile,
  PrivacyModal,
  FeedbackModal
} from "@app/screens";
import { useTheme } from "@theme/index";
import { usePuppyStore } from "@state/puppyStore";
import { RootStackParamList, RootTabParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();

const TabNavigator = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border
        },
        tabBarIcon: ({ color, size }) => {
          const iconName = tabIcon(route.name);
          return <Feather name={iconName} size={size} color={color} />;
        }
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Timeline" component={TimelineScreen} />
      <Tab.Screen name="Journal" component={JournalScreen} />
      <Tab.Screen name="Gallery" component={GalleryScreen} />
      <Tab.Screen name="Support" component={SupportScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  const theme = useTheme();
  const hydrated = usePuppyStore((state) => state.hydrated);
  const hasPuppy = usePuppyStore((state) => Boolean(state.puppy));
  const navigationTheme = React.useMemo<Theme>(
    () => ({
      ...DefaultTheme,
      colors: {
        ...DefaultTheme.colors,
        background: theme.colors.background,
        primary: theme.colors.accent,
        card: theme.colors.card,
        text: theme.colors.textPrimary,
        border: theme.colors.border
      }
    }),
    [theme]
  );

  if (!hydrated) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        initialRouteName={hasPuppy ? "RootTabs" : "Onboarding"}
        screenOptions={{
          headerTintColor: theme.colors.textPrimary,
          headerStyle: {
            backgroundColor: theme.colors.card
          }
        }}
      >
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{
            headerShown: false
          }}
        />
        <Stack.Screen name="RootTabs" component={TabNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="Week" component={WeekScreen} options={{ title: "Training Week" }} />
        <Stack.Screen
          name="EditPuppyProfile"
          component={EditPuppyProfile}
          options={{
            title: "Edit Puppy Profile"
          }}
        />
        <Stack.Screen
          name="PrivacyModal"
          component={PrivacyModal}
          options={{
            title: "Privacy & Data",
            presentation: "modal"
          }}
        />
        <Stack.Screen
          name="FeedbackModal"
          component={FeedbackModal}
          options={{
            title: "Feedback",
            presentation: "modal"
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const tabIcon = (routeName: keyof RootTabParamList) => {
  switch (routeName) {
    case "Home":
      return "home";
    case "Timeline":
      return "clock";
    case "Journal":
      return "edit-3";
    case "Gallery":
      return "image";
    case "Support":
      return "life-buoy";
    case "Settings":
      return "settings";
    default:
      return "circle";
  }
};
