const spacingBase = 8;

export const spacingTokens = {
  none: 0,
  xxs: spacingBase * 0.25,
  xs: spacingBase * 0.5,
  sm: spacingBase,
  md: spacingBase * 1.5,
  lg: spacingBase * 2,
  xl: spacingBase * 3,
  xxl: spacingBase * 4
} as const;

export const radiusTokens = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  pill: 999
} as const;

export const shadowTokens = {
  soft: {
    elevation: 4,
    shadowColor: "rgba(47, 53, 56, 0.15)",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4
    }
  },
  lifted: {
    elevation: 8,
    shadowColor: "rgba(28, 35, 39, 0.2)",
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 8
    }
  }
} as const;

export type SpacingTokens = typeof spacingTokens;
export type RadiusTokens = typeof radiusTokens;
export type ShadowTokens = typeof shadowTokens;
