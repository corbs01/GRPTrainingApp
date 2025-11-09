import { NavigatorScreenParams } from "@react-navigation/native";

export type RootTabParamList = {
  Home: undefined;
  Timeline: undefined;
  Journal:
    | {
        quickAdd?: boolean;
        weekId?: string;
        lessonId?: string;
      }
    | undefined;
  Gallery: undefined;
  Support:
    | {
        focusSupportId?: string;
      }
    | undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  RootTabs: NavigatorScreenParams<RootTabParamList> | undefined;
  Week: {
    weekId: string;
    lessonId?: string;
  };
  Onboarding: undefined;
  EditPuppyProfile: undefined;
  PrivacyModal: undefined;
  FeedbackModal: undefined;
};
