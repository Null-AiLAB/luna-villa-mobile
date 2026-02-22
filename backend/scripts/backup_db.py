import shutil
import os
from datetime import datetime
from pathlib import Path
import sys

# プロジェクトルートをパスに追加
sys.path.append(str(Path(__file__).parent.parent))
from config import settings

def backup():
    """データベースのバックアップを作成するわ！"""
    db_path = Path(settings.DB_PATH)
    if not db_path.exists():
        print(f"❌ データベースが見つからないわ: {db_path}")
        return

    # バックアップ先ディレクトリ
    backup_dir = Path(__file__).parent.parent / "backups"
    backup_dir.mkdir(exist_ok=True)

    # タイムスタンプ付きのファイル名
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = backup_dir / f"luna_villa_{timestamp}.db"

    try:
        shutil.copy2(db_path, backup_path)
        print(f"✅ バックアップ成功！: {backup_path}")
        
        # 古いバックアップを削除（最新5件だけ残す）
        all_backups = sorted(backup_dir.glob("*.db"), key=os.path.getmtime, reverse=True)
        if len(all_backups) > 5:
            for old_file in all_backups[5:]:
                old_file.unlink()
                print(f"🗑️ 古いバックアップを整理したわ: {old_file.name}")

    except Exception as e:
        print(f"❌ バックアップに失敗したわ: {e}")

if __name__ == "__main__":
    backup()
