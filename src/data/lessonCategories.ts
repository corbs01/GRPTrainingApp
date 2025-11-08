export type LessonCategory = "foundation" | "lifeManners" | "socialization";

const LESSON_CATEGORY_MAP: Record<string, LessonCategory[]> = {
  name_game: ["foundation"],
  crate_love_1: ["lifeManners"],
  potty_routine: ["lifeManners"],
  gentle_mouth_1: ["lifeManners"],
  handling_intro: ["socialization"],
  sit: ["foundation"],
  hand_touch: ["foundation"],
  alone_time_1: ["lifeManners"],
  sound_socialization: ["socialization"],
  down_1: ["foundation"],
  leave_it_1: ["foundation"],
  cat_intro_1: ["socialization"],
  recall_1: ["foundation"],
  trade_game: ["lifeManners"],
  crate_love_2: ["lifeManners"],
  harness_intro: ["lifeManners"],
  leash_indoors_1: ["foundation"],
  calm_greetings_1: ["lifeManners"],
  stay_foundations: ["foundation"],
  recall_2: ["foundation"],
  handling_grooming_2: ["socialization"],
  stay_duration: ["foundation"],
  settle_mat_intro: ["lifeManners"],
  recall_games: ["foundation"],
  loose_leash_1: ["foundation"],
  leave_it_2: ["foundation"],
  settle_mat_build: ["lifeManners"],
  doorway_manners: ["lifeManners"],
  loose_leash_2_prep: ["foundation"],
  leave_it_food: ["foundation", "lifeManners"],
  vet_prep: ["socialization"],
  cat_supervised_1: ["socialization"],
  handling_muzzle_touch: ["socialization"],
  distraction_work_1: ["foundation"],
  alone_time_2: ["lifeManners"],
  greetings_2: ["lifeManners"],
  loose_leash_outdoors: ["foundation"],
  focus_near_dogs: ["foundation", "socialization"],
  settle_public: ["lifeManners"],
  distraction_work_2: ["foundation"],
  doorway_manners_advanced: ["lifeManners"],
  independence_home: ["lifeManners"],
  park_loose_leash_layers: ["foundation"],
  focus_ping_pong: ["foundation"],
  focus_then_move_game: ["foundation"]
};

export const getLessonCategories = (lessonId: string): LessonCategory[] =>
  LESSON_CATEGORY_MAP[lessonId] ?? [];

export const hasLessonCategory = (lessonId: string, category: LessonCategory): boolean =>
  getLessonCategories(lessonId).includes(category);
