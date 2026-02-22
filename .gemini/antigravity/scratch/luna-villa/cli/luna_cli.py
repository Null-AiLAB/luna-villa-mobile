import os
import requests
import json
from dotenv import load_dotenv

# .env を読み込む（backendの.envを流用）
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

SERVER_URL = "http://localhost:8000"
PASSWORD = os.getenv("LOGIN_PASSWORD", "luna-villa")

def get_token():
    """認証トークンを取得するわ！"""
    try:
        response = requests.post(f"{SERVER_URL}/api/auth/login", json={"password": PASSWORD})
        response.raise_for_status()
        return response.json()["access_token"]
    except Exception as e:
        print(f"❌ 認証エラー: {e}")
        return None

def fetch_memos():
    """スマホで取った「土産メモ」を回収するよ♡"""
    token = get_token()
    if not token:
        return

    headers = {"Authorization": f"Bearer {token}"}
    try:
        response = requests.get(f"{SERVER_URL}/api/memos", headers=headers)
        response.raise_for_status()
        memos = response.json()["memos"]

        if not memos:
            print("📭 新しい土産メモはないみたい。るなと喋ってアイデアを探してきて！")
            return

        print("# 🌙 Luna Villa からの土産メモ\n")
        for memo in memos:
            timestamp = memo.get("timestamp", "").replace("T", " ")
            content = memo.get("content", "")
            print(f"### 🕒 {timestamp}")
            print(f"{content}\n")
            print("---")
        
        print(f"\n✅ 合計 {len(memos)} 件のメモを回収したわ。これを元に開発を進めてね！")

    except Exception as e:
        print(f"❌ メモの取得に失敗したわ: {e}")

if __name__ == "__main__":
    fetch_memos()
