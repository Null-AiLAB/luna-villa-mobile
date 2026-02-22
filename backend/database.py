"""
🗄️ Luna Villa — データベース管理
SQLiteで会話・カレンダー・タスクを管理する。
"""

import aiosqlite
from config import settings

DB_PATH = str(settings.DB_PATH)


async def init_db():
    """データベースとテーブルを初期化する"""
    async with aiosqlite.connect(DB_PATH) as db:
        # 会話テーブル
        await db.execute("""
            CREATE TABLE IF NOT EXISTS conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                title TEXT DEFAULT '',
                is_memo BOOLEAN DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        # カラム追加（既存DB用）
        try:
            await db.execute("ALTER TABLE conversations ADD COLUMN title TEXT DEFAULT ''")
        except:
            pass

        # カレンダーイベントテーブル
        await db.execute("""
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT DEFAULT '',
                start_at TIMESTAMP NOT NULL,
                end_at TIMESTAMP,
                added_by TEXT DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # タスクテーブル
        await db.execute("""
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                event_id INTEGER,
                due_date DATE,
                due_time TEXT,
                is_done BOOLEAN DEFAULT 0,
                completed_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (event_id) REFERENCES events(id)
            )
        """)
        # カラム追加 (v1.1.0+)
        try:
            await db.execute("ALTER TABLE tasks ADD COLUMN due_time TEXT")
        except: pass
        # カラム追加 (v1.2.0 Phase 2)
        try:
            await db.execute("ALTER TABLE tasks ADD COLUMN completed_at TIMESTAMP")
        except: pass

        # 挨拶履歴テーブル
        await db.execute("""
            CREATE TABLE IF NOT EXISTS greetings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                greeting_type TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # るなの秘密日記テーブル
        await db.execute("""
            CREATE TABLE IF NOT EXISTS secret_diary (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT DEFAULT '',
                content TEXT NOT NULL,
                mood TEXT,
                affinity_level INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # 統計・ステータステーブル
        await db.execute("""
            CREATE TABLE IF NOT EXISTS stats (
                key TEXT PRIMARY KEY,
                value_int INTEGER DEFAULT 0,
                value_text TEXT
            )
        """)
        # 初期値投入
        await db.execute("INSERT OR IGNORE INTO stats (key, value_int) VALUES ('affinity_level', 1)")
        await db.execute("INSERT OR IGNORE INTO stats (key, value_int) VALUES ('affinity_exp', 0)")

        await db.commit()


async def get_db():
    """データベース接続を取得する"""
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    return db
