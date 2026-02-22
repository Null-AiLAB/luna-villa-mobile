import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Spacing, FontSize, BorderRadius, useTheme, DarkTheme } from '../theme';
import { api } from '../api';

interface Props {
    onLogin: () => void;
}

export default function LoginScreen({ onLogin }: { onLogin: () => void }) {
    const { theme = DarkTheme } = useTheme() || {};
    const [password, setPassword] = useState('');
    const [serverUrl, setServerUrl] = useState(api.getServerUrl());
    const [loading, setLoading] = useState(false);
    const [showServer, setShowServer] = useState(false);

    const handleLogin = async () => {
        if (!password.trim()) return;

        setLoading(true);
        try {
            if (serverUrl !== api.getServerUrl()) {
                api.setServerUrl(serverUrl);
            }

            const result = await api.login(password);
            setLoading(false);

            if (result === 'success') {
                onLogin();
            } else if (result === 'wrong_password') {
                Alert.alert('ログイン失敗', 'パスワードが違うわ！');
            } else {
                Alert.alert('通信エラー', 'サーバーに接続できないわ…。TailscaleがONになってるか、IPアドレスが正しいか確認してね！');
            }
        } catch (err) {
            setLoading(false);
            Alert.alert('エラー', '予期せぬエラーが発生したわ…');
        }
    };

    return (
        <LinearGradient
            colors={['#0D0B1A', '#1A1240', '#0D0B1A']}
            style={styles.container}
        >
            <KeyboardAvoidingView
                style={styles.inner}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={styles.header}>
                    <Text style={styles.moon}>🌙</Text>
                    <Text style={[styles.title, { color: theme.primary }]}>Luna Villa</Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>るなの別荘へようこそ♡</Text>
                </View>

                <View style={[styles.card, { backgroundColor: theme.surfaceGlass, borderColor: theme.border }]}>
                    <TextInput
                        style={[styles.input, { backgroundColor: theme.surfaceLight, color: theme.text, borderColor: theme.border }]}
                        placeholder="パスワード"
                        placeholderTextColor={theme.textMuted}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        autoCapitalize="none"
                        onSubmitEditing={handleLogin}
                    />

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: theme.primary }, loading && styles.buttonDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                        activeOpacity={0.7}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>入室する♡</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setShowServer(!showServer)}
                        style={styles.serverToggle}
                    >
                        <Text style={[styles.serverToggleText, { color: theme.textMuted }]}>
                            {showServer ? '▲ サーバー設定' : '▼ サーバー設定'}
                        </Text>
                    </TouchableOpacity>

                    {showServer && (
                        <TextInput
                            style={[styles.input, styles.serverInput, { backgroundColor: theme.surfaceLight, color: theme.text, borderColor: theme.border }]}
                            placeholder="http://100.x.x.x:8000"
                            placeholderTextColor={theme.textMuted}
                            value={serverUrl}
                            onChangeText={setServerUrl}
                            autoCapitalize="none"
                            keyboardType="url"
                        />
                    )}
                </View>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    inner: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: Spacing.xl,
    },
    header: {
        alignItems: 'center',
        marginBottom: Spacing.xxl,
    },
    moon: {
        fontSize: 64,
        marginBottom: Spacing.md,
    },
    title: {
        fontSize: FontSize.title,
        fontWeight: '700',
        letterSpacing: 2,
    },
    subtitle: {
        fontSize: FontSize.lg,
        marginTop: Spacing.sm,
    },
    card: {
        borderRadius: BorderRadius.xl,
        padding: Spacing.xl,
        borderWidth: 1,
    },
    input: {
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        fontSize: FontSize.lg,
        borderWidth: 1,
        marginBottom: Spacing.md,
    },
    button: {
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        alignItems: 'center',
        marginTop: Spacing.sm,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#fff',
        fontSize: FontSize.lg,
        fontWeight: '600',
    },
    serverToggle: {
        alignItems: 'center',
        marginTop: Spacing.md,
        paddingVertical: Spacing.sm,
    },
    serverToggleText: {
        fontSize: FontSize.sm,
    },
    serverInput: {
        marginBottom: 0,
    },
});
