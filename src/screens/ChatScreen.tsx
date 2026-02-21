import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Animated,
    Image,
    ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { readAsStringAsync, EncodingType } from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Spacing, FontSize, BorderRadius, useTheme } from '../theme';
import { api } from '../api';

interface Message {
    id: string;
    role: 'user' | 'luna';
    content: string;
    timestamp: string;
    isMemo?: boolean;
}

export default function ChatScreen() {
    const { theme, isDarkMode } = useTheme();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [avatarUri, setAvatarUri] = useState<string | null>(null);
    const flatListRef = useRef<FlatList>(null);
    const streamingRef = useRef('');
    const blinkAnim = useRef(new Animated.Value(1)).current;

    // 履歴読み込み
    useEffect(() => {
        loadHistory();
        loadAvatar();
    }, []);

    const loadAvatar = async () => {
        const saved = await AsyncStorage.getItem('luna_avatar_uri');
        if (saved) setAvatarUri(saved);
    };

    const loadHistory = async () => {
        try {
            const history = await api.getHistory(50);
            const mapped = history.map((m: any) => ({
                id: String(m.id),
                role: m.role === 'user' ? 'user' : 'luna',
                content: m.content,
                timestamp: m.created_at,
                isMemo: m.is_memo,
            }));
            setMessages(mapped as Message[]);
        } catch (err) {
            console.error('Failed to load history', err);
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: false,
            quality: 0.8,
            base64: true,
        });

        if (!result.canceled && result.assets[0]) {
            setSelectedImage(result.assets[0].uri);
        }
    };

    const sendMessage = async () => {
        const text = input.trim();
        if ((!text && !selectedImage) || isStreaming) return;

        let imageData: string[] = [];
        if (selectedImage) {
            try {
                const base64 = await readAsStringAsync(selectedImage, {
                    encoding: EncodingType.Base64,
                });
                imageData = [base64];
            } catch (e) {
                console.error('Image read error:', e);
            }
        }

        const userMsg: Message = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: text || '📷 画像を送信しました',
            timestamp: new Date().toISOString(),
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setSelectedImage(null);
        setIsStreaming(true);
        scrollToBottom();

        const lunaId = `luna-${Date.now()}`;
        const lunaMsg: Message = {
            id: lunaId,
            role: 'luna',
            content: '',
            timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, lunaMsg]);
        streamingRef.current = '';

        await api.chat(
            text || 'この画像について教えて',
            imageData,
            (chunk: string) => {
                streamingRef.current += chunk;
                const currentContent = streamingRef.current;
                setMessages(prev =>
                    prev.map(m =>
                        m.id === lunaId ? { ...m, content: currentContent } : m
                    )
                );
                scrollToBottom();
            },
            () => {
                setIsStreaming(false);
                scrollToBottom();
            },
            (err: string) => {
                setIsStreaming(false);
                setMessages(prev =>
                    prev.map(m =>
                        m.id === lunaId
                            ? { ...m, content: `⚠️ ${err}` }
                            : m
                    )
                );
            }
        );
    };

    const saveMemo = async (content: string) => {
        try {
            await api.saveMemo(content);
            Alert.alert('📌 メモ保存', 'PCの私に伝えておくわね♡');
        } catch {
            Alert.alert('エラー', 'メモの保存に失敗したわ…');
        }
    };

    const formatTime = (ts: string) => {
        try {
            const d = new Date(ts);
            return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        } catch {
            return '';
        }
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isUser = item.role === 'user';

        return (
            <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
                {!isUser && (
                    <View style={[styles.avatar, { backgroundColor: theme.surfaceLight }]}>
                        {avatarUri ? (
                            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                        ) : (
                            <Text style={styles.avatarText}>👤</Text>
                        )}
                    </View>
                )}

                <View style={styles.messageContent}>
                    {!isUser && (
                        <Text style={[styles.messageName, { color: theme.primary }]}>るな</Text>
                    )}

                    <View style={[
                        styles.bubble,
                        isUser ? { backgroundColor: theme.bubbleUser, borderBottomRightRadius: 4 }
                            : { backgroundColor: theme.bubbleLuna, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: theme.border },
                    ]}>
                        <Text style={[
                            styles.bubbleText,
                            isUser ? { color: theme.bubbleUserText } : { color: theme.bubbleLunaText },
                        ]}>
                            {item.content || (isStreaming ? '...' : '')}
                        </Text>
                    </View>

                    <View style={[styles.metaRow, isUser && styles.metaRowUser]}>
                        <Text style={[styles.timestamp, { color: theme.textMuted }]}>{formatTime(item.timestamp)}</Text>
                        {!isUser && item.content && !isStreaming && (
                            <TouchableOpacity
                                onPress={() => saveMemo(item.content)}
                                style={styles.memoButton}
                                activeOpacity={0.6}
                            >
                                <Text style={styles.memoButtonText}>📌</Text>
                            </TouchableOpacity>
                        )}
                        {item.isMemo && (
                            <Text style={[styles.memoTag, { color: theme.accent }]}>📌 メモ</Text>
                        )}
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                <Text style={[styles.headerTitle, { color: theme.text }]}>るな</Text>
                <View style={[styles.statusDot, isStreaming ? { backgroundColor: theme.primary } : { backgroundColor: theme.success }]} />
                <Text style={[styles.headerStatus, { color: theme.textSecondary }]}>
                    {isStreaming ? 'typing...' : 'online'}
                </Text>
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={item => item.id}
                style={styles.messageList}
                contentContainerStyle={styles.messageListContent}
                onContentSizeChange={scrollToBottom}
                showsVerticalScrollIndicator={false}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={[styles.inputWrapper, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
                    {selectedImage && (
                        <View style={styles.previewContainer}>
                            <Image source={{ uri: selectedImage }} style={[styles.previewImage, { borderColor: theme.border }]} />
                            <TouchableOpacity
                                style={[styles.previewClose, { backgroundColor: theme.error }]}
                                onPress={() => setSelectedImage(null)}
                            >
                                <Text style={styles.previewCloseText}>✕</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={styles.inputArea}>
                        <TouchableOpacity
                            style={styles.imageButton}
                            onPress={pickImage}
                            activeOpacity={0.6}
                        >
                            <Text style={styles.imageButtonText}>📎</Text>
                        </TouchableOpacity>

                        <TextInput
                            style={[styles.input, { backgroundColor: theme.surfaceLight, color: theme.text, borderColor: theme.border }]}
                            placeholder="メッセージを入力..."
                            placeholderTextColor={theme.textMuted}
                            value={input}
                            onChangeText={setInput}
                            multiline
                            maxLength={2000}
                            onSubmitEditing={sendMessage}
                            blurOnSubmit={false}
                        />

                        <TouchableOpacity
                            style={[
                                styles.sendButton,
                                ((!input.trim() && !selectedImage) || isStreaming)
                                    ? { backgroundColor: theme.surfaceLight }
                                    : { backgroundColor: theme.primary }
                            ]}
                            onPress={sendMessage}
                            disabled={(!input.trim() && !selectedImage) || isStreaming}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.sendButtonText}>✈️</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 50,
        paddingBottom: Spacing.md,
        paddingHorizontal: Spacing.lg,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: FontSize.xl,
        fontWeight: '700',
        marginRight: Spacing.sm,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: Spacing.xs,
    },
    headerStatus: {
        fontSize: FontSize.sm,
    },
    messageList: {
        flex: 1,
    },
    messageListContent: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
    },
    messageRow: {
        flexDirection: 'row',
        marginBottom: Spacing.md,
        alignItems: 'flex-start',
    },
    messageRowUser: {
        justifyContent: 'flex-end',
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.sm,
        marginTop: Spacing.xs,
    },
    avatarText: {
        fontSize: 18,
    },
    avatarImage: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    messageContent: {
        maxWidth: '75%',
    },
    messageName: {
        fontSize: FontSize.xs,
        marginBottom: 2,
        fontWeight: '600',
    },
    bubble: {
        paddingVertical: Spacing.sm + 2,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.lg,
    },
    bubbleText: {
        fontSize: FontSize.md + 1,
        lineHeight: 22,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 3,
        gap: 6,
    },
    metaRowUser: {
        justifyContent: 'flex-end',
    },
    timestamp: {
        fontSize: FontSize.xs,
    },
    memoButton: {
        padding: 2,
    },
    memoButtonText: {
        fontSize: 14,
    },
    memoTag: {
        fontSize: FontSize.xs,
        fontWeight: '600',
    },
    inputWrapper: {
        borderTopWidth: 1,
        paddingBottom: Spacing.lg,
    },
    previewContainer: {
        padding: Spacing.sm,
        paddingLeft: Spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
    },
    previewImage: {
        width: 60,
        height: 60,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
    },
    previewClose: {
        position: 'absolute',
        top: 0,
        left: 55,
        width: 18,
        height: 18,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
    },
    previewCloseText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
    },
    inputArea: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
    },
    imageButton: {
        padding: Spacing.sm,
        marginRight: Spacing.xs,
        marginBottom: 2,
    },
    imageButtonText: {
        fontSize: 22,
    },
    input: {
        flex: 1,
        borderRadius: BorderRadius.xl,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm + 2,
        fontSize: FontSize.md,
        maxHeight: 120,
        borderWidth: 1,
    },
    sendButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: Spacing.sm,
    },
    sendButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
});
