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
  Support: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  RootTabs: undefined;
  Week: {
    weekId: string;
  };
  Onboarding: undefined;
};
