import { TextStyle } from "react-native";

const fontFamily = {
  nunito: {
    regular: "Nunito_400Regular",
    semiBold: "Nunito_600SemiBold",
    bold: "Nunito_700Bold",
    extraBold: "Nunito_800ExtraBold"
  },
  inter: {
    regular: "Inter_400Regular",
    medium: "Inter_500Medium",
    semiBold: "Inter_600SemiBold"
  }
} as const;

const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  display: 34
} as const;

const lineHeight = {
  tight: 18,
  snug: 22,
  normal: 24,
  relaxed: 28,
  loose: 34
} as const;

const letterSpacing = {
  tight: -0.5,
  normal: 0,
  relaxed: 0.25
} as const;

const textVariants: Record<string, TextStyle> = {
  display: {
    fontFamily: fontFamily.nunito.extraBold,
    fontSize: fontSize.display,
    lineHeight: 40,
    letterSpacing: letterSpacing.tight
  },
  heading: {
    fontFamily: fontFamily.nunito.bold,
    fontSize: fontSize.xl,
    lineHeight: 32,
    letterSpacing: letterSpacing.tight
  },
  title: {
    fontFamily: fontFamily.nunito.semiBold,
    fontSize: fontSize.lg,
    lineHeight: 28
  },
  body: {
    fontFamily: fontFamily.inter.regular,
    fontSize: fontSize.md,
    lineHeight: lineHeight.relaxed
  },
  bodyStrong: {
    fontFamily: fontFamily.inter.semiBold,
    fontSize: fontSize.md,
    lineHeight: lineHeight.relaxed
  },
  caption: {
    fontFamily: fontFamily.inter.medium,
    fontSize: fontSize.sm,
    lineHeight: lineHeight.snug,
    letterSpacing: letterSpacing.relaxed
  },
  button: {
    fontFamily: fontFamily.inter.semiBold,
    fontSize: fontSize.md,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.relaxed
  },
  label: {
    fontFamily: fontFamily.inter.medium,
    fontSize: fontSize.xs,
    lineHeight: lineHeight.snug,
    letterSpacing: letterSpacing.relaxed
  }
};

export const typography = {
  fontFamily,
  fontSize,
  lineHeight,
  letterSpacing,
  textVariants
} as const;
