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
import { Spacing, FontSize, BorderRadius, useTheme, DarkTheme } from '../theme';
import { api } from '../api';
import { scheduleReminder } from '../utils/notifications';
import { Ionicons } from '@expo/vector-icons';

interface Task {
    id: number;
    title: string;
    event_id: number | null;
    due_date: string | null;
    due_time: string | null;
    is_done: boolean;
    created_at: string;
    completed_at: string | null;
    event_title: string | null;
}

export default function TaskScreen() {
    const { theme = DarkTheme } = useTheme() || {};
    const [tasks, setTasks] = useState<Task[]>([]);
    const [history, setHistory] = useState<Task[]>([]);
    const [activeTab, setActiveTab] = useState<'pending' | 'today_done' | 'history'>('pending');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);

    // 編集・作成
    const [modalVisible, setModalVisible] = useState(false);
    const [editMode, setEditMode] = useState<'create' | 'edit'>('create');
    const [currentTaskId, setCurrentTaskId] = useState<number | null>(null);
    const [inputTitle, setInputTitle] = useState('');
    const [inputTime, setInputTime] = useState('');

    const todayStr = new Date().toISOString().split('T')[0];

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [activeTab])
    );

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'history') {
                const data = await api.getTaskHistory();
                setHistory(data);
            } else {
                const data = await api.getTasks(undefined, false);
                setTasks(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

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
                    await scheduleReminder(res.id, inputTitle.trim(), `${todayStr}T${inputTime}:00`, [60]);
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
            Alert.alert('エラー', 'タスクの保存に失敗したわ…');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (task: Task) => {
        try {
            const nextDone = !task.is_done;
            await api.updateTask(task.id, { is_done: nextDone });
            loadData();
        } catch {
            Alert.alert('エラー', '更新できなかったわ…');
        }
    };

    const handleDelete = (id: number) => {
        Alert.alert('削除確認', 'このタスクを消しちゃうの？', [
            { text: 'キャンセル', style: 'cancel' },
            {
                text: '削除',
                style: 'destructive',
                onPress: async () => {
                    await api.deleteTask(id);
                    loadData();
                }
            }
        ]);
    };

    // フィルタリング
    const filteredPending = useMemo(() =>
        tasks.filter(t => !t.is_done && t.title.toLowerCase().includes(searchQuery.toLowerCase())),
        [tasks, searchQuery]);

    const filteredTodayDone = useMemo(() =>
        tasks.filter(t => t.is_done && t.title.toLowerCase().includes(searchQuery.toLowerCase())),
        [tasks, searchQuery]);

    const groupedHistory = useMemo(() => {
        const query = searchQuery.toLowerCase();
        const matched = history.filter(t => t.title.toLowerCase().includes(query));

        const sections: { title: string; data: Task[] }[] = [];
        matched.forEach(t => {
            const date = t.due_date || t.created_at.split('T')[0];
            const found = sections.find(s => s.title === date);
            if (found) found.data.push(t);
            else sections.push({ title: date, data: [t] });
        });
        return sections.sort((a, b) => b.title.localeCompare(a.title));
    }, [history, searchQuery]);

    const renderTaskItem = ({ item }: { item: Task }) => (
        <TouchableOpacity
            style={[styles.taskCard, { backgroundColor: theme.surfaceLight }]}
            onPress={() => handleToggle(item)}
            onLongPress={() => {
                setEditMode('edit');
                setCurrentTaskId(item.id);
                setInputTitle(item.title);
                setInputTime(item.due_time || '');
                setModalVisible(true);
            }}
            activeOpacity={0.7}
        >
            <View style={styles.taskRow}>
                <View style={[styles.checkbox, { borderColor: theme.primary }, item.is_done && { backgroundColor: theme.success, borderColor: theme.success }]}>
                    {item.is_done && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <View style={styles.taskInfo}>
                    <Text style={[styles.taskTitle, { color: theme.text }, item.is_done && styles.taskTitleDone]}>
                        {item.title}
                    </Text>
                    {item.due_time && (
                        <Text style={[styles.taskTime, { color: theme.primary }]}>⏰ {item.due_time}</Text>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                <Text style={[styles.headerTitle, { color: theme.text }]}>✅ タスク管理</Text>
                <TouchableOpacity style={[styles.addButton, { backgroundColor: theme.primary }]} onPress={() => {
                    setEditMode('create');
                    setInputTitle('');
                    setInputTime('');
                    setModalVisible(true);
                }}>
                    <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* タブ切り替え */}
            <View style={styles.tabBar}>
                {(['pending', 'today_done', 'history'] as const).map(tab => (
                    <TouchableOpacity
                        key={tab}
                        onPress={() => setActiveTab(tab)}
                        style={[styles.tabItem, activeTab === tab && { borderBottomColor: theme.primary }]}
                    >
                        <Text style={[styles.tabText, { color: activeTab === tab ? theme.primary : theme.textMuted }]}>
                            {tab === 'pending' ? '未達成' : tab === 'today_done' ? '完了' : '履歴'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* 検索バー */}
            <View style={[styles.searchArea, { backgroundColor: theme.surfaceLight }]}>
                <Ionicons name="search" size={18} color={theme.textMuted} />
                <TextInput
                    style={[styles.searchInput, { color: theme.text }]}
                    placeholder="何を探してるの？"
                    placeholderTextColor={theme.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {activeTab === 'history' ? (
                <SectionList
                    sections={groupedHistory}
                    keyExtractor={item => String(item.id)}
                    renderItem={renderTaskItem}
                    renderSectionHeader={({ section: { title } }) => (
                        <Text style={[styles.sectionHeader, { color: theme.primary, backgroundColor: theme.background }]}>
                            🗓️ {title}
                        </Text>
                    )}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={<Text style={styles.emptyText}>履歴はないわよ？</Text>}
                />
            ) : (
                <FlatList
                    data={activeTab === 'pending' ? filteredPending : filteredTodayDone}
                    renderItem={renderTaskItem}
                    keyExtractor={item => String(item.id)}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={<Text style={styles.emptyText}>何もないわね…</Text>}
                />
            )}

            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
                    <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>
                            {editMode === 'create' ? 'タスクを追加' : 'タスクを編集'}
                        </Text>
                        <TextInput
                            style={[styles.modalInput, { color: theme.text, borderColor: theme.border }]}
                            value={inputTitle}
                            onChangeText={setInputTitle}
                            placeholder="何をするの？"
                            placeholderTextColor={theme.textMuted}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.modalBtn} onPress={() => setModalVisible(false)}>
                                <Text style={{ color: theme.textSecondary }}>キャンセル</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.primary }]} onPress={handleSaveTask}>
                                <Text style={{ color: '#fff' }}>保存♡</Text>
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
    header: { paddingTop: 60, paddingBottom: 15, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1 },
    headerTitle: { fontSize: 20, fontWeight: '800' },
    addButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    tabBar: { flexDirection: 'row', paddingHorizontal: 10 },
    tabItem: { flex: 1, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 3, borderBottomColor: 'transparent' },
    tabText: { fontSize: 13, fontWeight: '700' },
    searchArea: { flexDirection: 'row', alignItems: 'center', margin: 15, paddingHorizontal: 15, borderRadius: 12, height: 40 },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 14 },
    listContent: { paddingHorizontal: 20, paddingBottom: 100 },
    taskCard: { padding: 15, borderRadius: 15, marginBottom: 10 },
    taskRow: { flexDirection: 'row', alignItems: 'center' },
    checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, marginRight: 15, alignItems: 'center', justifyContent: 'center' },
    taskInfo: { flex: 1 },
    taskTitle: { fontSize: 16, fontWeight: '600' },
    taskTitleDone: { textDecorationLine: 'line-through', opacity: 0.5 },
    taskTime: { fontSize: 12, fontWeight: '700', marginTop: 4 },
    sectionHeader: { fontSize: 12, fontWeight: '800', paddingVertical: 10, marginTop: 10 },
    emptyText: { textAlign: 'center', marginTop: 50, opacity: 0.5 },
    modalOverlay: { flex: 1, justifyContent: 'center', padding: 20 },
    modalContent: { padding: 25, borderRadius: 20 },
    modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 20 },
    modalInput: { borderWidth: 1, borderRadius: 12, padding: 15, marginBottom: 20, fontSize: 16 },
    modalButtons: { flexDirection: 'row', gap: 15 },
    modalBtn: { flex: 1, padding: 15, borderRadius: 12, alignItems: 'center' },
});

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 50,
        paddingBottom: Spacing.md,
        paddingHorizontal: Spacing.lg,
        borderBottomWidth: 1,
    },
    headerTitle: { fontSize: FontSize.xl, fontWeight: '700' },
    headerButtons: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    historyToggleButton: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: BorderRadius.md, borderWidth: 1 },
    historyToggleText: { fontSize: FontSize.xs, fontWeight: '700' },
    addButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    addButtonText: { color: '#fff', fontSize: 20, fontWeight: '700' },
    progressSection: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, gap: Spacing.md },
    progressBar: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 3 },
    progressText: { fontSize: FontSize.xs, fontWeight: '600' },
    listContent: { padding: Spacing.lg, paddingBottom: 100 },
    taskCard: { borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm, elevation: 1 },
    taskRow: { flexDirection: 'row', alignItems: 'center' },
    checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
    checkmark: { color: '#fff', fontSize: 12, fontWeight: '700' },
    taskInfo: { flex: 1 },
    taskTitle: { fontSize: FontSize.md, fontWeight: '500' },
    taskTitleDone: { textDecorationLine: 'line-through', opacity: 0.6 },
    taskMeta: { flexDirection: 'row', gap: Spacing.md, marginTop: 4 },
    taskTime: { fontSize: 11, fontWeight: '700' },
    taskEvent: { fontSize: 11 },
    taskDate: { fontSize: 10, marginTop: 2 },
    emptyState: { paddingVertical: 100, alignItems: 'center' },
    emptyEmoji: { fontSize: 48, marginBottom: Spacing.md },
    emptyText: { fontSize: FontSize.md, textAlign: 'center' },
    modalOverlay: { flex: 1, justifyContent: 'center', padding: Spacing.lg },
    modalContent: { borderRadius: BorderRadius.xl, padding: Spacing.xl, elevation: 5 },
    modalTitle: { fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing.lg },
    modalInput: { borderRadius: BorderRadius.md, padding: Spacing.md, fontSize: FontSize.md, borderWidth: 1, marginBottom: Spacing.md },
    timeInputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg, gap: Spacing.md },
    timeLabel: { fontSize: FontSize.md },
    timeInput: { borderRadius: BorderRadius.md, padding: Spacing.sm, fontSize: FontSize.md, borderWidth: 1, width: 80, textAlign: 'center' },
    modalButtons: { flexDirection: 'row', gap: Spacing.md },
    modalCancel: { flex: 1, padding: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center' },
    modalCancelText: { fontWeight: '600' },
    modalSubmit: { flex: 1, padding: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center' },
    modalSubmitText: { color: '#fff', fontWeight: '700' },
});
