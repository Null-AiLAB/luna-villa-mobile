"""
📜 Luna Villa — 会話履歴API
"""

from fastapi import APIRouter, Depends, Query
from database import get_db
from routers.auth import verify_token

router = APIRouter(prefix="/api/history", tags=["履歴"])


@router.get("")
async def get_history(
    limit: int = Query(50, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    _=Depends(verify_token),
):
    """会話履歴を取得する"""
    db = await get_db()
    try:
        cursor = await db.execute(
            """
            SELECT id, role, content, is_memo, created_at
            FROM conversations
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
            """,
            (limit, offset),
        )
        rows = await cursor.fetchall()

        messages = [
            {
                "id": row[0],
                "role": row[1],
                "content": row[2],
                "is_memo": bool(row[3]),
                "created_at": row[4],
            }
            for row in rows
        ]

        # 時系列順に戻す
        messages.reverse()
        return {"messages": messages, "count": len(messages)}
    finally:
        await db.close()


@router.delete("")
async def clear_history(_=Depends(verify_token)):
    """会話履歴をクリアする"""
    db = await get_db()
    try:
        await db.execute("DELETE FROM conversations WHERE is_memo = 0")
        await db.commit()
        return {"message": "履歴をクリアしたわ♡"}
    finally:
        await db.close()
