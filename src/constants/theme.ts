// cPod Design System — extraído de cpod.css + identidade do logo
export const Colors = {
  // Teal scale
  teal900: '#071e1d',
  teal800: '#0e2e2c',
  teal700: '#1F5C59',
  teal600: '#2a7370',
  teal500: '#3d9490',
  teal300: '#7ecfcc',
  teal100: '#d4f0ee',
  teal50: '#f0fafa',

  // Accent
  purple: '#C333F3',
  purpleSoft: 'rgba(195,51,243,0.15)',
  cyan: '#33C3F3',
  cyanSoft: 'rgba(51,195,243,0.12)',
  mint: '#33F3C3',
  mintSoft: 'rgba(51,243,195,0.12)',

  // Neutrals
  surface: '#ffffff',
  bg: '#f5f7f7',
  dark: '#061615',
  dark2: '#0c2220',
  border: 'rgba(31,92,89,0.12)',
  borderLight: 'rgba(255,255,255,0.1)',
  text: '#0d1f1e',
  muted: '#4a6a68',
  subtle: '#8aacaa',
  white: '#ffffff',

  // Semantic
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
};

export const Typography = {
  fontDisplay: 'System',
  fontBody: 'System',

  // sizes
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,

  // weights
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  full: 9999,
};

export const Shadow = {
  card: {
    shadowColor: '#071e1d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  float: {
    shadowColor: '#071e1d',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 8,
  },
};
