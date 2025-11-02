export const palette = {
  blushPink: "#F7D6E0",
  butterYellow: "#FFF5C3",
  seaFoam: "#CBE8E0",
  skyBlue: "#C7E4FF",
  lavender: "#E1D4F7",
  clay: "#E6C9A8",
  charcoal: "#3F4246",
  white: "#FFFFFF",
  offWhite: "#F9F7F2"
} as const;

export const themeColors = {
  background: palette.offWhite,
  card: palette.white,
  accent: palette.skyBlue,
  primary: palette.lavender,
  secondary: palette.seaFoam,
  textPrimary: palette.charcoal,
  textSecondary: "#6F7377",
  border: "#E3E1DC"
} as const;
