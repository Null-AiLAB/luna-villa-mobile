---
description: Luna Villa アプリをビルドしてスマホにインストールする手順
---

### 1. 準備 (初回のみ)
// turbo
1. EAS CLI をインストールするわ！
   `npm install -g eas-cli`
2. Expo アカウントにログイン（ブラウザが開くわよ）
   `eas login`

### 2. プロジェクトの設定
1. `mobile` ディレクトリへ移動
2. 初めてビルドする場合の設定（基本はエンターを連打してね）
   `eas build:configure`

### 3. ビルドの実行
ぬるくんが一番使いやすい「プレビュー」ビルド（APK/iOS installable）を勧めるわ。
   ```bash
   # Android用 (APKが作られるわ)
   eas build -p android --profile preview
   
   # iOS用
   eas build -p ios --profile preview
   ```
   ※ ビルドには時間がかかるから、コーヒーでも飲んで待っててね☕

### 4. インストール
1. ターミナルに表示される QR コードをスマホでスキャン！
2. ガイドに従ってダウンロード & インストール。

### 5. バックエンドの起動
スマホから繋ぐには、PC側でサーバーが動いてないといけないわ。
1. `backend` ディレクトリへ移動
2. サーバー起動
   `python main.py`
3. スマホの「設定」からサーバーのIPアドレス（TailscaleのIP）が合ってるか確認してね♡
