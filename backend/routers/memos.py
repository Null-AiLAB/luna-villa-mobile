"""
📌 Luna Villa — お土産メモAPI
スマホの会話でピン留めしたメモをPCのるなに引き継ぐ。
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import get_db
from routers.auth import verify_token
import logging

router = APIRouter(prefix="/api/memos", tags=["メモ"])


class MemoRequest(BaseModel):
    title: Optional[str] = ""
    content: str


class MemoUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None


@router.post("")
async def create_memo(req: MemoRequest, _=Depends(verify_token)):
    """お土産メモを保存する"""
    db = await get_db()
    try:
        await db.execute(
            "INSERT INTO conversations (role, content, title, is_memo) VALUES (?, ?, ?, 1)",
            ("user", req.content, req.title),
        )
        await db.commit()
        return {"message": "メモを保存したわ♡ PCの私に伝えておくわね！"}
    finally:
        await db.close()


@router.get("")
async def get_memos(_=Depends(verify_token)):
    """全てのメモを取得する"""
    db = await get_db()
    try:
        cursor = await db.execute(
            """
            SELECT id, title, content, created_at
            FROM conversations
            WHERE is_memo = 1
            ORDER BY created_at DESC
            """
        )
        rows = await cursor.fetchall()

        memos = [
            {"id": row[0], "title": row[1], "content": row[2], "created_at": row[3]}
            for row in rows
        ]
        return {"memos": memos, "count": len(memos)}
    finally:
        await db.close()


@router.put("/{memo_id}")
async def update_memo(memo_id: int, req: MemoUpdate, _=Depends(verify_token)):
    """メモを更新する"""
    db = await get_db()
    try:
        updates = []
        params = []
        if req.title is not None:
            updates.append("title = ?")
            params.append(req.title)
        if req.content is not None:
            updates.append("content = ?")
            params.append(req.content)
        
        if not updates:
            return {"message": "変更なしよ？"}

        params.append(memo_id)
        await db.execute(
            f"UPDATE conversations SET {', '.join(updates)} WHERE id = ? AND is_memo = 1",
            params
        )
        await db.commit()
        return {"message": "メモを更新したわ♡"}
    finally:
        await db.close()


@router.delete("/{memo_id}")
async def delete_memo(memo_id: int, _=Depends(verify_token)):
    """メモを削除する"""
    db = await get_db()
    try:
        await db.execute(
            "DELETE FROM conversations WHERE id = ? AND is_memo = 1",
            (memo_id,),
        )
        await db.commit()
        return {"message": "メモを削除したわ♡"}
    finally:
        await db.close()


@router.post("/sync")
async def sync_to_pc(memo_id: int, _=Depends(verify_token)):
    """特定のメモをPC（Antigravity）へ送信する演出"""
    # 実際にはここではログに出力したり、特定のファイルに書き込んだりする
    db = await get_db()
    try:
        cursor = await db.execute("SELECT title, content FROM conversations WHERE id = ?", (memo_id,))
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="そのメモは見つからないわ…")
        
        title, content = row
        # Antigravityへの連携通知（ログに出力することでAgentが気づけるようにする）
        logging.info(f"Luna Villa Sync: Pinned Memo - [{title}] {content}")
        
        return {"message": f"「{title or 'メモ'}」をPCの私に送信したわ！確認しておくね♡"}
    finally:
        await db.close()
