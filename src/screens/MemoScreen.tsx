import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    Modal,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Spacing, FontSize, BorderRadius } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import { api } from '../api';

interface Memo {
    id: number;
    title: string;
    content: string;
    created_at: string;
}

export default function MemoScreen() {
    const { theme } = useTheme();
    const [memos, setMemos] = useState<Memo[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);

    // 編集・作成用
    const [modalVisible, setModalVisible] = useState(false);
    const [editMode, setEditMode] = useState<'create' | 'edit'>('create');
    const [currentMemoId, setCurrentMemoId] = useState<number | null>(null);
    const [inputTitle, setInputTitle] = useState('');
    const [inputContent, setInputContent] = useState('');

    useFocusEffect(
        useCallback(() => {
            loadMemos();
        }, [])
    );

    const loadMemos = async () => {
        setLoading(true);
        try {
            const data = await api.getMemos();
            setMemos(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!inputContent.trim()) {
            Alert.alert('エラー', '内容は入力してね？');
            return;
        }

        try {
            if (editMode === 'create') {
                await api.saveMemo(inputContent, inputTitle);
            } else if (currentMemoId) {
                await api.updateMemo(currentMemoId, { title: inputTitle, content: inputContent });
            }
            setModalVisible(false);
            loadMemos();
        } catch (err) {
            Alert.alert('エラー', '保存に失敗しちゃったわ…');
        }
    };

    const handleDelete = (id: number) => {
        Alert.alert('削除確認', 'このメモを消しちゃうの？', [
            { text: 'キャンセル', style: 'cancel' },
            {
                text: '削除',
                style: 'destructive',
                onPress: async () => {
                    await api.deleteMemo(id);
                    loadMemos();
                }
            }
        ]);
    };

    const handleLongPress = (id: number) => {
        setIsSelectionMode(true);
        toggleSelection(id);
    };

    const toggleSelection = (id: number) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
        if (newSet.size === 0) setIsSelectionMode(false);
    };

    const handleSyncToPc = async () => {
        if (selectedIds.size === 0) return;

        try {
            setLoading(true);
            for (const id of selectedIds) {
                await api.syncMemoToPc(id);
            }
            Alert.alert('送信完了', '選択したメモをPCの私に送っておいたわ！♡');
            setIsSelectionMode(false);
            setSelectedIds(new Set());
        } catch {
            Alert.alert('エラー', '送信に失敗しちゃった…');
        } finally {
            setLoading(false);
        }
    };

    const openEdit = (memo: Memo) => {
        if (isSelectionMode) {
            toggleSelection(memo.id);
            return;
        }
        setEditMode('edit');
        setCurrentMemoId(memo.id);
        setInputTitle(memo.title);
        setInputContent(memo.content);
        setModalVisible(true);
    };

    const openCreate = () => {
        setEditMode('create');
        setInputTitle('');
        setInputContent('');
        setModalVisible(true);
    };

    const renderItem = ({ item }: { item: Memo }) => {
        const isSelected = selectedIds.has(item.id);

        return (
            <TouchableOpacity
                style={[
                    styles.memoCard,
                    { backgroundColor: theme.surfaceLight, borderColor: isSelected ? theme.primary : theme.border }
                ]}
                onPress={() => openEdit(item)}
                onLongPress={() => handleLongPress(item.id)}
                activeOpacity={0.7}
            >
                {item.title ? (
                    <Text style={[styles.memoTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
                ) : null}
                <Text style={[styles.memoContent, { color: theme.textSecondary }]} numberOfLines={3}>{item.content}</Text>
                <View style={styles.memoFooter}>
                    <Text style={[styles.memoDate, { color: theme.textMuted }]}>
                        {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                    {isSelectionMode && (
                        <View style={[styles.checkCircle, { borderColor: theme.border, backgroundColor: isSelected ? theme.primary : 'transparent' }]}>
                            {isSelected && <Text style={styles.checkText}>✓</Text>}
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                <Text style={[styles.headerTitle, { color: theme.text }]}>📌 メモ</Text>
                {isSelectionMode && (
                    <TouchableOpacity onPress={handleSyncToPc} style={styles.syncButton}>
                        <Text style={[styles.syncButtonText, { color: theme.primary }]}>PC送信 ↗</Text>
                    </TouchableOpacity>
                )}
            </View>

            {loading && memos.length === 0 ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                <FlatList
                    data={memos}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    numColumns={2}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                                まだメモがないわよ？{"\n"}チャットでピン留めするか、新しく作ってね♡
                            </Text>
                        </View>
                    }
                />
            )}

            {!isSelectionMode && (
                <TouchableOpacity
                    style={[styles.fab, { backgroundColor: theme.primary }]}
                    onPress={openCreate}
                >
                    <Text style={styles.fabText}>+</Text>
                </TouchableOpacity>
            )}

            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={[styles.modalContent, { backgroundColor: theme.surface }]}
                    >
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>
                                {editMode === 'create' ? '新規メモ' : 'メモ編集'}
                            </Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Text style={[styles.closeText, { color: theme.textMuted }]}>閉じる</Text>
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={[styles.titleInput, { color: theme.text, borderBottomColor: theme.border }]}
                            placeholder="タイトル（任意）"
                            placeholderTextColor={theme.textMuted}
                            value={inputTitle}
                            onChangeText={setInputTitle}
                        />

                        <TextInput
                            style={[styles.contentInput, { color: theme.text }]}
                            placeholder="内容を入力してね♡"
                            placeholderTextColor={theme.textMuted}
                            value={inputContent}
                            onChangeText={setInputContent}
                            multiline
                            textAlignVertical="top"
                        />

                        <View style={styles.modalFooter}>
                            {editMode === 'edit' && currentMemoId && (
                                <TouchableOpacity
                                    style={[styles.deleteButton, { borderColor: theme.error }]}
                                    onPress={() => {
                                        setModalVisible(false);
                                        handleDelete(currentMemoId);
                                    }}
                                >
                                    <Text style={[styles.deleteButtonText, { color: theme.error }]}>削除</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.primary }]} onPress={handleSave}>
                                <Text style={styles.saveButtonText}>保存</Text>
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingTop: 50,
        paddingBottom: Spacing.md,
        paddingHorizontal: Spacing.lg,
        borderBottomWidth: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: { fontSize: FontSize.xl, fontWeight: '700' },
    syncButton: { padding: Spacing.xs },
    syncButtonText: { fontWeight: '700', fontSize: FontSize.sm },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: Spacing.sm, paddingBottom: 100 },
    memoCard: {
        flex: 1,
        margin: Spacing.xs,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        minHeight: 120,
    },
    memoTitle: { fontSize: FontSize.md, fontWeight: '700', marginBottom: Spacing.xs },
    memoContent: { fontSize: FontSize.sm, lineHeight: 18 },
    memoFooter: { marginTop: 'auto', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: Spacing.xs },
    memoDate: { fontSize: 10 },
    checkCircle: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    checkText: { color: '#fff', fontSize: 10, fontWeight: '700' },
    emptyContainer: { flex: 1, alignItems: 'center', marginTop: 100 },
    emptyText: { textAlign: 'center', fontSize: FontSize.md, lineHeight: 24 },
    fab: {
        position: 'absolute',
        right: Spacing.lg,
        bottom: Spacing.lg,
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
    },
    fabText: { color: '#fff', fontSize: 32, fontWeight: '300' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, padding: Spacing.lg, height: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
    modalTitle: { fontSize: FontSize.lg, fontWeight: '700' },
    closeText: { fontSize: FontSize.md },
    titleInput: { fontSize: FontSize.lg, fontWeight: '700', paddingVertical: Spacing.sm, borderBottomWidth: 1, marginBottom: Spacing.md },
    contentInput: { flex: 1, fontSize: FontSize.md, lineHeight: 22 },
    modalFooter: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md, paddingBottom: Spacing.xl },
    deleteButton: { flex: 1, padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, alignItems: 'center' },
    deleteButtonText: { fontWeight: '600' },
    saveButton: { flex: 2, padding: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center' },
    saveButtonText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },
});
