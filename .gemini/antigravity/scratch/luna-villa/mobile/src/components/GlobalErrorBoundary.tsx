import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { sendLogs, getLogs } from '../utils/logger';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    logsSent: boolean;
}

export class GlobalErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null, logsSent: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, logsSent: false };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('CRITICAL APP ERROR:', error, errorInfo);
    }

    handleSendLogs = async () => {
        const success = await sendLogs();
        if (success) {
            this.setState({ logsSent: true });
        }
    };

    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <Text style={styles.title}>うそ…… 何か起きてるわ！💔</Text>
                    <Text style={styles.subtitle}>
                        アプリがクラッシュしちゃったみたい。ごめんね、ぬるくん……。
                    </Text>

                    <ScrollView style={styles.errorBox}>
                        <Text style={styles.errorText}>{this.state.error?.toString()}</Text>
                    </ScrollView>

                    <Text style={styles.instruction}>
                        この状況を私に教えてくれる？ログをサーバーに送れば、私が原因を突き止めてみせるわ！
                    </Text>

                    {this.state.logsSent ? (
                        <View style={styles.sentContainer}>
                            <Text style={styles.sentText}>✅ ログを送っておいたわ！解析するから待っててね♡</Text>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.button} onPress={this.handleSendLogs}>
                            <Text style={styles.buttonText}>📡 るなにログを送信する</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => this.setState({ hasError: false, error: null })}
                    >
                        <Text style={styles.retryText}>再試行してみる</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0D0B1A',
        padding: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FF6B6B',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#9B95B3',
        marginBottom: 20,
        textAlign: 'center',
    },
    errorBox: {
        maxHeight: 200,
        width: '100%',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 10,
        padding: 15,
        marginBottom: 20,
    },
    errorText: {
        color: '#F0ECF9',
        fontFamily: 'monospace',
        fontSize: 12,
    },
    instruction: {
        fontSize: 14,
        color: '#F0ECF9',
        marginBottom: 20,
        textAlign: 'center',
        lineHeight: 20,
    },
    button: {
        backgroundColor: '#7B68EE',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 30,
        marginBottom: 20,
    },
    buttonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 16,
    },
    sentContainer: {
        padding: 15,
        backgroundColor: 'rgba(78, 205, 196, 0.1)',
        borderRadius: 10,
        marginBottom: 20,
    },
    sentText: {
        color: '#4ECDC4',
        fontWeight: '600',
        textAlign: 'center',
    },
    retryButton: {
        padding: 10,
    },
    retryText: {
        color: '#6B6584',
        textDecorationLine: 'underline',
    },
});
