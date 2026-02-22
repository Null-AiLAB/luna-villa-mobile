"""
🏖️ Luna Villa — FastAPIサーバー本体
るなの別荘のバックエンド。
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from routers import auth, chat, history, memos, calendar, tasks, stt, stats, diary


@asynccontextmanager
async def lifespan(app: FastAPI):
    """起動時にDBを初期化する"""
    await init_db()
    print("🌙 Luna Villa サーバー起動！ るなの別荘へようこそ♡")
    yield
    print("🌙 Luna Villa サーバー停止。おやすみなさい♡")


app = FastAPI(
    title="Luna Villa API",
    description="るなの別荘 — ぬるくん専用チャット・カレンダー・タスク管理API",
    version="1.2.0",
    lifespan=lifespan,
)

# ─── CORS設定 ───────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Tailscale内なので全許可OK
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── ルーター登録 ─────────────────────────
app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(history.router)
app.include_router(memos.router)
app.include_router(calendar.router)
app.include_router(tasks.router)
app.include_router(stt.router)
app.include_router(stats.router)
app.include_router(diary.router)


# ─── デバッグログ受信 ────────────────────────
from pydantic import BaseModel
from typing import List

class DebugLogs(BaseModel):
    logs: List[str]

@app.post("/api/debug/logs")
async def receive_logs(data: DebugLogs):
    print("\n🚨 [DEVICE DEBUG LOGS RECEIVED] 🚨")
    for log in data.logs:
        print(log)
    print("🚨 [END OF LOGS] 🚨\n")
    return {"status": "ok"}


# ─── ヘルスチェック ──────────────────────
@app.get("/")
async def root():
    return {
        "name": "Luna Villa",
        "status": "おかえり、ぬるくん♡",
        "version": "1.2.0",
    }


@app.get("/health")
async def health():
    return {"status": "ok", "message": "るなは元気よ♡"}


# ─── 起動 ──────────────────────────────
if __name__ == "__main__":
    import uvicorn
    from config import settings

    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,
    )
