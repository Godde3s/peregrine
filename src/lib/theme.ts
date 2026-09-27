import { useColorScheme } from 'react-native';
import type { TextStyle, ViewStyle } from 'react-native';

/** Style objects in this app may carry both view and text properties. */
export type AnyStyle = TextStyle & ViewStyle;

/**
 * Semantic palette — light AND dark from day one (fidelity law 1).
 * One accent, locked (anti-slop law 2): Peregrine orange on both themes.
 * One grey family, cool (anti-slop law 3): the Apple system-grey ramp.
 * Values are solid approximations of the platform semantic colors so they
 * survive semantic-object → string resolution for Reanimated styles.
 */
export interface ThemeColors {
  bg: string;
  card: string;
  label: string;
  secondary: string;
  tertiary: string;
  separator: string;
  accent: string;
  accentSoft: string;
  onAccent: string;
  danger: string;
  success: string;
  userBubble: string;
  assistantBubble: string;
  keyboardBar: string;
}

export const light: ThemeColors = {
  bg: '#F2F2F7',
  card: '#FFFFFF',
  label: '#000000',
  secondary: '#6C6C70',
  tertiary: '#AEAEB2',
  separator: '#E3E3E8',
  accent: '#E8860C',
  accentSoft: '#FFF3E0',
  onAccent: '#FFFFFF',
  danger: '#E5342B',
  success: '#248A3D',
  userBubble: '#E8860C',
  assistantBubble: '#FFFFFF',
  keyboardBar: '#E9E9EE',
};

export const dark: ThemeColors = {
  bg: '#000000',
  card: '#1C1C1E',
  label: '#FFFFFF',
  secondary: '#98989F',
  tertiary: '#636366',
  separator: '#333336',
  accent: '#FF9F0A',
  accentSoft: '#3A2A10',
  onAccent: '#1A1002',
  danger: '#FF453A',
  success: '#30D158',
  userBubble: '#FF9F0A',
  assistantBubble: '#1C1C1E',
  keyboardBar: '#1F1F21',
};

export function useThemeColors(): ThemeColors {
  const scheme = useColorScheme();
  return scheme === 'dark' ? dark : light;
}

/**
 * Shape lock (anti-slop law 4): inputs are 12, cards are 16, actions are
 * pills. No other radii exist in the app.
 */
export const radius = { input: 12, card: 16, pill: 999 } as const;

/** Spacing rhythm (fidelity law 7): a 4pt base, gap over margin stacking. */
export const spacing = {
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 24,
  xxl: 32,
} as const;

/** Platform type ramp (fidelity law 4). One display size per screen. */
export const font = {
  largeTitle: 34,
  title: 22,
  headline: 17,
  body: 17,
  callout: 16,
  footnote: 13,
  caption: 12,
} as const;

export const tabularNums: TextStyle = { fontVariant: ['tabular-nums'] };

export const continuous: ViewStyle = { borderCurve: 'continuous' };

/** Elevation via boxShadow (fidelity law 6), one system app-wide. */
export const elevation = {
  card: '0px 1px 2px rgba(0, 0, 0, 0.06)',
  raised: '0px 4px 12px rgba(0, 0, 0, 0.10)',
} as const;
