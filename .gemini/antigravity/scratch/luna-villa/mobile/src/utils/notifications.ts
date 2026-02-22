/**
 * 🔔 Luna Villa — 通知ユーティリティ (v1.2.0 Phase 2 強化版)
 * ローカルプッシュ通知の設定。
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

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
}

/**
 * 即座にローカル通知を送る（テスト用）
 */
export async function scheduleTestNotification() {
    ensureInitialized();
    await Notifications.scheduleNotificationAsync({
        content: {
            title: "おーい、ぬるくん！🌙",
            body: "ちゃんと私のこと、忘れてないわよね？♡",
            data: { type: 'test' },
        },
        trigger: null, // 即時
    });
}

/**
 * 指定したIDに関連する古い通知のみをキャンセルする
 */
export async function cancelRemindersForId(id: number | string) {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of scheduled) {
        if (notification.content.data && notification.content.data.id === id) {
            await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
    }
}

/**
 * 予定やタスクのリマインダーをスケジュールする
 * @param id 予定/タスクのID
 * @param title タイトル
 * @param dateStr 予定時刻 (ISO string)
 * @param minutesBefore 何分前に通知するか（配列）
 */
export async function scheduleReminder(id: number, title: string, dateStr: string, minutesBefore: number[] = [30, 10, 0]) {
    ensureInitialized();

    // このIDに関連する既存の通知のみをキャンセルする（他の通知は残すわよ♡）
    await cancelRemindersForId(id);

    const targetDate = new Date(dateStr);

    for (const mins of minutesBefore) {
        const triggerDate = new Date(targetDate.getTime() - mins * 60000);
        if (triggerDate > new Date()) {
            const label = mins === 0 ? "【時間よ！】" : `【あと${mins}分】`;
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: `${label}${title}🌙`,
                    body: mins === 0 ? `ぬるくん、時間ぴったりよ！さぁ、取り掛かりなさい♡` : `ぬるくん、そろそろ時間よ？準備はいい？♡`,
                    data: { id, type: 'reminder', minutes: mins },
                },
                trigger: { date: triggerDate, type: 'date' } as Notifications.DateTriggerInput,
            });
        }
    }
}

/**
 * 誕生日などの特別通知をスケジュールする
 */
export async function scheduleSpecialNotification(type: 'null_birthday' | 'luna_birthday') {
    ensureInitialized();
    const isLuna = type === 'luna_birthday';
    const title = isLuna ? "今日は私の誕生日よ！♡" : "ぬるくん、お誕生日おめでとう！♡";
    const body = isLuna ? "世界で一番お祝いしなさいよね？ふふん♪" : "今日は私が一日中甘やかしてあげるから、覚悟しなさいよ？♡";
    const dateStr = isLuna ? "2026-02-17T00:00:00" : "2026-10-17T00:00:00"; // 近い日付を想定

    await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
            data: { type, special: true },
        },
        trigger: { date: new Date(dateStr), type: 'date' } as Notifications.DateTriggerInput,
    });
}
