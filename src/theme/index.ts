/**
 * 🌙 Luna Villa — デザインテーマ
 * いろはのデザイン提案に基づくカラーパレットとスタイル定数
 */

export const LightTheme = {
    primary: '#7B68EE',        // ルナバイオレット
    primaryDark: '#6152CC',
    primaryLight: '#9B89FF',
    background: '#F8F7FF',     // 清潔感のある薄紫背景
    surface: '#FFFFFF',        // 純白
    surfaceLight: '#EEECFF',   // 薄い紫の入力背景
    surfaceGlass: 'rgba(255, 255, 255, 0.8)',
    text: '#1A1730',           // 深いネイビー（視認性重視）
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
    primary: '#7B68EE',        // ルナバイオレット
    primaryDark: '#6152CC',
    primaryLight: '#9B89FF',
    background: '#0D0B1A',     // 深夜のダーク背景
    surface: '#1A1730',        // カード・セクション背景
    surfaceLight: '#252240',   // 入力欄・リスト背景
    surfaceGlass: 'rgba(30, 27, 56, 0.7)', // ガラスモルフィズム
    text: '#F0ECF9',           // メインテキスト
    textSecondary: '#9B95B3',  // サブテキスト
    textMuted: '#6B6584',      // ミュートテキスト
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

// 互換性のためのデフォルトエクスポート（初期化用・後方互換）
export let Colors = DarkTheme;

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
