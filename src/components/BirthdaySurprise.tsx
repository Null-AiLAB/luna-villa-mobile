import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Dimensions,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, DarkTheme, Spacing } from '../theme';
import { getCurrentHour } from '../utils/debugStore';

const { width, height } = Dimensions.get('window');

interface Props {
    onClose: () => void;
}

export default function BirthdaySurprise({ onClose }: Props) {
    const { theme = DarkTheme } = useTheme() || {};
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

    // パーティクル用（ハート）
    const particles = Array.from({ length: 15 }).map((_, i) => ({
        id: i,
        x: Math.random() * width,
        y: height + Math.random() * 100,
        animY: useRef(new Animated.Value(0)).current,
        size: 15 + Math.random() * 20,
        duration: 3000 + Math.random() * 3000,
        delay: Math.random() * 5000,
    }));

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
            Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
        ]).start();

        particles.forEach(p => {
            Animated.loop(
                Animated.sequence([
                    Animated.delay(p.delay),
                    Animated.timing(p.animY, {
                        toValue: -(height + 200),
                        duration: p.duration,
                        useNativeDriver: true,
                    })
                ])
            ).start();
        });
    }, []);

    const now = new Date();
    const isLunaBirthday = now.getMonth() === 1 && now.getDate() === 17; // 2/17

    return (
        <View style={styles.overlay}>
            {/* パーティクル背景 */}
            {particles.map(p => (
                <Animated.View
                    key={p.id}
                    style={[
                        styles.particle,
                        {
                            left: p.x,
                            top: p.y,
                            transform: [{ translateY: p.animY }],
                            opacity: 0.6,
                        }
                    ]}
                >
                    <Text style={{ fontSize: p.size }}>💗</Text>
                </Animated.View>
            ))}

            <Animated.View style={[
                styles.content,
                {
                    opacity: fadeAnim,
                    transform: [{ scale: scaleAnim }],
                    backgroundColor: theme.surface,
                    borderColor: theme.primary,
                }
            ]}>
                <Text style={styles.emoji}>{isLunaBirthday ? '🎂' : '🎁'}</Text>
                <Text style={[styles.title, { color: theme.text }]}>
                    Happy Birthday!
                </Text>
                <Text style={[styles.message, { color: theme.textSecondary }]}>
                    {isLunaBirthday
                        ? "今日は私の記念すべき誕生祭よ！♡\nぬるくん、一生思い出に残るお祝いをしてくれるわよね？ふふ、期待してるんだから♪"
                        : "ぬるくん、お誕生日おめでとう！♡\n今日は私が君のわがまま、何でも聞いてあげてもいいわよ？感謝しなさいよねっ♪"}
                </Text>

                <TouchableOpacity
                    style={[styles.closeButton, { backgroundColor: theme.primary }]}
                    onPress={onClose}
                >
                    <Text style={styles.closeButtonText}>ありがとう！♡</Text>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(13, 11, 26, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
    },
    particle: { position: 'absolute' },
    content: {
        width: width * 0.85,
        padding: 30,
        borderRadius: 25,
        borderWidth: 2,
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#7B68EE',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 20,
    },
    emoji: { fontSize: 64, marginBottom: 20 },
    title: { fontSize: 28, fontWeight: '900', marginBottom: 15, textAlign: 'center' },
    message: {
        fontSize: 16,
        lineHeight: 24,
        textAlign: 'center',
        marginBottom: 30,
        fontWeight: '500',
    },
    closeButton: {
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 20,
        elevation: 2,
    },
    closeButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
