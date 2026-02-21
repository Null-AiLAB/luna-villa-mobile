import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Spacing, FontSize, BorderRadius, useTheme } from '../theme'; import { api } from '../api';
import { scheduleReminder } from '../utils/notifications';

interface Task {
    id: number;
    title: string;
    event_id: number | null;
    due_date: string | null;
    due_time: string | null;
    is_done: boolean;
    created_at: string;
    event_title: string | null;
}

export default function TaskScreen() {
    const { theme } = useTheme();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [viewMode, setViewMode] = useState<'active' | 'history'>('active');

    // 編集・作成
    const [modalVisible, setModalVisible] = useState(false);
    const [editMode, setEditMode] = useState<'create' | 'edit'>('create');
    const [currentTaskId, setCurrentTaskId] = useState<number | null>(null);
    const [inputTitle, setInputTitle] = useState('');
    const [inputTime, setInputTime] = useState('');
    const [loading, setLoading] = useState(false);

    const today = new Date().toISOString().split('T')[0];

    useFocusEffect(
        useCallback(() => {
            if (viewMode === 'active') {
                loadTasks();
            } else {
                loadHistory();
            }
        }, [viewMode])
    );

    const loadTasks = async () => {
        setLoading(true);
        try {
            const data = await api.getTasks(undefined, false);
            setTasks(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadHistory = async () => {
        setLoading(true);
        try {
            const data = await api.getTaskHistory();
            setHistory(data);
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
                    due_date: today,
                    due_time: inputTime.trim() || null,
                });
                if (inputTime.trim()) {
                    await scheduleReminder(res.id, inputTitle.trim(), `${today}T${inputTime}:00`, [60]);
                }
            } else if (currentTaskId) {
                await api.updateTask(currentTaskId, {
                    title: inputTitle.trim(),
                    due_time: inputTime.trim() || null,
                });
                if (inputTime.trim()) {
                    await scheduleReminder(currentTaskId, inputTitle.trim(), `${today}T${inputTime}:00`, [60]);
                }
            }

            setModalVisible(false);
            loadTasks();
        } catch {
            Alert.alert('エラー', 'タスクの保存に失敗したわ…');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (task: Task) => {
        try {
            await api.updateTask(task.id, { is_done: !task.is_done });
            loadTasks();
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
                    if (viewMode === 'active') loadTasks(); else loadHistory();
                }
            }
        ]);
    };

    const openEdit = (task: Task) => {
        setEditMode('edit');
        setCurrentTaskId(task.id);
        setInputTitle(task.title);
        setInputTime(task.due_time || '');
        setModalVisible(true);
    };

    const openCreate = () => {
        setEditMode('create');
        setInputTitle('');
        setInputTime('');
        setModalVisible(true);
    };

    const doneCount = tasks.filter(t => t.is_done).length;
    const totalCount = tasks.length;

    const renderTask = ({ item }: { item: Task }) => (
        <TouchableOpacity
            style={[styles.taskCard, { backgroundColor: theme.surfaceLight }]}
            onPress={() => handleToggle(item)}
            onLongPress={() => openEdit(item)}
            activeOpacity={0.7}
        >
            <View style={styles.taskRow}>
                <View style={[styles.checkbox, { borderColor: theme.primary }, item.is_done && { backgroundColor: theme.success, borderColor: theme.success }]}>
                    {item.is_done && <Text style={styles.checkmark}>✓</Text>}
                </View>

                <View style={styles.taskInfo}>
                    <Text style={[styles.taskTitle, { color: theme.text }, item.is_done && styles.taskTitleDone]}>
                        {item.title}
                    </Text>
                    <View style={styles.taskMeta}>
                        {item.due_time && (
                            <Text style={[styles.taskTime, { color: theme.primary }]}>⏰ {item.due_time}</Text>
                        )}
                        {item.event_title && (
                            <Text style={[styles.taskEvent, { color: theme.textSecondary }]}>📅 {item.event_title}</Text>
                        )}
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderHistoryItem = ({ item }: { item: any }) => (
        <View style={[styles.taskCard, { backgroundColor: theme.surfaceLight, opacity: 0.8 }]}>
            <View style={styles.taskRow}>
                <View style={[styles.checkbox, { backgroundColor: theme.textMuted, borderColor: theme.textMuted }]}>
                    <Text style={styles.checkmark}>✓</Text>
                </View>
                <View style={styles.taskInfo}>
                    <Text style={[styles.taskTitle, { color: theme.text, textDecorationLine: 'line-through' }]}>
                        {item.title}
                    </Text>
                    <Text style={[styles.taskDate, { color: theme.textMuted }]}>
                        完了: {item.due_date} {item.due_time || ''}
                    </Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(item.id)}>
                    <Text style={{ color: theme.error }}>🗑️</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                <View>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>✅ タスク</Text>
                </View>
                <View style={styles.headerButtons}>
                    <TouchableOpacity
                        style={[styles.historyToggleButton, { borderColor: theme.border }]}
                        onPress={() => setViewMode(viewMode === 'active' ? 'history' : 'active')}
                    >
                        <Text style={[styles.historyToggleText, { color: theme.primary }]}>
                            {viewMode === 'active' ? '履歴 📜' : '戻る ←'}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.addButton, { backgroundColor: theme.primary }]}
                        onPress={openCreate}
                    >
                        <Text style={styles.addButtonText}>＋</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {viewMode === 'active' && totalCount > 0 && (
                <View style={styles.progressSection}>
                    <View style={[styles.progressBar, { backgroundColor: theme.surfaceLight }]}>
                        <View
                            style={[
                                styles.progressFill,
                                { backgroundColor: theme.success, width: `${(doneCount / totalCount) * 100}%` },
                            ]}
                        />
                    </View>
                    <Text style={[styles.progressText, { color: theme.textSecondary }]}>
                        {doneCount}/{totalCount}
                    </Text>
                </View>
            )}

            <FlatList
                data={viewMode === 'active' ? tasks : history}
                renderItem={viewMode === 'active' ? renderTask : renderHistoryItem}
                keyExtractor={item => String(item.id)}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyEmoji}>{viewMode === 'active' ? '🎉' : '🦗'}</Text>
                        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                            {viewMode === 'active'
                                ? '全部完了！ 偉いわね、ぬるくん♡'
                                : '履歴はまだないわよ？'}
                        </Text>
                    </View>
                }
                refreshing={loading}
                onRefresh={viewMode === 'active' ? loadTasks : loadHistory}
            />

            <Modal visible={modalVisible} animationType="fade" transparent>
                <View style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}>
                    <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>
                            {editMode === 'create' ? '✅ タスクを追加' : '✅ タスクを編集'}
                        </Text>

                        <TextInput
                            style={[styles.modalInput, { backgroundColor: theme.surfaceLight, color: theme.text, borderColor: theme.border }]}
                            placeholder="何をするの？"
                            placeholderTextColor={theme.textMuted}
                            value={inputTitle}
                            onChangeText={setInputTitle}
                        />

                        <View style={styles.timeInputRow}>
                            <Text style={[styles.timeLabel, { color: theme.textSecondary }]}>期限時刻:</Text>
                            <TextInput
                                style={[styles.timeInput, { backgroundColor: theme.surfaceLight, color: theme.text, borderColor: theme.border }]}
                                placeholder="18:00"
                                placeholderTextColor={theme.textMuted}
                                value={inputTime}
                                onChangeText={setInputTime}
                                keyboardType="numbers-and-punctuation"
                                maxLength={5}
                            />
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalCancel, { backgroundColor: theme.surfaceLight }]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={[styles.modalCancelText, { color: theme.textSecondary }]}>キャンセル</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalSubmit, { backgroundColor: theme.primary }]}
                                onPress={handleSaveTask}
                            >
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
