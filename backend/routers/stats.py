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
        
        # 親密度データの取得
        cursor = await db.execute("SELECT value_int FROM stats WHERE key = 'affinity_level'")
        row = await cursor.fetchone()
        affinity_level = row[0] if row else 1
        
        cursor = await db.execute("SELECT value_int FROM stats WHERE key = 'affinity_exp'")
        row = await cursor.fetchone()
        affinity_exp = row[0] if row else 0
        
        # 親密度ランク名
        ranks = ["知り合い", "友達", "仲良し", "大親友♪", "パートナー", "運命の二人♡", "究極の愛♡"]
        rank_idx = min(affinity_level // 10, len(ranks) - 1) # レベル10ごとにランクアップ
        rank_name = ranks[rank_idx]

        return {
            "total_messages": user_msgs + luna_msgs,
            "user_messages": user_msgs,
            "luna_messages": luna_msgs,
            "affinity": {
                "level": affinity_level,
                "exp": affinity_exp,
                "rank": rank_name,
                "label": "親密度ランク💖"
            }
        }
    finally:
        await db.close()
