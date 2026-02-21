import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LightTheme, DarkTheme } from '../theme';

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
        const saved = await AsyncStorage.getItem('darkMode');
        if (saved !== null) {
            setIsDarkMode(saved === 'true');
        } else {
            // 初回起動時はダークモードを強制
            setIsDarkMode(true);
            await AsyncStorage.setItem('darkMode', 'true');
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
    if (!context) throw new Error('useTheme must be used within ThemeProvider');
    return context;
}
