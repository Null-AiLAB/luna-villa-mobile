/**
 * 📝 Luna Villa — ロギングユーティリティ
 * アプリ内のログを収集し、必要に応じてバックエンドに送信する。
 */

import { api } from '../api';

const MAX_LOGS = 100;
let logs: string[] = [];

function addLog(level: string, message: any, ...args: any[]) {
    const timestamp = new Date().toISOString();
    const formatted = `[${timestamp}] [${level}] ${message} ${args.map(a => JSON.stringify(a)).join(' ')}`;
    logs.push(formatted);
    if (logs.length > MAX_LOGS) logs.shift();
}

// console を乗っ取る
const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;

export function initLogger() {
    console.log = (...args) => {
        addLog('LOG', args[0], ...args.slice(1));
        originalLog.apply(console, args);
    };
    console.warn = (...args) => {
        addLog('WARN', args[0], ...args.slice(1));
        originalWarn.apply(console, args);
    };
    console.error = (...args) => {
        addLog('ERROR', args[0], ...args.slice(1));
        originalError.apply(console, args);
    };
}

export async function sendLogs() {
    if (logs.length === 0) return;
    try {
        const res = await fetch(`${api.getServerUrl()}/api/debug/logs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ logs }),
        });
        if (res.ok) {
            logs = []; // 送信成功したらクリア
            return true;
        }
    } catch (e) {
        originalError('Log transmission failed:', e);
    }
    return false;
}

export function getLogs() {
    return logs;
}
