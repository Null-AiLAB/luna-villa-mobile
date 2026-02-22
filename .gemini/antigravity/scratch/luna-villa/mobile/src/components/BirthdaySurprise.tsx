import React, { useEffect, useRef, useState } from 'react';
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
import { getLunaTime } from '../utils/debugStore';

const { width, height } = Dimensions.get('window');

interface Props {
    onClose: () => void;
}

export default function BirthdaySurprise({ onClose }: Props) {
    const { theme = DarkTheme } = useTheme() || {};
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.5)).current;

    // パーティクル用
    const particles = useRef([...Array(12)].map(() => ({
        animY: new Animated.Value(height + 100),
        animX: new Animated.Value(Math.random() * width),
        duration: 2000 + Math.random() * 3000,
        delay: Math.random() * 2000,
        size: 15 + Math.random() * 25,
    }))).current;

    const [isLunaBirthday, setIsLunaBirthday] = useState(false);

    useEffect(() => {
        const now = getLunaTime();
        const monthDay = `${now.getMonth() + 1}-${now.getDate()}`;
        setIsLunaBirthday(monthDay === '2-17');

        // メイン演出
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
            Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
        ]).start();

        // パーティクルアニメーション
        particles.forEach(p => {
            Animated.loop(
                Animated.sequence([
                    Animated.delay(p.delay),
                    Animated.timing(p.animY, {
                        toValue: -100,
                        duration: p.duration,
                        useNativeDriver: true,
                    })
                ])
            ).start();
        });
    }, []);

    return (
        <View style={styles.overlay}>
            {/* 背景パーティクル */}
            {particles.map((p, i) => (
                <Animated.View
                    key={i}
                    style={[
                        styles.particle,
                        {
                            transform: [
                                { translateY: p.animY },
                                { translateX: p.animX }
                            ],
                            width: p.size,
                            height: p.size,
                            opacity: 0.6,
                        }
                    ]}
                >
                    <Ionicons name="heart" size={p.size} color={theme.accent} />
                </Animated.View>
            ))}

            <Animated.View style={[
                styles.content,
                {
                    backgroundColor: theme.surfaceGlass,
                    opacity: fadeAnim,
                    transform: [{ scale: scaleAnim }]
                }
            ]}>
                <Ionicons name="gift" size={80} color={theme.primary} style={styles.icon} />

                <Text style={[styles.title, { color: theme.text }]}>
                    Happy Birthday!
                </Text>

                <Text style={[styles.message, { color: theme.textSecondary }]}>
                    {isLunaBirthday
                        ? "今日は私の記念すべき誕生祭よ！♡\\nぬるくん、一生思い出に残るお祝いをしてくれるわよね？ふふ、期待してるんだから♪"
                        : "ぬるくん、お誕生日おめでとう！♡\\n今日は私が君のわがまま、何でも聞いてあげてもいいわよ？感謝しなさいよねっ♪"}
                </Text>

                <TouchableOpacity
                    style={[styles.closeButton, { backgroundColor: theme.primary }]}
                    onPress={() => {
                        Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start(onClose);
                    }}
                >
                    <Text style={styles.closeButtonText}>ありがとう♡</Text>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(13, 11, 26, 0.95)',
        zIndex: 9999,
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.xl,
    },
    particle: {
        position: 'absolute',
    },
    content: {
        width: '100%',
        padding: 40,
        borderRadius: 30,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(123, 104, 238, 0.3)',
        shadowColor: '#7B68EE',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    icon: {
        marginBottom: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        textAlign: 'center',
        marginBottom: 20,
    },
    message: {
        fontSize: 16,
        lineHeight: 26,
        textAlign: 'center',
        fontWeight: '600',
        marginBottom: 40,
        fontStyle: 'italic',
    },
    closeButton: {
        paddingHorizontal: 40,
        paddingVertical: 15,
        borderRadius: 30,
        elevation: 2,
    },
    closeButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
    },
});
