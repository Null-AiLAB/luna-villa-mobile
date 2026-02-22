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

            # 今回のメッセージ構築
            current_parts = [req.message]
            for img_b64 in req.image_data:
                # header除去 (data:image/png;base64, ...)
                if "," in img_b64:
                    img_b64 = img_b64.split(",")[1]
                current_parts.append({
                    "mime_type": "image/jpeg",
                    "data": img_b64
                })

            # モデル準備
            model = genai.GenerativeModel(
                model_name=settings.GEMINI_MODEL,
                system_instruction=persona
            )

            full_response = ""
            # 履歴 + 現在の入力
            response = model.generate_content(
                history + [{"role": "user", "parts": current_parts}],
                stream=True
            )

            for chunk in response:
                if chunk.text:
                    full_response += chunk.text
                    yield {
                        "event": "message",
                        "data": json.dumps(
                            {"content": chunk.text, "done": False},
                            ensure_ascii=False,
                        ),
                    }

            # 完了シグナル
            yield {
                "event": "message",
                "data": json.dumps(
                    {"content": "", "done": True},
                    ensure_ascii=False,
                ),
            }

            # るなの応答を反映（DB保存）
            await db.execute(
                "INSERT INTO conversations (role, content) VALUES (?, ?)",
                ("luna", full_response),
            )
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
