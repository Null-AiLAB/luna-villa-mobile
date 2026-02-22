"""
🔑 Luna Villa — 認証API
JWTベースのぬるくん専用認証。
"""

from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from pydantic import BaseModel
from config import settings

router = APIRouter(prefix="/api/auth", tags=["認証"])
security = HTTPBearer()


# ─── リクエスト/レスポンスモデル ─────────────
class LoginRequest(BaseModel):
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ─── JWT生成 ──────────────────────────────
def create_token(data: dict) -> str:
    """JWTトークンを生成する"""
    expire = datetime.now(timezone.utc) + timedelta(hours=settings.JWT_EXPIRE_HOURS)
    to_encode = {**data, "exp": expire}
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


# ─── JWT検証（依存関数） ──────────────────
async def verify_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """JWTトークンを検証する。他のルーターで Depends(verify_token) で使う。"""
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="無効なトークンよ！ ログインし直して♡")


# ─── エンドポイント ──────────────────────
@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest):
    """パスワードでログインしてJWTを取得する"""
    if req.password != settings.LOGIN_PASSWORD:
        raise HTTPException(status_code=401, detail="パスワードが違うわ！")

    token = create_token({"sub": "nullkun", "role": "owner"})
    return TokenResponse(access_token=token)
