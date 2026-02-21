import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    TextInput,
    Alert,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { Calendar, DateData, LocaleConfig } from 'react-native-calendars';
import { Spacing, FontSize, BorderRadius, useTheme, DarkTheme } from '../theme';
import { api } from '../api';
import { scheduleReminder } from '../utils/notifications';

// 日本語ロケール
LocaleConfig.locales['ja'] = {
    monthNames: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    monthNamesShort: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    dayNames: ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'],
    dayNamesShort: ['日', '月', '火', '水', '木', '金', '土'],
    today: '今日',
};
LocaleConfig.defaultLocale = 'ja';

interface CalEvent {
    id: number;
    title: string;
    description: string;
    start_at: string;
    end_at: string | null;
    added_by: string;
    created_at: string;
}

export default function CalendarScreen() {
    const { theme = DarkTheme } = useTheme() || {};
    const [selectedDate, setSelectedDate] = useState(
        new Date().toISOString().split('T')[0]
    );
    const [events, setEvents] = useState<CalEvent[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState<'create' | 'edit'>('create');
    const [currentEventId, setCurrentEventId] = useState<number | null>(null);

    const [inputTitle, setInputTitle] = useState('');
    const [inputDesc, setInputDesc] = useState('');
    const [inputTime, setInputTime] = useState('12:00');
    const [loading, setLoading] = useState(false);

    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        try {
            const now = new Date();
            const evts = await api.getEvents(now.getFullYear(), now.getMonth() + 1);
            setEvents(evts);
        } catch (err) {
            console.error('Failed to load events', err);
        }
    };

    const getMarkedDates = () => {
        const marks: Record<string, any> = {};

        marks[selectedDate] = {
            selected: true,
            selectedColor: theme.primary,
        };

        events.forEach(evt => {
            const date = evt.start_at.split('T')[0];
            const isLuna = evt.added_by === 'luna';
            if (marks[date]) {
                marks[date] = {
                    ...marks[date],
                    marked: true,
                    dotColor: isLuna ? theme.accent : theme.success,
                };
            } else {
                marks[date] = {
                    marked: true,
                    dotColor: isLuna ? theme.accent : theme.success,
                };
            }
        });

        return marks;
    };

    const selectedEvents = events.filter(
        evt => evt.start_at.split('T')[0] === selectedDate
    );

    const handleSaveEvent = async () => {
        if (!inputTitle.trim() || loading) return;

        setLoading(true);
        try {
            const startAt = `${selectedDate}T${inputTime}:00`;

            if (editMode === 'create') {
                const res = await api.createEvent({
                    title: inputTitle.trim(),
                    description: inputDesc.trim(),
                    start_at: startAt,
                    added_by: 'user',
                });
                // リマインダー設定 (30分前と10分前)
                await scheduleReminder(res.id, inputTitle.trim(), startAt, [30, 10]);
            } else if (currentEventId) {
                await api.updateEvent(currentEventId, {
                    title: inputTitle.trim(),
                    description: inputDesc.trim(),
                    start_at: startAt,
                });
                // リマインダー再設定
                await scheduleReminder(currentEventId, inputTitle.trim(), startAt, [30, 10]);
            }

            setShowModal(false);
            loadEvents();
        } catch (err) {
            Alert.alert('エラー', '保存に失敗したわ…');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteEvent = (id: number, title: string) => {
        Alert.alert(
            '予定を削除',
            `「${title}」を削除していい？`,
            [
                { text: 'キャンセル', style: 'cancel' },
                {
                    text: '削除',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.deleteEvent(id);
                            loadEvents();
                        } catch {
                            Alert.alert('エラー', '削除できなかったわ…');
                        }
                    },
                },
            ]
        );
    };

    const openEdit = (evt: CalEvent) => {
        setEditMode('edit');
        setCurrentEventId(evt.id);
        setInputTitle(evt.title);
        setInputDesc(evt.description);
        const timePart = evt.start_at.split('T')[1]?.substring(0, 5) || '12:00';
        setInputTime(timePart);
        setShowModal(true);
    };

    const openCreate = () => {
        setEditMode('create');
        setInputTitle('');
        setInputDesc('');
        setInputTime('12:00');
        setShowModal(true);
    };

    const formatTime = (dateStr: string) => {
        try {
            const d = new Date(dateStr);
            return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        } catch {
            return '';
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                <Text style={[styles.headerTitle, { color: theme.text }]}>📅 カレンダー</Text>
                <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: theme.primary }]}
                    onPress={openCreate}
                    activeOpacity={0.7}
                >
                    <Text style={styles.addButtonText}>＋</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView}>
                <View style={{ backgroundColor: theme.surface }}>
                    <Calendar
                        current={today}
                        onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
                        markedDates={getMarkedDates()}
                        onMonthChange={(month: DateData) => {
                            api.getEvents(month.year, month.month).then(setEvents);
                        }}
                        theme={{
                            calendarBackground: theme.surface,
                            textSectionTitleColor: theme.textSecondary,
                            selectedDayBackgroundColor: theme.primary,
                            selectedDayTextColor: '#ffffff',
                            todayTextColor: theme.primary,
                            dayTextColor: theme.text,
                            textDisabledColor: theme.textMuted,
                            monthTextColor: theme.text,
                            arrowColor: theme.primary,
                            textDayFontSize: 14,
                            textMonthFontSize: 16,
                            textDayHeaderFontSize: 12,
                        }}
                        style={styles.calendar}
                    />
                </View>

                <View style={styles.eventsSection}>
                    <Text style={[styles.eventsSectionTitle, { color: theme.text }]}>
                        {selectedDate === today ? '📌 今日の予定' : `📌 ${selectedDate}`}
                    </Text>

                    {selectedEvents.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={[styles.emptyText, { color: theme.textMuted }]}>予定はないわ♡</Text>
                        </View>
                    ) : (
                        selectedEvents.map(evt => (
                            <TouchableOpacity
                                key={evt.id}
                                style={[styles.eventCard, { backgroundColor: theme.surfaceLight, borderLeftColor: theme.primary }]}
                                onPress={() => openEdit(evt)}
                                onLongPress={() => handleDeleteEvent(evt.id, evt.title)}
                                activeOpacity={0.8}
                            >
                                <View style={styles.eventRow}>
                                    <View style={styles.timeCluster}>
                                        <Text style={[styles.eventTime, { color: theme.primary }]}>{formatTime(evt.start_at)}</Text>
                                    </View>
                                    <View style={styles.eventInfo}>
                                        <Text style={[styles.eventTitle, { color: theme.text }]}>
                                            {evt.added_by === 'luna' ? '🌙 ' : ''}{evt.title}
                                        </Text>
                                        {evt.description ? (
                                            <Text style={[styles.eventDesc, { color: theme.textSecondary }]} numberOfLines={2}>
                                                {evt.description}
                                            </Text>
                                        ) : null}
                                    </View>
                                </View>
                                <Text style={[styles.eventBy, { color: theme.textMuted }]}>
                                    {evt.added_by === 'luna' ? 'るな' : 'ぬるくん'}
                                </Text>
                            </TouchableOpacity>
                        ))
                    )}
                </View>
            </ScrollView>

            <Modal visible={showModal} animationType="slide" transparent>
                <View style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}>
                    <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>
                                {editMode === 'create' ? '📅 予定を追加' : '📅 予定を編集'}
                            </Text>
                            <TouchableOpacity onPress={() => setShowModal(false)}>
                                <Text style={[styles.closeText, { color: theme.textMuted }]}>閉じる</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.modalDate, { color: theme.primary }]}>{selectedDate}</Text>

                        <TextInput
                            style={[styles.modalInput, { backgroundColor: theme.surfaceLight, color: theme.text, borderColor: theme.border }]}
                            placeholder="タイトル"
                            placeholderTextColor={theme.textMuted}
                            value={inputTitle}
                            onChangeText={setInputTitle}
                            editable={!loading}
                        />

                        <View style={styles.timeInputRow}>
                            <Text style={[styles.timeLabel, { color: theme.textSecondary }]}>開始時刻:</Text>
                            <TextInput
                                style={[styles.timeInput, { backgroundColor: theme.surfaceLight, color: theme.text, borderColor: theme.border }]}
                                placeholder="12:00"
                                placeholderTextColor={theme.textMuted}
                                value={inputTime}
                                onChangeText={setInputTime}
                                keyboardType="numbers-and-punctuation"
                                maxLength={5}
                                editable={!loading}
                            />
                        </View>

                        <TextInput
                            style={[styles.modalInput, styles.modalInputMulti, { backgroundColor: theme.surfaceLight, color: theme.text, borderColor: theme.border }]}
                            placeholder="詳しく教えて？（任意）"
                            placeholderTextColor={theme.textMuted}
                            value={inputDesc}
                            onChangeText={setInputDesc}
                            multiline
                            editable={!loading}
                        />

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={[styles.modalSubmit, { backgroundColor: theme.primary }]}
                                onPress={handleSaveEvent}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.modalSubmitText}>
                                        {editMode === 'create' ? '追加♡' : '更新♡'}
                                    </Text>
                                )}
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
    addButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    addButtonText: { color: '#fff', fontSize: 20, fontWeight: '700' },
    scrollView: { flex: 1 },
    calendar: { paddingBottom: 10 },
    eventsSection: { padding: Spacing.lg },
    eventsSectionTitle: { fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing.md },
    emptyState: { paddingVertical: Spacing.xl, alignItems: 'center' },
    emptyText: { fontSize: FontSize.md },
    eventCard: { borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderLeftWidth: 3 },
    eventRow: { flexDirection: 'row', alignItems: 'flex-start' },
    timeCluster: { width: 55 },
    eventTime: { fontSize: FontSize.md, fontWeight: '700', marginTop: 2 },
    eventInfo: { flex: 1 },
    eventTitle: { fontSize: FontSize.md, fontWeight: '600' },
    eventDesc: { fontSize: FontSize.sm, marginTop: 2 },
    eventBy: { fontSize: FontSize.xs, textAlign: 'right', marginTop: Spacing.xs },
    modalOverlay: { flex: 1, justifyContent: 'center', padding: Spacing.lg },
    modalContent: { borderRadius: BorderRadius.xl, padding: Spacing.xl, elevation: 5 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
    modalTitle: { fontSize: FontSize.lg, fontWeight: '700' },
    closeText: { fontSize: FontSize.md },
    modalDate: { fontSize: FontSize.md, marginBottom: Spacing.lg },
    modalInput: { borderRadius: BorderRadius.md, padding: Spacing.md, fontSize: FontSize.md, borderWidth: 1, marginBottom: Spacing.md },
    timeInputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md, gap: Spacing.md },
    timeLabel: { fontSize: FontSize.md },
    timeInput: { borderRadius: BorderRadius.md, padding: Spacing.sm, fontSize: FontSize.md, borderWidth: 1, width: 80, textAlign: 'center' },
    modalInputMulti: { height: 80, textAlignVertical: 'top' },
    modalFooter: { marginTop: Spacing.md },
    modalSubmit: { padding: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
    modalSubmitText: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },
});
