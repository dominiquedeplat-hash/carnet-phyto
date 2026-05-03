// Design tokens for Phyto Carnet (offline-first farmer app)
export const colors = {
  bg: '#FFFFFF',
  bgSubtle: '#F5F5F4',
  bgUtility: '#E7E5E4',
  textPrimary: '#1C1917',
  textSecondary: '#57534E',
  textMuted: '#78716C',
  textInverse: '#FFFFFF',
  primary: '#047857',
  primaryActive: '#065F46',
  primaryLight: '#D1FAE5',
  destructive: '#DC2626',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  lowStock: '#B45309',
  border: '#D6D3D1',
  borderLight: '#E7E5E4',
  focus: '#047857',
  // Category colors
  catHerbicide: '#CA8A04',
  catFongicide: '#7C3AED',
  catInsecticide: '#DC2626',
  catAutre: '#64748B',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const sizes = {
  touch: 56, // minimum touch target height (gloves)
  touchLg: 64,
  listItem: 72,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: '700' as const },
  body: { fontSize: 16, fontWeight: '500' as const },
  bodyBold: { fontSize: 16, fontWeight: '700' as const },
  small: { fontSize: 14, fontWeight: '600' as const },
  tiny: { fontSize: 12, fontWeight: '600' as const },
  metric: { fontSize: 32, fontWeight: '900' as const, letterSpacing: -1 },
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
};
