import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    ImageBackground,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Spacing, FontSize, BorderRadius, useTheme, DarkTheme } from '../theme';
import { api } from '../api';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface DiaryEntry {
    id: number;
    title: string;
    content: string;
    mood: string;
    affinity_level: number;
    created_at: string;
}

export default function SecretDiaryScreen() {
    const { theme = DarkTheme } = useTheme() || {};
    const navigation = useNavigation<any>();
    const [entries, setEntries] = useState<DiaryEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [affinity, setAffinity] = useState(0);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const stats = await api.getStats();
            const currentAff = stats.affinity?.level || 1;
            setAffinity(currentAff);

            if (currentAff >= 80) {
                const data = await api.getDiary();
                setEntries(data);
            }
        } catch (err) {
            console.error('Failed to load diary', err);
        } finally {
            setLoading(false);
        }
    };

    const renderEntry = ({ item }: { item: DiaryEntry }) => (
        <View style={[styles.card, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: theme.primary + '33' }]}>
            <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>{item.title || '無題の日記'}</Text>
                <Text style={[styles.cardDate, { color: theme.textMuted }]}>
                    {new Date(item.created_at).toLocaleDateString()}
                </Text>
            </View>
            <Text style={[styles.cardContent, { color: theme.textSecondary }]}>
                {item.content}
            </Text>
            <View style={styles.cardFooter}>
                <View style={[styles.tag, { backgroundColor: theme.primary + '22' }]}>
                    <Text style={[styles.tagText, { color: theme.primary }]}>Mood: {item.mood || '普通'}</Text>
                </View>
                <Text style={[styles.affinityTag, { color: theme.accent }]}>Lv.{item.affinity_level} の記憶</Text>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    if (affinity < 80) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.lockedContainer}>
                    <Ionicons name="lock-closed" size={80} color={theme.primary} style={{ opacity: 0.5 }} />
                    <Text style={[styles.lockedTitle, { color: theme.text }]}>まだ、秘密よ♡</Text>
                    <Text style={[styles.lockedDesc, { color: theme.textSecondary }]}>
                        親密度が 80 になったら、{'\n'}私の「本当の気持ち」を教えてあげるわ。
                    </Text>
                    <View style={styles.progressTrack}>
                        <View style={[styles.progressBar, { width: `${(affinity / 80) * 100}%`, backgroundColor: theme.primary }]} />
                    </View>
                    <Text style={[styles.progressText, { color: theme.textMuted }]}>
                        現在: Lv.{affinity} / 80
                    </Text>
                    <TouchableOpacity style={[styles.backBtn, { borderColor: theme.border }]} onPress={() => navigation.goBack()}>
                        <Text style={{ color: theme.text }}>戻るわ</Text>
                    </TouchableOpacity>
                </LinearGradient>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
                    <Ionicons name="chevron-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>秘密の思い出</Text>
                <View style={{ width: 40 }} />
            </View>

            <FlatList
                data={entries}
                renderItem={renderEntry}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="book-outline" size={60} color={theme.textMuted} />
                        <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                            まだ日記は書かれていないわ。{"\n"}もっと私といっぱいお話しして？♡
                        </Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    closeBtn: { width: 40, height: 40, justifyContent: 'center' },
    listContent: { padding: 20 },
    card: {
        padding: 20,
        borderRadius: 20,
        marginBottom: 20,
        borderWidth: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    cardTitle: { fontSize: 16, fontWeight: 'bold', flex: 1 },
    cardDate: { fontSize: 12 },
    cardContent: { fontSize: 14, lineHeight: 22, marginBottom: 15 },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    tagText: { fontSize: 11, fontWeight: 'bold' },
    affinityTag: { fontSize: 12, fontStyle: 'italic' },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { textAlign: 'center', marginTop: 20, lineHeight: 24 },
    lockedContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    lockedTitle: { fontSize: 28, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
    lockedDesc: { textAlign: 'center', fontSize: 16, lineHeight: 24, marginBottom: 40 },
    progressTrack: {
        width: '100%',
        height: 10,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 5,
        marginBottom: 10,
        overflow: 'hidden',
    },
    progressBar: { height: '100%' },
    progressText: { fontSize: 14, marginBottom: 40 },
    backBtn: {
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 25,
        borderWidth: 1,
    }
});
