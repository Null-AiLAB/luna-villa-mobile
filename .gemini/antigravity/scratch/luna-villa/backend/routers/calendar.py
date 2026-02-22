"""
📅 Luna Villa — カレンダーAPI
予定のCRUD。スマホからもPCのるなからも追加可能。
"""

from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import get_db
from routers.auth import verify_token

router = APIRouter(prefix="/api/calendar", tags=["カレンダー"])


# ─── モデル ──────────────────────────────
class EventCreate(BaseModel):
    title: str
    description: str = ""
    start_at: str  # ISO format
    end_at: Optional[str] = None
    added_by: str = "user"


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_at: Optional[str] = None
    end_at: Optional[str] = None


# ─── エンドポイント ──────────────────────
@router.get("")
async def get_events(
    year: Optional[int] = None,
    month: Optional[int] = None,
    _=Depends(verify_token),
):
    """カレンダーイベントを取得する"""
    db = await get_db()
    try:
        if year and month:
            cursor = await db.execute(
                """
                SELECT id, title, description, start_at, end_at, added_by, created_at
                FROM events
                WHERE strftime('%Y', start_at) = ? AND strftime('%m', start_at) = ?
                ORDER BY start_at ASC
                """,
                (str(year), f"{month:02d}"),
            )
        else:
            cursor = await db.execute(
                """
                SELECT id, title, description, start_at, end_at, added_by, created_at
                FROM events
                ORDER BY start_at ASC
                LIMIT 100
                """
            )

        rows = await cursor.fetchall()
        events = [
            {
                "id": row[0],
                "title": row[1],
                "description": row[2],
                "start_at": row[3],
                "end_at": row[4],
                "added_by": row[5],
                "created_at": row[6],
            }
            for row in rows
        ]
        return {"events": events, "count": len(events)}
    finally:
        await db.close()


@router.post("")
async def create_event(event: EventCreate, _=Depends(verify_token)):
    """予定を追加する"""
    db = await get_db()
    try:
        cursor = await db.execute(
            """
            INSERT INTO events (title, description, start_at, end_at, added_by)
            VALUES (?, ?, ?, ?, ?)
            """,
            (event.title, event.description, event.start_at, event.end_at, event.added_by),
        )
        await db.commit()
        return {"id": cursor.lastrowid, "message": "予定を追加したわ♡"}
    finally:
        await db.close()


@router.put("/{event_id}")
async def update_event(event_id: int, event: EventUpdate, _=Depends(verify_token)):
    """予定を更新する"""
    db = await get_db()
    try:
        # 既存イベント確認
        cursor = await db.execute("SELECT id FROM events WHERE id = ?", (event_id,))
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail="その予定は見つからないわ…")

        updates = []
        values = []
        for field, value in event.model_dump(exclude_none=True).items():
            updates.append(f"{field} = ?")
            values.append(value)

        if updates:
            values.append(event_id)
            await db.execute(
                f"UPDATE events SET {', '.join(updates)} WHERE id = ?",
                values,
            )
            await db.commit()

        return {"message": "予定を更新したわ♡"}
    finally:
        await db.close()


@router.delete("/{event_id}")
async def delete_event(event_id: int, _=Depends(verify_token)):
    """予定を削除する"""
    db = await get_db()
    try:
        await db.execute("DELETE FROM events WHERE id = ?", (event_id,))
        await db.commit()
        return {"message": "予定を削除したわ♡"}
    finally:
        await db.close()
