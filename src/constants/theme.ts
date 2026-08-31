/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

// Traditional South Indian temple palette: vermillion (kumkum/Vel) as
// primary, gold/saffron as accent, peacock teal as secondary (Murugan's
// vehicle). Warm off-white in light mode, deep maroon-black in dark mode.
export const Colors = {
  light: {
    text: '#2B1A15',
    textSecondary: '#7A6155',
    background: '#FDF8F3',
    backgroundElement: '#F5EBE0',
    backgroundSelected: '#EBD9C4',
    primary: '#B0301F',
    primaryText: '#FFFFFF',
    accent: '#D4A017',
    secondary: '#0F6B5C',
    maroon: '#6B1E14',
    success: '#2E7D32',
  },
  dark: {
    text: '#F5EBE0',
    textSecondary: '#C9B8AE',
    background: '#1A0F0C',
    backgroundElement: '#2B1A15',
    backgroundSelected: '#3D241C',
    primary: '#E0543D',
    primaryText: '#1A0F0C',
    accent: '#E6B84D',
    secondary: '#3FA593',
    maroon: '#A6452F',
    success: '#5FBF6B',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
