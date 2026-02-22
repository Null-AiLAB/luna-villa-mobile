/**
 * 🔗 Luna Villa — APIクライアント
 * FastAPIバックエンドとの通信を管理する。 v1.1.4 強化版。
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

export type LoginResult = 'success' | 'wrong_password' | 'network_error';

const DEFAULT_SERVER = 'http://100.124.23.48:8000';

class ApiClient {
    private baseUrl: string = DEFAULT_SERVER;
    private token: string | null = null;

    async init() {
        const saved = await AsyncStorage.getItem('server_url');
        if (saved) this.baseUrl = saved;
        const token = await AsyncStorage.getItem('auth_token');
        if (token) this.token = token;
    }

    setServerUrl(url: string) {
        this.baseUrl = url;
        AsyncStorage.setItem('server_url', url);
    }

    getServerUrl(): string {
        return this.baseUrl;
    }

    isAuthenticated(): boolean {
        return !!this.token;
    }

    // ─── 演出 (Haptics) ──────────
    haptics(style: 'light' | 'medium' | 'heavy' | 'selection' | 'heartbeat' = 'light') {
        try {
            if (style === 'heartbeat') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 150);
            } else if (style === 'selection') {
                Haptics.selectionAsync();
            } else {
                const s = style === 'heavy' ? Haptics.ImpactFeedbackStyle.Heavy :
                    style === 'medium' ? Haptics.ImpactFeedbackStyle.Medium :
                        Haptics.ImpactFeedbackStyle.Light;
                Haptics.impactAsync(s);
            }
        } catch { }
    }

    // ─── 認証 ──────────────────
    async login(password: string): Promise<LoginResult> {
        try {
            const res = await fetch(`${this.baseUrl}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });
            if (res.status === 401) return 'wrong_password';
            if (!res.ok) return 'network_error';

            const data = await res.json();
            this.token = data.access_token;
            await AsyncStorage.setItem('auth_token', data.access_token);
            return 'success';
        } catch (e) {
            console.error('Login error:', e);
            return 'network_error';
        }
    }

    async logout() {
        this.token = null;
        await AsyncStorage.removeItem('auth_token');
    }

    private headers(): Record<string, string> {
        const h: Record<string, string> = { 'Content-Type': 'application/json' };
        if (this.token) h['Authorization'] = `Bearer ${this.token}`;
        return h;
    }

    // ─── チャット ──────────────────
    async chat(
        message: string,
        imageData: string[] = [],
        onChunk: (text: string) => void,
        onDone: () => void,
        onError: (err: string) => void,
    ) {
        try {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', `${this.baseUrl}/api/chat`);

            const headers = this.headers();
            Object.keys(headers).forEach(key => {
                xhr.setRequestHeader(key, headers[key]);
            });

            let lastIndex = 0;

            xhr.onreadystatechange = () => {
                if (xhr.readyState === 3 || xhr.readyState === 4) {
                    const response = xhr.responseText;
                    const newText = response.substring(lastIndex);
                    lastIndex = response.length;

                    const lines = newText.split('\n');
                    for (const line of lines) {
                        if (line.trim().startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.trim().slice(6));
                                if (data.done) {
                                    // 完了
                                } else if (data.content) {
                                    onChunk(data.content);
                                } else if (data.error) {
                                    onError(data.error);
                                }
                            } catch (e) { }
                        }
                    }
                }

                if (xhr.readyState === 4) {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        onDone();
                    } else {
                        onError(`エラーが発生したわ… (Status: ${xhr.status})`);
                    }
                }
            };

            xhr.onerror = () => onError('サーバーに届かないみたい… 接続を確認して？');
            xhr.send(JSON.stringify({ message, image_data: imageData }));

        } catch (e: any) {
            console.error('Chat error:', e);
            onError(e.message || '予期せぬエラーよ…');
        }
    }

    // ─── 履歴 ────────────────────
    async getHistory(limit = 50): Promise<any[]> {
        try {
            const res = await fetch(
                `${this.baseUrl}/api/history?limit=${limit}`,
                { headers: this.headers() }
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            return data.messages || [];
        } catch (e) {
            console.error('getHistory error:', e);
            return [];
        }
    }

    // ─── メモ (v1.1.0 CRUD) ────────────────────
    async getMemos() {
        try {
            const res = await fetch(`${this.baseUrl}/api/memos`, { headers: this.headers() });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            return data.memos || [];
        } catch (e) {
            console.error('getMemos error:', e);
            return [];
        }
    }

    async saveMemo(content: string, title: string = "") {
        try {
            const res = await fetch(`${this.baseUrl}/api/memos`, {
                method: 'POST',
                headers: this.headers(),
                body: JSON.stringify({ content, title }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (e) {
            console.error('saveMemo error:', e);
            throw e;
        }
    }

    async updateMemo(id: number, update: { title?: string; content?: string }) {
        try {
            const res = await fetch(`${this.baseUrl}/api/memos/${id}`, {
                method: 'PUT',
                headers: this.headers(),
                body: JSON.stringify(update),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (e) {
            console.error('updateMemo error:', e);
            throw e;
        }
    }

    async deleteMemo(id: number) {
        try {
            const res = await fetch(`${this.baseUrl}/api/memos/${id}`, {
                method: 'DELETE',
                headers: this.headers(),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (e) {
            console.error('deleteMemo error:', e);
            throw e;
        }
    }

    async syncMemoToPc(id: number) {
        try {
            const res = await fetch(`${this.baseUrl}/api/memos/sync?memo_id=${id}`, {
                method: 'POST',
                headers: this.headers(),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (e) {
            console.error('syncMemoToPc error:', e);
            throw e;
        }
    }

    // ─── 統計 (v1.1.0) ──────────
    async getStats() {
        try {
            const res = await fetch(`${this.baseUrl}/api/stats`, { headers: this.headers() });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (e) {
            console.error('getStats error:', e);
            return null;
        }
    }

    // ─── カレンダー ──────────────
    async getEvents(year?: number, month?: number) {
        try {
            let url = `${this.baseUrl}/api/calendar`;
            if (year && month) url += `?year=${year}&month=${month}`;
            const res = await fetch(url, { headers: this.headers() });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            return data.events || [];
        } catch (e) {
            console.error('getEvents error:', e);
            return [];
        }
    }

    async createEvent(event: any) {
        try {
            const res = await fetch(`${this.baseUrl}/api/calendar`, {
                method: 'POST',
                headers: this.headers(),
                body: JSON.stringify(event),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (e) {
            console.error('createEvent error:', e);
            throw e;
        }
    }

    async updateEvent(id: number, event: any) {
        try {
            const res = await fetch(`${this.baseUrl}/api/calendar/${id}`, {
                method: 'PUT',
                headers: this.headers(),
                body: JSON.stringify(event),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (e) {
            console.error('updateEvent error:', e);
            throw e;
        }
    }

    async deleteEvent(id: number) {
        try {
            const res = await fetch(`${this.baseUrl}/api/calendar/${id}`, {
                method: 'DELETE',
                headers: this.headers(),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (e) {
            console.error('deleteEvent error:', e);
            throw e;
        }
    }

    // ─── タスク ──────────────────
    async getTasks(date?: string, showDone = false) {
        try {
            let url = `${this.baseUrl}/api/tasks?show_done=${showDone}`;
            if (date) url += `&date=${date}`;
            const res = await fetch(url, { headers: this.headers() });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            return data.tasks || [];
        } catch (e) {
            console.error('getTasks error:', e);
            return [];
        }
    }

    async getTaskHistory(year?: number, month?: number) {
        try {
            let url = `${this.baseUrl}/api/tasks/history`;
            if (year && month) url += `?year=${year}&month=${month}`;
            const res = await fetch(url, { headers: this.headers() });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            return data.history || [];
        } catch (e) {
            console.error('getTaskHistory error:', e);
            return [];
        }
    }

    async createTask(task: any) {
        try {
            const res = await fetch(`${this.baseUrl}/api/tasks`, {
                method: 'POST',
                headers: this.headers(),
                body: JSON.stringify(task),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (e) {
            console.error('createTask error:', e);
            throw e;
        }
    }

    async updateTask(id: number, update: any) {
        try {
            const res = await fetch(`${this.baseUrl}/api/tasks/${id}`, {
                method: 'PUT',
                headers: this.headers(),
                body: JSON.stringify(update),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (e) {
            console.error('updateTask error:', e);
            throw e;
        }
    }

    async deleteTask(id: number) {
        try {
            const res = await fetch(`${this.baseUrl}/api/tasks/${id}`, {
                method: 'DELETE',
                headers: this.headers(),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (e) {
            console.error('deleteTask error:', e);
            throw e;
        }
    }
}

export const api = new ApiClient();
