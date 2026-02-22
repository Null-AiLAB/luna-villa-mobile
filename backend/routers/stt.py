"""
🎤 Luna Villa — 音声認識 (STT) API
Gemini API を使用して音声ファイルをテキストに変換する。
"""

import os
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
import google.generativeai as genai
from config import settings
from routers.auth import verify_token
import tempfile

router = APIRouter(prefix="/api/stt", tags=["音声認識"])

# ─── Gemini設定 ───────────────────────────
genai.configure(api_key=settings.GEMINI_API_KEY)

@router.post("")
async def speech_to_text(
    audio: UploadFile = File(...),
    payload: dict = Depends(verify_token)
):
    """送られた音声ファイルを Gemini でテキストに変換するわ！"""
    
    # 一時ファイルとして保存
    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(audio.filename)[1]) as tmp:
        content = await audio.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        # Gemini モデル準備 (2.0 Flash はマルチモーダル対応)
        model = genai.GenerativeModel("gemini-1.5-flash") # STTには1.5 Flashが安定
        
        # 音声ファイルをアップロード
        # Note: 小型ファイルなら直接 binary でも送れるが、File API を使うのが確実
        sample_file = genai.upload_file(path=tmp_path)
        
        # 転記(Transcription)リクエスト
        response = model.generate_content([
            "この音声の内容を正確にテキストに書き起こしてください。出力は書き起こしたテキストのみにしてください。要約や挨拶は不要です。",
            sample_file
        ])
        
        # ファイル削除 (Gemini側)
        # genai.delete_file(sample_file.name) # 省略可能（一定時間で消える）

        return {"text": response.text.strip()}

    except Exception as e:
        print(f"STT Error: {e}")
        raise HTTPException(status_code=500, detail=f"声が聞き取れなかったわ…: {str(e)}")
    
    finally:
        # ローカルの一時ファイルを削除
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
