"""
📊 Luna Villa — 統計API
親密度や会話回数などのデータを管理する。
"""

from fastapi import APIRouter, Depends
from database import get_db
from routers.auth import verify_token

router = APIRouter(prefix="/api/stats", tags=["統計"])


@router.get("")
async def get_stats(_=Depends(verify_token)):
    """アプリ全体の統計と親密度を取得する"""
    db = await get_db()
    try:
        # メッセージ総数
        cursor = await db.execute("SELECT COUNT(*) FROM conversations WHERE role = 'user'")
        user_msgs = (await cursor.fetchone())[0]
        
        cursor = await db.execute("SELECT COUNT(*) FROM conversations WHERE role = 'luna'")
        luna_msgs = (await cursor.fetchone())[0]
        
        total_msgs = user_msgs + luna_msgs
        
        # 親密度の計算ロジック（適当に会話回数ベース）
        # 100回ごとにレベルアップ的な
        affinity_level = (total_msgs // 100) + 1
        affinity_exp = total_msgs % 100
        
        # 親密度ランク名
        ranks = ["知り合い", "友達", "親友", "パートナー", "運命の人", "るなの一部♡"]
        rank_idx = min(affinity_level - 1, len(ranks) - 1)
        rank_name = ranks[rank_idx]

        return {
            "total_messages": total_msgs,
            "user_messages": user_msgs,
            "luna_messages": luna_msgs,
            "affinity": {
                "level": affinity_level,
                "exp": affinity_exp,
                "rank": rank_name,
                "label": "親密度💖"
            }
        }
    finally:
        await db.close()
