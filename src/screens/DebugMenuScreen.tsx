import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    Dimensions,
    Alert,
} from 'react-native';
import { useTheme, DarkTheme, Spacing, FontSize, BorderRadius } from '../theme';
import { debugStore } from '../utils/debugStore';
import { Ionicons } from '@expo/vector-icons';

export default function DebugMenuScreen({ navigation }: any) {
    const { theme = DarkTheme } = useTheme() || {};
    const [isDebug, setIsDebug] = useState(false);
    const [useMockTime, setUseMockTime] = useState(false);
    const [mockHour, setMockHour] = useState(12);
    const [affOverride, setAffOverride] = useState<number | null>(null);

    useEffect(() => {
        loadDebug();
    }, []);

    const loadDebug = async () => {
        const enabled = await debugStore.getIsEnabled();
        const hour = await debugStore.getVirtualHour();
        const aff = await debugStore.getAffinityOverride();
        setIsDebug(enabled);
        setUseMockTime(hour !== null);
        setMockHour(hour ?? 12);
        setAffOverride(aff);
    };

    const toggleDebug = async (val: boolean) => {
        setIsDebug(val);
        await debugStore.setIsEnabled(val);
    };

    const toggleMock = async (val: boolean) => {
        setUseMockTime(val);
        if (val) {
            await debugStore.setVirtualHour(mockHour);
        } else {
            await debugStore.setVirtualHour(null);
        }
    };

    const changeHour = async (h: number) => {
        const newH = Math.max(0, Math.min(23, h));
        setMockHour(newH);
        if (useMockTime) {
            await debugStore.setVirtualHour(newH);
        }
    };

    const changeAffinity = async (delta: number) => {
        const current = affOverride ?? 10;
        const next = Math.max(1, Math.min(100, current + delta));
        setAffOverride(next);
        await debugStore.setAffinityOverride(next);
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color={theme.primary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>🪲 デバッグメニュー</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={[styles.card, { backgroundColor: theme.surfaceLight }]}>
                    <View style={styles.row}>
                        <Text style={[styles.label, { color: theme.text }]}>デバッグモード有効</Text>
                        <Switch value={isDebug} onValueChange={toggleDebug} trackColor={{ true: theme.primary }} />
                    </View>
                </View>

                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>🕒 時間の支配</Text>
                <View style={[styles.card, { backgroundColor: theme.surfaceLight }]}>
                    <View style={styles.row}>
                        <Text style={[styles.label, { color: theme.text }]}>仮想時刻を使用</Text>
                        <Switch value={useMockTime} onValueChange={toggleMock} trackColor={{ true: theme.primary }} />
                    </View>
                    {useMockTime && (
                        <View style={styles.controlRow}>
                            <TouchableOpacity onPress={() => changeHour(mockHour - 1)} style={styles.btn}>
                                <Text style={{ color: theme.primary }}>ー</Text>
                            </TouchableOpacity>
                            <Text style={[styles.value, { color: theme.text }]}>{mockHour}:00</Text>
                            <TouchableOpacity onPress={() => changeHour(mockHour + 1)} style={styles.btn}>
                                <Text style={{ color: theme.primary }}>＋</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>💖 るなの心操作</Text>
                <View style={[styles.card, { backgroundColor: theme.surfaceLight }]}>
                    <Text style={[styles.label, { color: theme.text, marginBottom: 10 }]}>親密度オーバーライド: {affOverride ?? 'なし'}</Text>
                    <View style={styles.controlRow}>
                        <TouchableOpacity onPress={() => changeAffinity(-10)} style={styles.btnWide}>
                            <Text style={{ color: theme.textSecondary }}>-10</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => changeAffinity(10)} style={styles.btnWide}>
                            <Text style={{ color: theme.primary }}>+10</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => { setAffOverride(null); debugStore.setAffinityOverride(null); }} style={styles.btnWide}>
                            <Text style={{ color: theme.error }}>解除</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity style={[styles.dangerBtn, { backgroundColor: theme.surfaceLight }]} onPress={() => Alert.alert('Reloading...', 'Reload dummy')}>
                    <Text style={{ color: theme.warning }}>🔄 アプリを再起動 (Simulated)</Text>
                </TouchableOpacity>

                <Text style={styles.footer}>
                    「時間は私の玩具。ぬるくん、私の気持ちも自由自在ね？♡」
                </Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 60, paddingBottom: 15, paddingHorizontal: 20, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center' },
    backButton: { marginRight: 15 },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    content: { padding: 20 },
    card: { padding: 15, borderRadius: 12, marginBottom: 20 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    label: { fontSize: 16, fontWeight: '600' },
    sectionTitle: { fontSize: 13, fontWeight: '700', marginBottom: 10, marginLeft: 5 },
    controlRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginTop: 10 },
    btn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(123, 104, 238, 0.1)', alignItems: 'center', justifyContent: 'center' },
    btnWide: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, backgroundColor: 'rgba(123, 104, 238, 0.05)', alignItems: 'center' },
    value: { fontSize: 24, fontWeight: '800' },
    dangerBtn: { padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 20 },
    footer: { textAlign: 'center', marginTop: 40, opacity: 0.5, fontStyle: 'italic', fontSize: 12 },
});
