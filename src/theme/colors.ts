export const palette = {
  pastelBeige: "#F5E9DA",
  sage: "#B7C7A5",
  mistBlue: "#C6DAE6",
  sand: "#E8D3B9",
  charcoal: "#2F3538",
  cream: "#FFFBF4",
  softSage: "#D8E6CF",
  softMist: "#DCE9F1",
  warmHighlight: "#F9E2C3",
  white: "#FFFFFF"
} as const;

export const themeColors = {
  background: palette.pastelBeige,
  surface: palette.cream,
  card: palette.cream,
  primary: palette.sage,
  primarySoft: palette.softSage,
  secondary: palette.mistBlue,
  accent: palette.sand,
  textPrimary: palette.charcoal,
  textSecondary: "#5F686C",
  textMuted: "#7C868A",
  onPrimary: "#1F2A22",
  onSecondary: "#213037",
  onAccent: "#2B2418",
  error: "#C85C5C",
  onError: "#FFF8F6",
  border: "#E6D7C6",
  overlay: "rgba(47, 53, 56, 0.08)",
  success: "#9CC4A5",
  warning: "#E6C188"
} as const;
