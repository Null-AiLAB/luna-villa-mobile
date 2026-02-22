import React, { createContext, useContext } from 'react';

/**
 * 🌙 Luna Villa — デザインテーマ (Eternal Night Edition v1.1.7)
 * ダークモード専用。シンプルさと安定性を極めたわ。
 */

export const DarkTheme = {
    primary: '#7B68EE',
    primaryDark: '#6152CC',
    primaryLight: '#9B89FF',
    background: '#0D0B1A',
    surface: '#1A1730',
    surfaceLight: '#252240',
    surfaceGlass: 'rgba(30, 27, 56, 0.7)',
    text: '#F0ECF9',
    textSecondary: '#9B95B3',
    textMuted: '#6B6584',
    accent: '#FF6B9D',
    success: '#4ECDC4',
    warning: '#FFD93D',
    error: '#FF6B6B',
    bubbleUser: '#7B68EE',
    bubbleLuna: '#252240',
    bubbleUserText: '#FFFFFF',
    bubbleLunaText: '#F0ECF9',
    border: 'rgba(123, 104, 238, 0.2)',
    shadow: 'rgba(123, 104, 238, 0.3)',
    overlay: 'rgba(0, 0, 0, 0.5)',
};

export const LightTheme = DarkTheme; // 互換性の維持

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

export const FontSize = {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 20,
    xxl: 28,
    title: 34,
};

export const BorderRadius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
};

// 互換性のための静的なColorsオブジェクト
export const Colors = DarkTheme;

// ─── Theme Context ───

type Theme = typeof DarkTheme;

interface ThemeContextType {
    theme: Theme;
    isDarkMode: boolean;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    // 常にダークモード
    const isDarkMode = true;
    const theme = DarkTheme;
    const toggleTheme = () => { console.log("Luna Villa is now permanently in Dark Mode! ♡") };

    return (
        <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    return {
        theme: context?.theme || DarkTheme,
        isDarkMode: context?.isDarkMode ?? true,
        toggleTheme: context?.toggleTheme || (() => { })
    };
}
