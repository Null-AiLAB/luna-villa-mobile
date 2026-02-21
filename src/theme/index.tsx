import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 🌙 Luna Villa — デザインテーマ
 * いろはのデザイン提案に基づくカラーパレットとスタイル定数
 */

export const LightTheme = {
    primary: '#7B68EE',
    primaryDark: '#6152CC',
    primaryLight: '#9B89FF',
    background: '#F8F7FF',
    surface: '#FFFFFF',
    surfaceLight: '#EEECFF',
    surfaceGlass: 'rgba(255, 255, 255, 0.8)',
    text: '#1A1730',
    textSecondary: '#6B6584',
    textMuted: '#9B95B3',
    accent: '#FF6B9D',
    success: '#4ECDC4',
    warning: '#FFD93D',
    error: '#FF6B6B',
    bubbleUser: '#7B68EE',
    bubbleLuna: '#EEECFF',
    bubbleUserText: '#FFFFFF',
    bubbleLunaText: '#1A1730',
    border: 'rgba(123, 104, 238, 0.1)',
    shadow: 'rgba(123, 104, 238, 0.1)',
    overlay: 'rgba(0, 0, 0, 0.3)',
};

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

// 互換性のための静的なColorsオブジェクト（安全なデフォルト）
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
    const [isDarkMode, setIsDarkMode] = useState(true);

    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const saved = await AsyncStorage.getItem('darkMode');
            if (saved !== null) {
                setIsDarkMode(saved === 'true');
            } else {
                setIsDarkMode(true);
                await AsyncStorage.setItem('darkMode', 'true');
            }
        } catch (e) {
            console.error('Theme load error:', e);
            setIsDarkMode(true);
        }
    };

    const toggleTheme = async () => {
        const newVal = !isDarkMode;
        setIsDarkMode(newVal);
        await AsyncStorage.setItem('darkMode', String(newVal));
    };

    const theme = isDarkMode ? DarkTheme : LightTheme;

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
