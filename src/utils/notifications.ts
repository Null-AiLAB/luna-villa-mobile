/**
 * 🔔 Luna Villa — 通知ユーティリティ
 * ローカルプッシュ通知の設定。
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { getRandomMessage } from './notificationMessages';
import { debugStore } from './debugStore';

// 通知の初期化状況
let isInitialized = false;

function ensureInitialized() {
    if (isInitialized) return;
    try {
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldPlaySound: true,
                shouldSetBadge: false,
                shouldShowBanner: true,
                shouldShowList: true,
            }),
        });
        isInitialized = true;
    } catch (e) {
        console.error('Notification init error:', e);
    }
}

/**
 * 通知の初期設定と権限のリクエスト
 */
export async function registerForPushNotificationsAsync() {
    let token;

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            console.log('Failed to get push token for push notification!');
            return;
        }
    }

    if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    return token;
}

/**
 * 即座にローカル通知を送る（テスト用）
 */
export async function scheduleTestNotification() {
    ensureInitialized();
    await Notifications.scheduleNotificationAsync({
        content: {
            title: "おーい、ぬるくん！🌙",
            body: getRandomMessage('poke'),
            data: { type: 'test' },
        },
        trigger: null, // 即時
    });
}

/**
 * 予定やタスクのリマインダーをスケジュールする
 * @param id 予定/タスクのID
 * @param title タイトル
 * @param dateStr 予定時刻 (ISO string)
 * @param minutesBefore 何分前に通知するか（配列）
 */
export async function scheduleReminder(id: number, title: string, dateStr: string, minutesBefore: number[] = [30, 10]) {
    ensureInitialized();
    // 既存の通知があればキャンセル（簡易的にIDをキーワードにする）
    await Notifications.cancelAllScheduledNotificationsAsync();

    const targetDate = new Date(dateStr);
    const virtualHour = await debugStore.getVirtualHour();
    const hour = virtualHour !== null ? virtualHour : new Date().getHours();

    // 時間帯によるカテゴリー選択
    let category: 'morning' | 'night' | 'reminder' = 'reminder';
    if (hour >= 5 && hour < 11) category = 'morning';
    else if (hour >= 22 || hour < 5) category = 'night';

    for (const mins of minutesBefore) {
        const triggerDate = new Date(targetDate.getTime() - mins * 60000);
        if (triggerDate > new Date()) {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: `【あと${mins}分】${title}🌙`,
                    body: getRandomMessage(mins <= 10 ? 'reminder' : category),
                    data: { id, type: 'reminder' },
                },
                trigger: { date: triggerDate, type: 'date' } as Notifications.DateTriggerInput,
            });
        }
    }
}
