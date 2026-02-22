import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Switch,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Updates from 'expo-updates';
import { useDebugStore } from '../utils/debugStore';
import { useTheme } from '../theme';

const MOODS = [
    { label: 'なし (Real)', value: null },
    { label: '幸せ (Happy)', value: 'happy' },
    { label: '通常 (Neutral)', value: 'neutral' },
    { label: '困惑 (Annoyed)', value: 'annoyed' },
    { label: '照れ (Embarrassed)', value: 'embarrassed' },
];

const DebugMenuScreen = ({ navigation }: any) => {
    const { theme } = useTheme();
    const debug = useDebugStore();
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            const current = debug.mockTime || new Date();
            const newDate = new Date(selectedDate);
            newDate.setHours(current.getHours());
            newDate.setMinutes(current.getMinutes());
            debug.setMockTime(newDate);
        }
    };

    const onTimeChange = (event: any, selectedTime?: Date) => {
        setShowTimePicker(false);
        if (selectedTime) {
            const current = debug.mockTime || new Date();
            const newDate = new Date(current);
            newDate.setHours(selectedTime.getHours());
            newDate.setMinutes(selectedTime.getMinutes());
            debug.setMockTime(newDate);
        }
    };

    const handleReload = async () => {
        Alert.alert('アプリ再起動', 'アプリを再起動して初期化処理をテストしますか？', [
            { text: 'キャンセル', style: 'cancel' },
            {
                text: '再起動',
                onPress: async () => {
                    try {
                        await Updates.reloadAsync();
                    } catch (e) {
                        Alert.alert('エラー', '再起動に失敗したわ… 開発用サーバーを確認して？');
                    }
                },
            },
        ]);
    };

    // 動的なスタイル生成
    const dynamicStyles = createStyles(theme);

    return (
        <SafeAreaView style={dynamicStyles.container}>
            <View style={dynamicStyles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={dynamicStyles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={dynamicStyles.title}>デバッグメニュー</Text>
            </View>

            <ScrollView style={dynamicStyles.content}>
                <View style={dynamicStyles.section}>
                    <View style={dynamicStyles.row}>
                        <Text style={dynamicStyles.label}>デバッグモード有効</Text>
                        <Switch
                            value={debug.isEnabled}
                            onValueChange={debug.setDebugEnabled}
                            trackColor={{ false: '#333', true: theme.primary }}
                        />
                    </View>
                </View>

                {debug.isEnabled && (
                    <>
                        <View style={dynamicStyles.section}>
                            <Text style={dynamicStyles.sectionTitle}>⌛ 時刻シミュレーション</Text>
                            <View style={dynamicStyles.row}>
                                <Text style={dynamicStyles.label}>モック時刻を使用</Text>
                                <Switch
                                    value={debug.useMockTime}
                                    onValueChange={debug.toggleMockTime}
                                    trackColor={{ false: '#333', true: theme.primary }}
                                />
                            </View>

                            {debug.useMockTime && (
                                <View style={dynamicStyles.dateTimeContainer}>
                                    <TouchableOpacity
                                        style={dynamicStyles.datePickerButton}
                                        onPress={() => setShowDatePicker(true)}
                                    >
                                        <Text style={dynamicStyles.dateTimeText}>
                                            {debug.mockTime?.toLocaleDateString() || '日付を選択'}
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={dynamicStyles.datePickerButton}
                                        onPress={() => setShowTimePicker(true)}
                                    >
                                        <Text style={dynamicStyles.dateTimeText}>
                                            {debug.mockTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '時刻を選択'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        <View style={dynamicStyles.section}>
                            <Text style={dynamicStyles.sectionTitle}>💖 ステータス変更</Text>
                            <Text style={dynamicStyles.subLabel}>親密度 (0 - 1000): {debug.mockAffinity ?? '未設定'}</Text>
                            <View style={dynamicStyles.affinityButtons}>
                                {[0, 100, 300, 500, 800, 1000].map(val => (
                                    <TouchableOpacity
                                        key={val}
                                        style={[
                                            dynamicStyles.miniButton,
                                            debug.mockAffinity === val && dynamicStyles.activeButton
                                        ]}
                                        onPress={() => debug.setMockAffinity(val)}
                                    >
                                        <Text style={dynamicStyles.miniButtonText}>{val}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={dynamicStyles.subLabel}>仮想機嫌 (Mood Override)</Text>
                            <View style={dynamicStyles.moodButtons}>
                                {MOODS.map(m => (
                                    <TouchableOpacity
                                        key={m.label}
                                        style={[
                                            dynamicStyles.miniButton,
                                            debug.mockMood === m.value && dynamicStyles.activeButton
                                        ]}
                                        onPress={() => debug.setMockMood(m.value as any)}
                                    >
                                        <Text style={dynamicStyles.miniButtonText}>{m.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </>
                )}

                <View style={[dynamicStyles.section, { borderBottomWidth: 0 }]}>
                    <Text style={dynamicStyles.sectionTitle}>⚙️ システム操作</Text>
                    <TouchableOpacity style={dynamicStyles.reloadButton} onPress={handleReload}>
                        <Ionicons name="refresh" size={20} color="#fff" />
                        <Text style={dynamicStyles.reloadButtonText}>アプリを再起動 (Reload)</Text>
                    </TouchableOpacity>
                </View>

                {showDatePicker && (
                    <DateTimePicker
                        value={debug.mockTime || new Date()}
                        mode="date"
                        display="default"
                        onChange={onDateChange}
                    />
                )}
                {showTimePicker && (
                    <DateTimePicker
                        value={debug.mockTime || new Date()}
                        mode="time"
                        display="default"
                        onChange={onTimeChange}
                    />
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const createStyles = (theme: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.border || '#222',
    },
    backButton: {
        padding: 4,
        marginRight: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.text,
    },
    content: {
        flex: 1,
    },
    section: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: theme.border || '#222',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.primary,
        marginBottom: 16,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    label: {
        fontSize: 16,
        color: theme.text,
    },
    subLabel: {
        fontSize: 14,
        color: theme.textSecondary || '#888',
        marginBottom: 8,
    },
    dateTimeContainer: {
        flexDirection: 'row',
        marginTop: 12,
        gap: 12,
    },
    datePickerButton: {
        flex: 1,
        backgroundColor: theme.surface || '#1a1a1a',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.border || '#333',
    },
    dateTimeText: {
        color: theme.text,
        fontSize: 14,
    },
    affinityButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 20,
    },
    moodButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    miniButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: theme.surface || '#1a1a1a',
        borderWidth: 1,
        borderColor: theme.border || '#333',
    },
    activeButton: {
        backgroundColor: theme.primary + '33',
        borderColor: theme.primary,
    },
    miniButtonText: {
        color: theme.text,
        fontSize: 12,
    },
    reloadButton: {
        flexDirection: 'row',
        backgroundColor: theme.error || '#f44336',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 8,
    },
    reloadButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default DebugMenuScreen;
