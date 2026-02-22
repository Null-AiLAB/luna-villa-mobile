import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    TextInput,
    Alert,
    ActivityIndicator,
    Modal,
    ScrollView,
    SectionList,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, FontSize, BorderRadius, useTheme, DarkTheme } from '../theme';
import { api } from '../api';
import { scheduleReminder } from '../utils/notifications';

interface Task {
    id: number;
    title: string;
    event_id: number | null;
    due_date: string | null;
    due_time: string | null;
    is_done: boolean;
    completed_at: string | null;
    created_at: string;
    event_title: string | null;
}

type ViewTab = 'pending' | 'today_done' | 'history';

export default function TaskScreen() {
    const { theme = DarkTheme } = useTheme() || {};
    const [tasks, setTasks] = useState<Task[]>([]);
    const [history, setHistory] = useState<Task[]>([]);
    const [activeTab, setActiveTab] = useState<ViewTab>('pending');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);

    // 編集・作成
    const [modalVisible, setModalVisible] = useState(false);
    const [editMode, setEditMode] = useState<'create' | 'edit'>('create');
    const [currentTaskId, setCurrentTaskId] = useState<number | null>(null);
    const [inputTitle, setInputTitle] = useState('');
    const [inputTime, setInputTime] = useState('');

    const todayStr = new Date().toISOString().split('T')[0];

    const loadData = async () => {
        setLoading(true);
        try {
            // 全てのタスク（完了含む）を取得して、今日分と過去分に分ける
            const [activeData, historyData] = await Promise.all([
                api.getTasks(undefined, false), // 未完了
                api.getTaskHistory() // 全ての完了済み
            ]);
            setTasks(activeData);
            setHistory(historyData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    // フィルタリング \u0026 グルーピング
    const filteredPending = useMemo(() => {
        return tasks.filter(t => !t.is_done && t.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [tasks, searchQuery]);

    const filteredTodayDone = useMemo(() => {
        return history.filter(t => {
            const date = t.completed_at ? t.completed_at.split('T')[0] : t.due_date;
            return date === todayStr && t.title.toLowerCase().includes(searchQuery.toLowerCase());
        });
    }, [history, searchQuery, todayStr]);

    const groupedHistory = useMemo(() => {
        const past = history.filter(t => {
            const date = t.completed_at ? t.completed_at.split('T')[0] : t.due_date;
            return date !== todayStr && t.title.toLowerCase().includes(searchQuery.toLowerCase());
        });

        const groups: { [key: string]: Task[] } = {};
        past.forEach(t => {
            const date = t.completed_at ? new Date(t.completed_at) : (t.due_date ? new Date(t.due_date) : new Date(t.created_at));
            const key = `${date.getFullYear()}年 ${date.getMonth() + 1}月`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(t);
        });

        return Object.keys(groups).sort().reverse().map(key => ({
            title: key,
            data: groups[key].sort((a, b) => (b.completed_at || '').localeCompare(a.completed_at || ''))
        }));
    }, [history, searchQuery, todayStr]);

    const handleSaveTask = async () => {
        if (!inputTitle.trim() || loading) return;
        setLoading(true);
        try {
            if (editMode === 'create') {
                const res = await api.createTask({
                    title: inputTitle.trim(),
                    due_date: todayStr,
                    due_time: inputTime.trim() || null,
                });
                if (inputTime.trim()) {
                    await scheduleReminder(res.id, inputTitle.trim(), `${todayStr}T${inputTime}:00`, [30, 0]);
                }
            } else if (currentTaskId) {
                await api.updateTask(currentTaskId, {
                    title: inputTitle.trim(),
                    due_time: inputTime.trim() || null,
                });
            }
            setModalVisible(false);
            loadData();
        } catch {
            Alert.alert('エラー', '保存できなかったわ…');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (task: Task) => {
        try {
            api.haptics('selection');
            await api.updateTask(task.id, { is_done: !task.is_done });
            loadData();
        } catch {
            Alert.alert('エラー', '更新できなかったわ…');
        }
    };

    const handleDelete = (id: number) => {
        Alert.alert('削除確認', 'このタスクを消しちゃうの？', [
            { text: 'キャンセル', style: 'cancel' },
            { text: '削除', style: 'destructive', onPress: async () => { await api.deleteTask(id); loadData(); } }
        ]);
    };

    const renderTaskItem = ({ item }: { item: Task }) => (
        <TouchableOpacity
            style={[styles.taskCard, { backgroundColor: theme.surfaceLight }]}
            onPress={() => handleToggle(item)}
            onLongPress={() => {
                if (!item.is_done) {
                    setEditMode('edit');
                    setCurrentTaskId(item.id);
                    setInputTitle(item.title);
                    setInputTime(item.due_time || '');
                    setModalVisible(true);
                }
            }}
            activeOpacity={0.7}
        >
            <View style={styles.taskRow}>
                <View style={[
                    styles.checkbox,
                    { borderColor: theme.primary },
                    item.is_done && { backgroundColor: theme.success, borderColor: theme.success }
                ]}>
                    {item.is_done && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>

                <View style={styles.taskInfo}>
                    <Text style={[
                        styles.taskTitle,
                        { color: theme.text },
                        item.is_done && styles.taskTitleDone
                    ]}>
                        {item.title}
                    </Text>
                    <View style={styles.taskMeta}>
                        {item.due_time && !item.is_done && (
                            <Text style={[styles.taskTime, { color: theme.primary }]}>⏰ {item.due_time}</Text>
                        )}
                        {item.is_done && (
                            <Text style={[styles.taskTime, { color: theme.textMuted }]}>
                                完了: {item.completed_at ? new Date(item.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </Text>
                        )}
                    </View>
                </View>

                {item.is_done && (
                    <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteAction}>
                        <Ionicons name="trash-outline" size={18} color={theme.textMuted} />
                    </TouchableOpacity>
                )}
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* ─── ヘッダー ─── */}
            <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                <Text style={[styles.headerTitle, { color: theme.text }]}>✅ タスク管理</Text>
                <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: theme.primary }]}
                    onPress={() => {
                        setEditMode('create');
                        setInputTitle('');
                        setInputTime('');
                        setModalVisible(true);
                    }}
                >
                    <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* ─── 検索 ─── */}
            <View style={styles.searchContainer}>
                <View style={[styles.searchBar, { backgroundColor: theme.surfaceLight, borderColor: theme.border }]}>
                    <Ionicons name="search" size={18} color={theme.textMuted} />
                    <TextInput
                        style={[styles.searchInput, { color: theme.text }]}
                        placeholder="タスクを検索..."
                        placeholderTextColor={theme.textMuted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery !== '' && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={18} color={theme.textMuted} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* ─── タブ ─── */}
            <View style={[styles.tabBar, { borderBottomColor: theme.border }]}>
                {(['pending', 'today_done', 'history'] as ViewTab[]).map(tab => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tabItem, activeTab === tab && { borderBottomColor: theme.primary }]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[
                            styles.tabText,
                            { color: activeTab === tab ? theme.primary : theme.textSecondary }
                        ]}>
                            {tab === 'pending' ? '未完了' : tab === 'today_done' ? '今日完了' : '達成履歴'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* ─── コンテンツ ─── */}
            {activeTab === 'history' ? (
                <SectionList
                    sections={groupedHistory}
                    keyExtractor={item => String(item.id)}
                    renderItem={renderTaskItem}
                    renderSectionHeader={({ section: { title } }) => (
                        <View style={[styles.sectionHeader, { backgroundColor: theme.background }]}>
                            <Text style={[styles.sectionHeaderText, { color: theme.textSecondary }]}>{title}</Text>
                        </View>
                    )}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="archive-outline" size={64} color={theme.textMuted} style={{ marginBottom: 16 }} />
                            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>過去の履歴はないわよ？</Text>
                        </View>
                    }
                    stickySectionHeadersEnabled
                    refreshing={loading}
                    onRefresh={loadData}
                />
            ) : (
                <FlatList
                    data={activeTab === 'pending' ? filteredPending : filteredTodayDone}
                    renderItem={renderTaskItem}
                    keyExtractor={item => String(item.id)}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons
                                name={activeTab === 'pending' ? 'sparkles' : 'medal-outline'}
                                size={64}
                                color={theme.textMuted}
                                style={{ marginBottom: 16 }}
                            />
                            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                                {activeTab === 'pending' ? '全部完了！偉いわね、ぬるくん♡' : '今日はまだ何もしてないの？'}
                            </Text>
                        </View>
                    }
                    refreshing={loading}
                    onRefresh={loadData}
                />
            )}

            {/* ─── モーダル ─── */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}>
                    <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>
                            {editMode === 'create' ? 'タスクを追加' : 'タスクを編集'}
                        </Text>
                        <TextInput
                            style={[styles.modalInput, { backgroundColor: theme.surfaceLight, color: theme.text, borderColor: theme.border }]}
                            placeholder="何をするの？"
                            placeholderTextColor={theme.textMuted}
                            value={inputTitle}
                            onChangeText={setInputTitle}
                            autoFocus
                        />
                        <View style={styles.timeInputRow}>
                            <Ionicons name="time-outline" size={20} color={theme.textSecondary} />
                            <TextInput
                                style={[styles.timeInput, { backgroundColor: theme.surfaceLight, color: theme.text, borderColor: theme.border }]}
                                placeholder="18:00"
                                placeholderTextColor={theme.textMuted}
                                value={inputTime}
                                onChangeText={setInputTime}
                                keyboardType="numbers-and-punctuation"
                                maxLength={5}
                            />
                            <Text style={{ color: theme.textMuted, fontSize: 12 }}>※HH:mm形式</Text>
                        </View>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.modalCancel} onPress={() => setModalVisible(false)}>
                                <Text style={{ color: theme.textSecondary }}>キャンセル</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalSubmit, { backgroundColor: theme.primary }]} onPress={handleSaveTask}>
                                <Text style={styles.modalSubmitText}>保存♡</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 60,
        paddingBottom: Spacing.md,
        paddingHorizontal: Spacing.lg,
        borderBottomWidth: 1,
    },
    headerTitle: { fontSize: FontSize.xl, fontWeight: '800' },
    addButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', elevation: 2 },
    searchContainer: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        height: 44,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        gap: 8,
    },
    searchInput: { flex: 1, fontSize: 14 },
    tabBar: {
        flexDirection: 'row',
        marginTop: Spacing.md,
        borderBottomWidth: 1,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
    },
    tabText: { fontSize: 14, fontWeight: '700' },
    listContent: { padding: Spacing.lg, paddingBottom: 100 },
    sectionHeader: { paddingVertical: 8, paddingHorizontal: 4, marginTop: 8 },
    sectionHeaderText: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
    taskCard: { borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm, borderLeftWidth: 4, borderLeftColor: 'transparent' },
    taskRow: { flexDirection: 'row', alignItems: 'center' },
    checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
    taskInfo: { flex: 1 },
    taskTitle: { fontSize: 16, fontWeight: '600' },
    taskTitleDone: { textDecorationLine: 'line-through', opacity: 0.5 },
    taskMeta: { flexDirection: 'row', gap: Spacing.md, marginTop: 4 },
    taskTime: { fontSize: 11, fontWeight: '700' },
    deleteAction: { padding: 4 },
    emptyState: { paddingVertical: 80, alignItems: 'center' },
    emptyText: { fontSize: 14, fontWeight: '500' },
    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContent: { borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, padding: Spacing.xl, minHeight: 400 },
    modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 24 },
    modalInput: { borderRadius: BorderRadius.md, padding: 16, fontSize: 16, borderWidth: 1, marginBottom: 20 },
    timeInputRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 32 },
    timeInput: { borderRadius: BorderRadius.md, padding: 8, fontSize: 16, borderWidth: 1, width: 80, textAlign: 'center' },
    modalButtons: { flexDirection: 'row', gap: 16 },
    modalCancel: { flex: 1, padding: 16, alignItems: 'center' },
    modalSubmit: { flex: 2, padding: 16, borderRadius: BorderRadius.md, alignItems: 'center' },
    modalSubmitText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
