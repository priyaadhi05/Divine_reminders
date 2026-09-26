/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

// Temple-garden palette: deep leaf green as primary, with kumkum red and
// deep saffron as contrasting accents. Soft green-white in light mode,
// deep forest green in dark mode. Every text/background pair used in the
// app meets WCAG AA (4.5:1) - many readers are older, so contrast matters.
export const Colors = {
  light: {
    text: '#10261A',
    textSecondary: '#3B5A45',
    background: '#F1F8F1',
    backgroundElement: '#E1EFE0',
    backgroundSelected: '#C8E2C6',
    primary: '#1B5E20',
    primaryText: '#FFFFFF',
    accent: '#9A5200',
    secondary: '#A32A17',
    maroon: '#6B1E14',
    success: '#00695C',
  },
  dark: {
    text: '#E6F4E8',
    textSecondary: '#A8C7B0',
    background: '#0B1A10',
    backgroundElement: '#142A1B',
    backgroundSelected: '#1F3D29',
    primary: '#6FCF76',
    primaryText: '#0B1A10',
    accent: '#F5B342',
    secondary: '#FF8A70',
    maroon: '#EF7B6E',
    success: '#4DB6AC',
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

export const MaxContentWidth = 800;
