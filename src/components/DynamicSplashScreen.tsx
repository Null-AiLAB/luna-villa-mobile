import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { useTheme, DarkTheme } from '../theme';
import { getCurrentHour } from '../utils/debugStore';

const { width, height } = Dimensions.get('window');

export default function DynamicSplashScreen({ onFinish }: { onFinish: () => void }) {
    const { theme = DarkTheme } = useTheme() || {};
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const [greeting, setGreeting] = useState("おかえり、ぬるくん♡");

    useEffect(() => {
        const init = async () => {
            const hour = await getCurrentHour();
            if (hour >= 5 && hour < 11) setGreeting("おはよう、ぬるくん♡");
            else if (hour >= 11 && hour < 17) setGreeting("こんにちは、ぬるくん♡");
            else if (hour >= 17 && hour < 22) setGreeting("こんばんは、ぬるくん♡");
            else setGreeting("まだ起きてたの、ぬるくん？♡");

            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
                Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
            ]).start();
        };
        init();

        // 2.5秒後にフェードアウトして終了
        const timer = setTimeout(() => {
            Animated.timing(fadeAnim, { toValue: 0, duration: 600, useNativeDriver: true }).start(() => {
                onFinish();
            });
        }, 2500);

        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
                <Text style={[styles.title, { color: theme.primary }]}>Luna Villa</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                    {greeting}
                </Text>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    emoji: {
        fontSize: 80,
        marginBottom: 20,
    },
    title: {
        fontSize: 42,
        fontWeight: '900',
        letterSpacing: 4,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 18,
        marginTop: 20,
        fontWeight: '600',
        textAlign: 'center',
    },
});
