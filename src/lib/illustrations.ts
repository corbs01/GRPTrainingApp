import type { ImageSourcePropType } from "react-native";

const illustrationSources = {
  default: require("@assets/illustrations/default.png"),
  homecoming: require("@assets/illustrations/homecoming.png"),
  crate: require("@assets/illustrations/crate.png"),
  potty: require("@assets/illustrations/potty.png"),
  gentleMouth: require("@assets/illustrations/gentle-mouth.png"),
  handling: require("@assets/illustrations/handling.png"),
  sit: require("@assets/illustrations/sit.png"),
  handTarget: require("@assets/illustrations/hand-target.png"),
  aloneTime: require("@assets/illustrations/alone-time.png"),
  sound: require("@assets/illustrations/sound.png"),
  down: require("@assets/illustrations/down.png"),
  leaveIt: require("@assets/illustrations/leave-it.png"),
  catIntro: require("@assets/illustrations/cat-intro.png"),
  recall: require("@assets/illustrations/recall.png"),
  trade: require("@assets/illustrations/trade.png"),
  leash: require("@assets/illustrations/leash.png"),
  greetings: require("@assets/illustrations/greetings.png"),
  stay: require("@assets/illustrations/stay.png"),
  grooming: require("@assets/illustrations/grooming.png"),
  settle: require("@assets/illustrations/settle.png"),
  looseLeash: require("@assets/illustrations/loose-leash.png"),
  doorway: require("@assets/illustrations/doorway.png"),
  focus: require("@assets/illustrations/focus.png"),
  vet: require("@assets/illustrations/vet.png"),
  catSupervision: require("@assets/illustrations/cat-supervision.png"),
  muzzle: require("@assets/illustrations/muzzle.png"),
  distraction: require("@assets/illustrations/distraction.png"),
  independence: require("@assets/illustrations/independence.png")
} as const satisfies Record<string, ImageSourcePropType>;

export type IllustrationKey = keyof typeof illustrationSources;

export const ILLUSTRATION_FALLBACK: IllustrationKey = "default";

export const isIllustrationKey = (input: string): input is IllustrationKey =>
  Object.prototype.hasOwnProperty.call(illustrationSources, input);

export const getIllustrationSource = (key?: string | null): ImageSourcePropType => {
  if (!key || !isIllustrationKey(key)) {
    return illustrationSources[ILLUSTRATION_FALLBACK];
  }
  return illustrationSources[key];
};

export const getAvailableIllustrationKeys = (): IllustrationKey[] =>
  Object.keys(illustrationSources) as IllustrationKey[];

export default illustrationSources;
