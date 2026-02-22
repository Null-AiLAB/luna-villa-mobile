"""
⚙️ Luna Villa — 設定管理
.envから環境変数を読み込み、アプリ全体で使う設定を管理する。
"""

import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    # ─── システム設定 ───
    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # ─── 必須設定（.envにないとエラー） ───
    GEMINI_API_KEY: str = Field(..., description="Gemini APIキーは必須よ！")
    
    # ─── 認証設定 ───
    JWT_SECRET: str = Field("luna-villa-secret-change-me", description="JWT署名用の秘密鍵")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_HOURS: int = 720
    LOGIN_PASSWORD: str = Field("luna-villa", description="ログイン用パスワード")

    # ─── サーバー設定 ───
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # ─── パス設定 ───
    PERSONA_PATH: str = "persona.md"
    DB_PATH: str = "luna_villa.db"

    # ─── モデル設定 ───
    GEMINI_MODEL: str = "gemini-flash-latest"


settings = Settings()
