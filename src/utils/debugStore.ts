import AsyncStorage from '@react-native-async-storage/async-storage';

export const DEBUG_KEYS = {
    VIRTUAL_HOUR: 'debug_virtual_hour',
    AFFINITY_OVERRIDE: 'debug_affinity_override',
    IS_ENABLED: 'debug_enabled'
};

export const debugStore = {
    async getIsEnabled(): Promise<boolean> {
        return (await AsyncStorage.getItem(DEBUG_KEYS.IS_ENABLED)) === 'true';
    },

    async setIsEnabled(enabled: boolean): Promise<void> {
        await AsyncStorage.setItem(DEBUG_KEYS.IS_ENABLED, String(enabled));
    },

    async getVirtualHour(): Promise<number | null> {
        const val = await AsyncStorage.getItem(DEBUG_KEYS.VIRTUAL_HOUR);
        return val !== null ? parseInt(val, 10) : null;
    },

    async setVirtualHour(hour: number | null): Promise<void> {
        if (hour === null) {
            await AsyncStorage.removeItem(DEBUG_KEYS.VIRTUAL_HOUR);
        } else {
            await AsyncStorage.setItem(DEBUG_KEYS.VIRTUAL_HOUR, String(hour));
        }
    },

    async getAffinityOverride(): Promise<number | null> {
        const val = await AsyncStorage.getItem(DEBUG_KEYS.AFFINITY_OVERRIDE);
        return val !== null ? parseInt(val, 10) : null;
    },

    async setAffinityOverride(level: number | null): Promise<void> {
        if (level === null) {
            await AsyncStorage.removeItem(DEBUG_KEYS.AFFINITY_OVERRIDE);
        } else {
            await AsyncStorage.setItem(DEBUG_KEYS.AFFINITY_OVERRIDE, String(level));
        }
    }
};

export const getCurrentHour = async (): Promise<number> => {
    const isEnabled = await debugStore.getIsEnabled();
    if (isEnabled) {
        const override = await debugStore.getVirtualHour();
        if (override !== null) return override;
    }
    return new Date().getHours();
};
