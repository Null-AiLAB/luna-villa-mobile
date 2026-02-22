import { create } from 'zustand';

interface DebugState {
    isEnabled: boolean;
    useMockTime: boolean;
    mockTime: Date | null;
    mockAffinity: number | null;
    mockMood: 'happy' | 'neutral' | 'annoyed' | 'embarrassed' | null;

    setDebugEnabled: (enabled: boolean) => void;
    setMockTime: (date: Date | null) => void;
    setMockAffinity: (level: number | null) => void;
    setMockMood: (mood: DebugState['mockMood']) => void;
    toggleMockTime: (enabled: boolean) => void;
}

export const useDebugStore = create<DebugState>((set) => ({
    isEnabled: false,
    useMockTime: false,
    mockTime: null,
    mockAffinity: null,
    mockMood: null,

    setDebugEnabled: (enabled) => set({ isEnabled: enabled }),
    setMockTime: (date) => set({ mockTime: date }),
    setMockAffinity: (level) => set({ mockAffinity: level }),
    setMockMood: (mood) => set({ mockMood: mood }),
    toggleMockTime: (enabled) => set({ useMockTime: enabled }),
}));

/**
 * 現在の「るな視点」の時刻を取得するユーティリティ
 * デバッグモードが有効ならモック時刻を、そうでなければ実時刻を返すわよ♡
 */
export const getLunaTime = () => {
    const state = useDebugStore.getState();
    if (state.isEnabled && state.useMockTime && state.mockTime) {
        return state.mockTime;
    }
    return new Date();
};
