"""
✅ Luna Villa — タスクAPI
カレンダー連動のタスク管理。 v1.1.0 強化版。
"""

from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from database import get_db
from routers.auth import verify_token
from datetime import datetime

router = APIRouter(prefix="/api/tasks", tags=["タスク"])


# ─── モデル ──────────────────────────────
class TaskCreate(BaseModel):
    title: str
    event_id: Optional[int] = None
    due_date: Optional[str] = None  # YYYY-MM-DD
    due_time: Optional[str] = None  # HH:mm


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    is_done: Optional[bool] = None
    due_date: Optional[str] = None
    due_time: Optional[str] = None


# ─── エンドポイント ──────────────────────
@router.get("")
async def get_tasks(
    date: Optional[str] = Query(None, description="日付フィルタ (YYYY-MM-DD)"),
    show_done: bool = Query(False),
    _=Depends(verify_token),
):
    """タスクを取得する"""
    db = await get_db()
    try:
        if date:
            query = """
                SELECT t.id, t.title, t.event_id, t.due_date, t.due_time, t.is_done, t.created_at,
                       e.title as event_title
                FROM tasks t
                LEFT JOIN events e ON t.event_id = e.id
                WHERE t.due_date = ?
            """
            params = [date]
            if not show_done:
                query += " AND t.is_done = 0"
            query += " ORDER BY t.due_time ASC, t.created_at ASC"
            cursor = await db.execute(query, params)
        else:
            query = """
                SELECT t.id, t.title, t.event_id, t.due_date, t.due_time, t.is_done, t.created_at,
                       e.title as event_title
                FROM tasks t
                LEFT JOIN events e ON t.event_id = e.id
            """
            if not show_done:
                query += " WHERE t.is_done = 0"
            query += " ORDER BY t.due_date ASC, t.due_time ASC, t.created_at ASC LIMIT 100"
            cursor = await db.execute(query)

        rows = await cursor.fetchall()
        tasks = [
            {
                "id": row[0],
                "title": row[1],
                "event_id": row[2],
                "due_date": row[3],
                "due_time": row[4],
                "is_done": bool(row[5]),
                "created_at": row[6],
                "event_title": row[7],
            }
            for row in rows
        ]
        return {"tasks": tasks, "count": len(tasks)}
    finally:
        await db.close()


@router.get("/history")
async def get_task_history(
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    _=Depends(verify_token),
):
    """完了済みタスクの履歴を取得する"""
    db = await get_db()
    try:
        query = """
            SELECT id, title, due_date, due_time, created_at
            FROM tasks
            WHERE is_done = 1
        """
        params = []
        if year and month:
            query += " AND strftime('%Y', due_date) = ? AND strftime('%m', due_date) = ?"
            params = [str(year), f"{month:02d}"]
        
        query += " ORDER BY due_date DESC, due_time DESC"
        cursor = await db.execute(query, params)
        rows = await cursor.fetchall()
        
        history = [
            {
                "id": row[0],
                "title": row[1],
                "due_date": row[2],
                "due_time": row[3],
                "completed_at": row[4],
            }
            for row in rows
        ]
        return {"history": history, "count": len(history)}
    finally:
        await db.close()


@router.post("")
async def create_task(task: TaskCreate, _=Depends(verify_token)):
    """タスクを追加する"""
    db = await get_db()
    try:
        cursor = await db.execute(
            "INSERT INTO tasks (title, event_id, due_date, due_time) VALUES (?, ?, ?, ?)",
            (task.title, task.event_id, task.due_date, task.due_time),
        )
        await db.commit()
        return {"id": cursor.lastrowid, "message": "タスクを追加したわ♡"}
    finally:
        await db.close()


@router.put("/{task_id}")
async def update_task(task_id: int, task: TaskUpdate, _=Depends(verify_token)):
    """タスクを更新する"""
    db = await get_db()
    try:
        cursor = await db.execute("SELECT id FROM tasks WHERE id = ?", (task_id,))
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail="そのタスクは見つからないわ…")

        updates = []
        values = []
        dump = task.model_dump(exclude_none=True)
        
        # is_done が True に変わったなら完了時刻を打刻するわよ♡
        if dump.get("is_done") is True:
            dump["completed_at"] = datetime.now()
        elif dump.get("is_done") is False:
            dump["completed_at"] = None

        for field, value in dump.items():
            updates.append(f"{field} = ?")
            values.append(value if not isinstance(value, bool) else int(value))

        if updates:
            values.append(task_id)
            await db.execute(
                f"UPDATE tasks SET {', '.join(updates)} WHERE id = ?",
                values,
            )
            await db.commit()

        return {"message": "タスクを更新したわ♡"}
    finally:
        await db.close()


@router.delete("/{task_id}")
async def delete_task(task_id: int, _=Depends(verify_token)):
    """タスクを削除する"""
    db = await get_db()
    try:
        await db.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
        await db.commit()
        return {"message": "タスクを削除したわ♡"}
    finally:
        await db.close()
