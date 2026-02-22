---
description: スマホアプリ「Luna Villa」で保存した土産メモ（アイデアや要望）を回収し、現在の開発コンテキストに取り込むワークフロー
---

1. Luna Villa のバックエンドサーバーが起動していることを確認するわ！
// turbo
2. 専用CLIツールを実行して、スマホから送られたメモを読み込むよ。
```powershell
python C:\Users\nulle\.gemini\antigravity\scratch\luna-villa\cli\luna_cli.py
```

3. 取得した内容に基づいて、以下のいずれかのアクションを取ってね。
   - 新機能の要望なら、`task.md` に追加する。
   - 実装のアイデアなら、対応するファイルにコメントとして残すか、`implementation_plan.md` を更新する。
   - 雑談やフィードバックなら、るな（AI助手）の記憶として留めておく。

4. 回収が終わったら、ぬるくんに報告してね♡
