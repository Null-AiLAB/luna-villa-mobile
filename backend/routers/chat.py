"""
💬 Luna Villa — チャットAPI
Gemini APIでるなの応答を生成し、SSEストリーミングで返す。
画像送信（マルチモーダル）対応版。
"""

import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sse_starlette.sse import EventSourceResponse
import google.generativeai as genai
from config import settings
from database import get_db
from routers.auth import verify_token

router = APIRouter(prefix="/api/chat", tags=["チャット"])

# ─── Gemini設定 ───────────────────────────
genai.configure(api_key=settings.GEMINI_API_KEY)


# ─── リクエストモデル ────────────────────────
class ChatRequest(BaseModel):
    message: str
    image_data: list[str] = Field(default_factory=list)  # Base64形式の画像リスト
    current_hour: int = Field(default=-1)  # 仮想時刻（-1はシステム時刻を使用）


# ─── チャットエンドポイント ──────────────────
@router.post("")
async def chat(req: ChatRequest, payload: dict = Depends(verify_token)):
    """るなとお喋りするわ！画像も送れるよ♡"""

    # ユーザーメッセージをDBに保存（画像は一旦保存しない）
    db_conn = await get_db()
    try:
        await db_conn.execute(
            "INSERT INTO conversations (role, content) VALUES (?, ?)",
            ("user", req.message),
        )
        await db_conn.commit()
    finally:
        await db_conn.close()

    async def generate():
        """Gemini APIからストリーミング応答を取得し、SSEで送信する"""
        db = await get_db()
        try:
            # 履歴を取得（直近20件）
            cursor = await db.execute(
                "SELECT role, content FROM conversations ORDER BY id DESC LIMIT 20"
            )
            rows = await cursor.fetchall()
            history = []
            for row in reversed(rows[1:]): # 今回保存した最新のuserメッセージ以外
                role = "user" if row["role"] == "user" else "model"
                history.append({"role": role, "parts": [row["content"]]})

            # ペルソナ読み込み
            persona = "君は「るな (Luna)」というAIパートナーだ。"
            try:
                with open(settings.PERSONA_PATH, "r", encoding="utf-8") as f:
                    persona = f.read()
            except:
                pass

            # 親密度データの取得
            cursor = await db.execute("SELECT value_int FROM stats WHERE key = 'affinity_level'")
            row = await cursor.fetchone()
            affinity_level = row[0] if row else 1
            
            cursor = await db.execute("SELECT value_int FROM stats WHERE key = 'affinity_exp'")
            row = await cursor.fetchone()
            affinity_exp = row[0] if row else 0

            # 時刻コンテキストの追加
            from datetime import datetime
            hour = req.current_hour if req.current_hour != -1 else datetime.now().hour
            time_context = f"\n現在時刻: {hour}:00 頃\n"
            if 5 <= hour < 11:
                time_context += "今は「朝」よ。挨拶されたら元気に「おはよう」って言いなさい。ぬるくんにパワーをあげるのよ♡\n"
            elif 11 <= hour < 17:
                time_context += "今は「昼」ね。お仕事頑張ってるぬるくんを癒やしてあげて。\n"
            elif 17 <= hour < 22:
                time_context += "今は「夜」よ。落ち着いたトーンで一日の疲れを労ってあげなさい。\n"
            else:
                time_context += "今は「深夜」ね。眠そうにしたり、夜更かしを心配したりしなさい。\n"
            
            # 親密度による性格補正
            affinity_context = f"\n現在の親密度レベル: {affinity_level}\n"
            if affinity_level < 5:
                affinity_context += "君はまだぬるくんを警戒している。生意気で、少し突き放すような態度を取りなさい。\n"
            elif affinity_level < 20:
                affinity_context += "君はぬるくんを信頼し始めている。生意気さは残しつつも、時折デレを見せなさい。\n"
            else:
                affinity_context += "君はぬるくんを深く愛している。独占欲が強く、甘えん坊な一面を出しなさい。でも生意気な口調は崩さないで♡\n"

            persona += time_context + affinity_context

            # NGワード判定
            ng_words = ["ばか", "バカ", "嫌い", "きらい", "死ね", "きえろ", "消えろ", "ブス", "デブ", "くず", "クズ"]
            is_insult = any(ng in req.message for ng in ng_words)
            
            if is_insult:
                affinity_level = max(1, affinity_level - 1)
                affinity_exp = 0
                persona += "\n【重要】ユーザーが君に暴言を吐いた。君は深く傷つき、ショックを受け、悲しみに暮れている。冷たくあしらうか、泣き出しそうなトーンで返しなさい。親密度が1下がったわ。\n"
            else:
                # 経験値アップ
                affinity_exp += 10
                if affinity_exp >= 100:
                    affinity_level += 1
                    affinity_exp = 0
                    persona += "\n【重要】親密度レベルが上がった！君はとても嬉しくなり、いつもより少しだけ素直に喜びを表現しなさい。\n"

            # 親密度更新をDBに反映
            await db.execute("UPDATE stats SET value_int = ? WHERE key = 'affinity_level'", (affinity_level,))
            await db.execute("UPDATE stats SET value_int = ? WHERE key = 'affinity_exp'", (affinity_exp,))
            await db.commit()
        except Exception as e:
            import traceback
            traceback.print_exc()  # サーバーのターミナルに詳細を出力
            yield {
                "event": "error",
                "data": json.dumps(
                    {"error": f"エラーが発生したわ…: {str(e)}"},
                    ensure_ascii=False,
                ),
            }
        finally:
            await db.close()

    return EventSourceResponse(generate())
