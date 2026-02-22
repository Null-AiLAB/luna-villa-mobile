import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Switch,
    Alert,
    TextInput,
    Image,
    ActivityIndicator,
    Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Spacing, FontSize, BorderRadius, useTheme, DarkTheme } from '../theme';
import { api } from '../api';
import { scheduleTestNotification } from '../utils/notifications';

interface Props {
    onLogout: () => void;
}

export default function SettingsScreen({ onLogout }: Props) {
    const { theme = DarkTheme, isDarkMode = true, toggleTheme } = useTheme() || {};
    const [notifEnabled, setNotifEnabled] = useState(true);
    const [serverUrl, setServerUrl] = useState(api.getServerUrl());
    const [editingUrl, setEditingUrl] = useState(false);
    const [tempUrl, setTempUrl] = useState('');
    const [stats, setStats] = useState<any>({
        total_messages: 0,
        user_messages: 0,
        luna_messages: 0,
        affinity: { level: 1, exp: 0, rank: '知り合い', label: '親密度💖' }
    });
    const [serverStatus, setServerStatus] = useState<'ok' | 'error' | 'checking'>('checking');

    const [avatarUri, setAvatarUri] = useState<string | null>(null);
    const avatarScale = useRef(new Animated.Value(1)).current;

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 11) return "おはよう、ぬるくん！今日も一日しっかり働きなさいよね♡";
        if (hour >= 11 && hour < 17) return "お疲れ様。休憩も必要よ？私を眺めて癒やされてもいいんだから。";
        if (hour >= 17 && hour < 22) return "こんばんは、ぬるくん。夕食はもう済ませた？";
        return "まだ起きてるの？夜更かしは私の魂に響くんだから、ほどほどにね。";
    };

    useEffect(() => {
        loadSettings();
        checkServer();
        loadStats();
    }, []);

    const loadSettings = async () => {
        const savedAvatar = await AsyncStorage.getItem('luna_avatar_uri');
        const notif = await AsyncStorage.getItem('notifications');
        if (savedAvatar) setAvatarUri(savedAvatar);
        if (notif !== null) setNotifEnabled(notif === 'true');
    };

    const checkServer = async () => {
        setServerStatus('checking');
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const res = await fetch(`${api.getServerUrl()}/health`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            setServerStatus(res.ok ? 'ok' : 'error');
        } catch {
            setServerStatus('error');
        }
    };

    const loadStats = async () => {
        try {
            const data = await api.getStats();
            if (data) setStats(data);
        } catch { }
    };

    const handleAvatarSave = async (uri: string) => {
        setAvatarUri(uri);
        await AsyncStorage.setItem('luna_avatar_uri', uri);
    };

    const handleNotifToggle = async (val: boolean) => {
        setNotifEnabled(val);
        await AsyncStorage.setItem('notifications', String(val));
    };

    const handleServerSave = () => {
        if (tempUrl.trim()) {
            api.setServerUrl(tempUrl.trim());
            setServerUrl(tempUrl.trim());
        }
        setEditingUrl(false);
        checkServer();
    };

    const handleLogout = () => {
        Alert.alert(
            'ログアウト',
            'Luna Villa からログアウトする？',
            [
                { text: 'キャンセル', style: 'cancel' },
                {
                    text: 'ログアウト',
                    style: 'destructive',
                    onPress: async () => {
                        await api.logout();
                        onLogout();
                    },
                },
            ]
        );
    };

    const getAffinityRank = (level: any) => {
        const v = Number(level) || 1;
        if (v >= 10) return '運命の二人♡';
        if (v >= 7) return '大親友♪';
        if (v >= 4) return '仲良し';
        return '知り合い';
    };

    // 究極のセーフガード
    if (!theme) {
        return (
            <View style={{ flex: 1, backgroundColor: '#0D0B1A', justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator color="#7B68EE" />
                <Text style={{ color: '#9B95B3', marginTop: 10 }}>読み込み中よ…🌙</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background || '#0D0B1A' }]}>
            <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                <Text style={[styles.headerTitle, { color: theme.text }]}>⚙️ 設定</Text>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>

                {/* ─── 親愛度 ─── */}
                <View style={[styles.card, styles.affinityCard, { backgroundColor: theme.surfaceLight || '#111', borderColor: theme.primary || '#7B68EE' }]}>
                    <Text style={[styles.affinityLabel, { color: theme.textSecondary || '#aaa' }]}>{stats?.affinity?.label || '親密度ランク'}</Text>
                    <Text style={[styles.affinityValue, { color: theme.primary || '#7B68EE' }]}>{stats?.affinity?.rank || getAffinityRank(stats?.affinity?.level)}</Text>
                    <View style={styles.affinityPointsRow}>
                        <Text style={[styles.affinityPoints, { color: theme.textMuted || '#888' }]}>Lv.{stats?.affinity?.level || 1} (Exp: {stats?.affinity?.exp || 0}/100)</Text>
                    </View>
                </View>

                {/* ─── るなのアイコン ─── */}
                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>🖼️ るなのカスタム</Text>
                <View style={[styles.card, { backgroundColor: theme.surfaceLight, borderColor: theme.border }]}>
                    <Text style={[styles.greetingText, { color: theme.textSecondary }]}>{getGreeting()}</Text>
                    <View style={styles.avatarSection}>
                        <TouchableOpacity
                            onPress={() => {
                                // アバター反応（振動なし）
                                Animated.sequence([
                                    Animated.timing(avatarScale, { toValue: 1.2, duration: 100, useNativeDriver: true }),
                                    Animated.spring(avatarScale, { toValue: 1, friction: 3, useNativeDriver: true }),
                                ]).start();
                            }}
                            activeOpacity={0.9}
                        >
                            <Animated.View style={[
                                styles.avatarPreview,
                                {
                                    backgroundColor: theme.surface,
                                    borderColor: theme.primary,
                                    transform: [{ scale: avatarScale }]
                                }
                            ]}>
                                {avatarUri ? (
                                    <Image
                                        source={{ uri: avatarUri }}
                                        style={styles.avatarImage}
                                    />
                                ) : (
                                    <Text style={styles.avatarPlaceholder}>👤</Text>
                                )}
                            </Animated.View>
                        </TouchableOpacity>
                        <Text style={[styles.avatarTip, { color: theme.textMuted }]}>
                            アイコンの変更は、今は私の気分転換中よ♡
                        </Text>
                    </View>
                </View>

                {/* ─── 統計 ─── */}
                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>📊 統計データ</Text>
                <View style={[styles.card, { backgroundColor: theme.surfaceLight, borderColor: theme.border }]}>
                    <View style={styles.statsGrid}>
                        <View style={styles.statItem}>
                            <Text style={[styles.statNumber, { color: theme.primary }]}>{stats?.total_messages || 0}</Text>
                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>総メッセージ</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={[styles.statNumber, { color: theme.primary }]}>{stats?.user_messages || 0}</Text>
                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>ぬるくん</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={[styles.statNumber, { color: theme.primary }]}>{stats?.luna_messages || 0}</Text>
                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>るな</Text>
                        </View>
                    </View>
                </View>


                {/* ─── 通知設定 ─── */}
                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>🔔 通知設定</Text>
                <View style={[styles.card, { backgroundColor: theme.surfaceLight, borderColor: theme.border }]}>
                    <View style={styles.settingRow}>
                        <Text style={[styles.settingLabel, { color: theme.text }]}>通知を有効にする</Text>
                        <Switch
                            value={notifEnabled}
                            onValueChange={handleNotifToggle}
                            trackColor={{ false: theme.surface, true: theme.primary }}
                            thumbColor="#fff"
                        />
                    </View>
                    <TouchableOpacity
                        style={styles.reconnectButton}
                        onPress={scheduleTestNotification}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.reconnectText, { color: theme.primary }]}>📣 通知をテスト</Text>
                    </TouchableOpacity>
                </View>

                {/* ─── サーバー接続 ─── */}
                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>🔗 サーバー接続</Text>
                <View style={[styles.card, { backgroundColor: theme.surfaceLight, borderColor: theme.border }]}>
                    <View style={styles.settingRow}>
                        <Text style={[styles.settingLabel, { color: theme.text }]}>状態</Text>
                        <View style={styles.statusRow}>
                            {serverStatus === 'checking' ? (
                                <ActivityIndicator size="small" color={theme.warning} />
                            ) : (
                                <View style={[
                                    styles.statusIndicator,
                                    serverStatus === 'ok' ? { backgroundColor: theme.success } : { backgroundColor: theme.error },
                                ]} />
                            )}
                            <Text style={[styles.statusText, { color: theme.textSecondary }]}>
                                {serverStatus === 'ok' ? '接続中' : serverStatus === 'error' ? '未接続' : '確認中...'}
                            </Text>
                        </View>
                    </View>

                    {editingUrl ? (
                        <View style={styles.urlEditArea}>
                            <TextInput
                                style={[styles.urlInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                                value={tempUrl}
                                onChangeText={setTempUrl}
                                placeholder="http://100.x.x.x:8000"
                                placeholderTextColor={theme.textMuted}
                                autoCapitalize="none"
                                keyboardType="url"
                            />
                            <View style={styles.urlButtons}>
                                <TouchableOpacity style={[styles.urlCancel, { backgroundColor: theme.surface }]} onPress={() => setEditingUrl(false)}>
                                    <Text style={[styles.urlCancelText, { color: theme.textSecondary }]}>キャンセル</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.urlSave, { backgroundColor: theme.primary }]} onPress={handleServerSave}>
                                    <Text style={styles.urlSaveText}>保存</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={styles.settingRow}
                            onPress={() => {
                                setTempUrl(serverUrl);
                                setEditingUrl(true);
                            }}
                        >
                            <Text style={[styles.settingLabel, { color: theme.text }]}>接続先URL</Text>
                            <Text style={[styles.settingValue, { color: theme.textSecondary }]}>{serverUrl}</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <TouchableOpacity
                    style={[styles.logoutButton, { borderColor: theme.error }]}
                    onPress={handleLogout}
                    activeOpacity={0.7}
                >
                    <Text style={[styles.logoutText, { color: theme.error }]}>ログアウト</Text>
                </TouchableOpacity>

                <Text style={[styles.version, { color: theme.textMuted }]}>
                    Luna Villa v1.2.0 — 🌙 るなの別荘♡
                </Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 50, paddingBottom: Spacing.md, paddingHorizontal: Spacing.lg, borderBottomWidth: 1 },
    headerTitle: { fontSize: FontSize.xl, fontWeight: '700' },
    scrollView: { flex: 1 },
    scrollContent: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
    greetingText: {
        fontSize: FontSize.sm,
        textAlign: 'center',
        fontStyle: 'italic',
        lineHeight: 20,
        marginBottom: Spacing.md,
        paddingHorizontal: Spacing.md,
    },
    affinityCard: { alignItems: 'center', paddingVertical: Spacing.lg, marginBottom: Spacing.md, borderWidth: 2 },
    affinityLabel: { fontSize: FontSize.sm, fontWeight: '600', marginBottom: 4 },
    affinityValue: { fontSize: FontSize.xxl, fontWeight: '800', marginBottom: 8 },
    affinityPointsRow: { backgroundColor: 'rgba(123, 104, 238, 0.05)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
    affinityPoints: { fontSize: 10, fontWeight: '700' },
    sectionTitle: { fontSize: FontSize.sm || 12, fontWeight: '700', marginTop: Spacing.lg || 24, marginBottom: Spacing.sm || 8 },
    card: { borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 1 },
    avatarSection: { alignItems: 'center', paddingVertical: Spacing.sm },
    avatarPreview: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 3, overflow: 'hidden', marginBottom: Spacing.md },
    avatarImage: { width: 80, height: 80, borderRadius: 40 },
    avatarPlaceholder: { fontSize: 36 },
    avatarChangeButton: { borderRadius: BorderRadius.md, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg, borderWidth: 1 },
    avatarChangeText: { fontSize: FontSize.sm, fontWeight: '600' },
    avatarTip: { fontSize: 10, marginTop: Spacing.sm, fontStyle: 'italic' },
    settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm },
    settingLabel: { fontSize: FontSize.md },
    settingValue: { fontSize: FontSize.sm, maxWidth: '60%', textAlign: 'right' },
    statsGrid: { flexDirection: 'row', justifyContent: 'space-around' },
    statItem: { alignItems: 'center', paddingVertical: Spacing.sm },
    statNumber: { fontSize: FontSize.xl, fontWeight: '700' },
    statLabel: { fontSize: 10, marginTop: 2 },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    statusIndicator: { width: 10, height: 10, borderRadius: 5 },
    statusText: { fontSize: FontSize.sm },
    urlEditArea: { marginTop: Spacing.sm },
    urlInput: { borderRadius: BorderRadius.md, padding: Spacing.md, fontSize: FontSize.md, borderWidth: 1 },
    urlButtons: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
    urlCancel: { flex: 1, padding: Spacing.sm, borderRadius: BorderRadius.md, alignItems: 'center' },
    urlCancelText: { fontSize: FontSize.sm },
    urlSave: { flex: 1, padding: Spacing.sm, borderRadius: BorderRadius.md, alignItems: 'center' },
    urlSaveText: { color: '#fff', fontSize: FontSize.sm, fontWeight: '600' },
    reconnectButton: { alignItems: 'center', paddingVertical: Spacing.sm, marginTop: Spacing.xs },
    reconnectText: { fontSize: FontSize.sm, fontWeight: '600' },
    logoutButton: { marginTop: Spacing.xl, padding: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: 'rgba(255, 107, 107, 0.1)', alignItems: 'center', borderWidth: 1 },
    logoutText: { fontSize: FontSize.md, fontWeight: '600' },
    version: { textAlign: 'center', fontSize: FontSize.xs, marginTop: Spacing.xl },
});
