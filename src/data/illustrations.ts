import { IllustrationKey, ILLUSTRATION_FALLBACK } from "@lib/illustrations";

const weekIllustrations: Record<string, IllustrationKey> = {
  week08: "homecoming",
  week09: "sit",
  week10: "leaveIt",
  week11: "recall",
  week12: "leash",
  week13: "stay",
  week14: "settle",
  week15: "looseLeash",
  week16: "doorway",
  week17: "vet",
  week18: "distraction",
  week19: "focus",
  week20: "independence"
};

const lessonIllustrations: Record<string, IllustrationKey> = {
  name_game: "homecoming",
  crate_love_1: "crate",
  potty_routine: "potty",
  gentle_mouth_1: "gentleMouth",
  handling_intro: "handling",
  sit: "sit",
  hand_touch: "handTarget",
  alone_time_1: "aloneTime",
  sound_socialization: "sound",
  down_1: "down",
  leave_it_1: "leaveIt",
  cat_intro_1: "catIntro",
  recall_1: "recall",
  trade_game: "trade",
  crate_love_2: "crate",
  harness_intro: "leash",
  leash_indoors_1: "leash",
  calm_greetings_1: "greetings",
  stay_foundations: "stay",
  recall_2: "recall",
  handling_grooming_2: "grooming",
  stay_duration: "stay",
  settle_mat_intro: "settle",
  recall_games: "recall",
  loose_leash_1: "looseLeash",
  leave_it_2: "leaveIt",
  settle_mat_build: "settle",
  doorway_manners: "doorway",
  loose_leash_2_prep: "looseLeash",
  leave_it_food: "leaveIt",
  vet_prep: "vet",
  cat_supervised_1: "catSupervision",
  handling_muzzle_touch: "muzzle",
  distraction_work_1: "distraction",
  alone_time_2: "aloneTime",
  greetings_2: "greetings",
  loose_leash_outdoors: "looseLeash",
  focus_near_dogs: "focus",
  settle_public: "settle",
  distraction_work_2: "distraction",
  doorway_manners_advanced: "doorway",
  independence_home: "independence"
};

export const getWeekIllustrationKey = (weekId: string): IllustrationKey =>
  weekIllustrations[weekId] ?? ILLUSTRATION_FALLBACK;

export const getLessonIllustrationKey = (lessonId: string): IllustrationKey =>
  lessonIllustrations[lessonId] ?? ILLUSTRATION_FALLBACK;
