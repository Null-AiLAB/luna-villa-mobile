import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, DarkTheme } from '../theme';
import { api } from '../api';

export default function LogViewerScreen({ navigation, route }: any) {
    const { type = 'greetings' } = route.params || {};
    const { theme = DarkTheme } = useTheme() || {};
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState<any[]>([]);

    useEffect(() => {
        fetchLogs();
    }, [type]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            if (type === 'greetings') {
                const res = await api.get('/api/diary/greetings');
                setLogs(res.greetings || []);
            } else if (type === 'diary') {
                const res = await api.get('/api/diary/entries');
                setLogs(res.entries || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={[styles.logCard, { backgroundColor: theme.surfaceLight, borderColor: theme.border }]}>
            <View style={styles.logHeader}>
                <Text style={[styles.logType, { color: theme.primary }]}>
                    {type === 'greetings' ? `👋 ${item.greeting_type}` : `📖 ${item.title || '無題'}`}
                </Text>
                <Text style={[styles.logDate, { color: theme.textMuted }]}>
                    {new Date(item.created_at).toLocaleString('ja-JP')}
                </Text>
            </View>
            <Text style={[styles.logContent, { color: theme.text }]}>
                {type === 'greetings' ? '挨拶を記録したわよ♡' : item.content}
            </Text>
            {type === 'diary' && (
                <View style={styles.diaryFooter}>
                    <Text style={[styles.moodText, { color: theme.textSecondary }]}>Mood: {item.mood}</Text>
                    <Text style={[styles.affinityText, { color: theme.primary }]}>Affinity: {item.affinity_level}</Text>
                </View>
            )}
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>
                    {type === 'greetings' ? '挨拶履歴ログ' : '秘密日記ログ'}
                </Text>
                <TouchableOpacity onPress={fetchLogs} style={styles.refreshButton}>
                    <Ionicons name="refresh" size={22} color={theme.primary} />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.loadingArea}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                <FlatList
                    data={logs}
                    renderItem={renderItem}
                    keyExtractor={(item, index) => String(item.id || index)}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={<Text style={[styles.emptyText, { color: theme.textMuted }]}>ログが見つからないわ…</Text>}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 60, paddingBottom: 15, paddingHorizontal: 20, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerTitle: { fontSize: 18, fontWeight: '800' },
    backButton: { padding: 5 },
    refreshButton: { padding: 5 },
    loadingArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 20, paddingBottom: 100 },
    logCard: { padding: 15, borderRadius: 12, borderWidth: 1, marginBottom: 15 },
    logHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    logType: { fontSize: 14, fontWeight: '700' },
    logDate: { fontSize: 10, fontWeight: '600' },
    logContent: { fontSize: 13, lineHeight: 18 },
    diaryFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
    moodText: { fontSize: 10, fontWeight: '700' },
    affinityText: { fontSize: 10, fontWeight: '700' },
    emptyText: { textAlign: 'center', marginTop: 100, fontSize: 14 },
});
