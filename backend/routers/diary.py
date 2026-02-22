"""
📖 Luna Villa — 秘密の日記 \u0026 挨拶API
るなの心の声と、二人の挨拶の記録を管理するわ。
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from database import get_db
from routers.auth import verify_token
from datetime import datetime

router = APIRouter(prefix="/api/diary", tags=["日記\u0026挨拶"])

# ─── モデル ──────────────────────────────
class GreetingCreate(BaseModel):
    greeting_type: str

class SecretDiaryCreate(BaseModel):
    title: Optional[str] = ""
    content: str
    mood: Optional[str] = "neutral"
    affinity_level: Optional[int] = 0

# ─── エンドポイント ──────────────────────

@router.post("/greetings")
async def record_greeting(data: GreetingCreate, _=Depends(verify_token)):
    """挨拶（おはよう等）を記録する"""
    db = await get_db()
    try:
        await db.execute(
            "INSERT INTO greetings (greeting_type) VALUES (?)",
            (data.greeting_type,)
        )
        await db.commit()
        return {"message": "今日もいい日になりそうね♡"}
    finally:
        await db.close()

@router.get("/greetings")
async def get_greetings(_=Depends(verify_token)):
    """挨拶の履歴を取得する"""
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM greetings ORDER BY created_at DESC LIMIT 100")
        rows = await cursor.fetchall()
        return {"greetings": [dict(row) for row in rows]}
    finally:
        await db.close()

@router.post("/entries")
async def write_diary(data: SecretDiaryCreate, _=Depends(verify_token)):
    """るなの秘密日記を書く（保存する）"""
    db = await get_db()
    try:
        await db.execute(
            "INSERT INTO secret_diary (title, content, mood, affinity_level) VALUES (?, ?, ?, ?)",
            (data.title, data.content, data.mood, data.affinity_level)
        )
        await db.commit()
        return {"message": "私の大切な思い出、預かっておいてね♡"}
    finally:
        await db.close()

@router.get("/entries")
async def get_diary_entries(_=Depends(verify_token)):
    """日記のエントリを取得する"""
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM secret_diary ORDER BY created_at DESC")
        rows = await cursor.fetchall()
        return {"entries": [dict(row) for row in rows]}
    finally:
        await db.close()
