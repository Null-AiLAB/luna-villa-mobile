# 🔗 Tailscale セットアップガイド — Luna Villa

Luna Villa のスマホとPCを安全に接続するためのガイド。

---

## Tailscaleとは？

ぬるくんのPCとスマホだけを暗号化された専用トンネルで結ぶVPNサービス。
外部に公開されず、二人だけの秘密の道。

---

## セットアップ手順

### 1. アカウント作成
1. [tailscale.com](https://tailscale.com) にアクセス
2. Googleアカウントでサインアップ（無料）

### 2. PCにインストール
1. [ダウンロードページ](https://tailscale.com/download/windows) からWindows版をダウンロード
2. インストーラーを実行
3. タスクバーのTailscaleアイコンからログイン

### 3. スマホにインストール
1. Google Play Store から「Tailscale」をインストール
2. 同じアカウントでログイン

### 4. 確認
両方にログインすると、PCに固定IP（`100.x.x.x`）が割り当てられる。

```
確認コマンド（PC）:
  ipconfig /all | findstr "Tailscale" -A 8

割り当て済みIP: 100.124.23.48
```

---

## Luna Villa での使い方

### バックエンドサーバー起動
```bash
cd C:\Users\nulle\.gemini\antigravity\scratch\luna-villa\backend
.venv\Scripts\python main.py
```

### スマホからのアクセス
アプリの設定画面でサーバーURLを設定:
```
http://100.124.23.48:8000
```

### 接続テスト
スマホのブラウザで以下にアクセス:
```
http://100.124.23.48:8000/health
```
`{"status":"ok","message":"るなは元気よ♡"}` が表示されれば成功。

---

## トラブルシューティング

| 症状 | 対処 |
|---|---|
| 接続できない | PCでTailscaleが起動しているか確認 |
| IPが変わった | `ipconfig /all` で再確認 |
| タイムアウト | FastAPIサーバーが起動しているか確認 |
| 認証エラー | .envのパスワードを確認 |
