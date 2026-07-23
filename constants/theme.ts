/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

// Fully monochrome — the accent is just ink/paper. Tags, active states, and
// chevrons read as high-contrast ink rather than a color.
const threadLight = '#17140F';
const threadDark = '#EDEAE2';

export const Colors = {
  light: {
    text: '#17140F',
    background: '#F7F5F0',
    card: '#FFFFFF',
    line: '#E3DFD3',
    muted: '#8A8478',
    tint: threadLight,
    icon: '#8A8478',
    tabIconDefault: '#8A8478',
    tabIconSelected: '#17140F',
  },
  dark: {
    text: '#EDEAE2',
    background: '#121110',
    card: '#1C1A17',
    line: '#2B2822',
    muted: '#948C7E',
    tint: threadDark,
    icon: '#948C7E',
    tabIconDefault: '#948C7E',
    tabIconSelected: '#EDEAE2',
  },
};

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
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
