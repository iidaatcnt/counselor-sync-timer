# SessionTimer 🕐

リアルタイム同期タイマーアプリケーション - 相談セッションや会議の時間管理に最適

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/session-timer)

## 📌 概要

SessionTimerは、複数人で同じタイマーを共有できるWebアプリケーションです。管理者がタイマーを操作し、相談員や参加者は閲覧のみを行います。WebSocketを使わず、アクセスカウンターと同じHTTPポーリング方式で確実な同期を実現しています。

### ✨ 特徴

- 🔄 **リアルタイム同期** - 全員が同じ時間を表示
- 🎯 **役割分離** - 管理者と閲覧者で別々のページ
- 🚀 **簡単デプロイ** - Vercelで即座に公開可能
- 📱 **レスポンシブ対応** - PC、タブレット、スマホで快適に利用
- 🔔 **通知機能** - セッション終了時に音声でお知らせ
- 🌐 **Socket.io不要** - シンプルなHTTP通信のみ

## 🎬 デモ

- **管理者画面**: https://your-app.vercel.app/admin.html
- **相談員画面**: https://your-app.vercel.app/viewer.html

## 🛠️ セットアップ

### 前提条件

- Node.js 18.0.0以上
- Vercelアカウント（無料でOK）

### インストール手順

1. **リポジトリをクローン**
```bash
git clone https://github.com/yourusername/session-timer.git
cd session-timer
```

2. **必要なファイルを配置**
```
session-timer/
├── api/
│   └── timer.js      # APIエンドポイント
├── admin.html        # 管理者用ページ
├── viewer.html       # 相談員用ページ
└── package.json      # プロジェクト設定
```

3. **ローカルで動作確認**
```bash
npx vercel dev
# http://localhost:3000 でアクセス可能
```

## 🚀 デプロイ方法

### 方法1: Vercel CLIを使用

```bash
# Vercel CLIをインストール
npm i -g vercel

# デプロイ実行
vercel

# 表示される質問に答える
# ? Set up and deploy "session-timer"? [Y/n] Y
# ? Which scope do you want to deploy to? Your Account
# ? Link to existing project? [y/N] N
# ? What's your project's name? session-timer
# ? In which directory is your code located? ./
```

### 方法2: GitHub連携（推奨）

1. GitHubにリポジトリを作成
2. コードをプッシュ
```bash
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/session-timer.git
git push -u origin main
```
3. [Vercel Dashboard](https://vercel.com/dashboard)で「Import Project」
4. GitHubリポジトリを選択
5. 自動デプロイ設定完了！

## 📖 使い方

### 管理者（admin.html）

1. **アクセス**: `https://your-app.vercel.app/admin.html`
2. **時間設定**: 
   - 全体時間: セッション全体の制限時間
   - セッション時間: 1回あたりの相談時間
3. **操作**:
   - 🟢 **開始**: タイマーをスタート
   - ⏸️ **一時停止**: タイマーを一時停止
   - 🔄 **リセット**: 初期状態に戻す
   - ⏭️ **次のセッション**: セッションタイマーのみリセット

### 相談員（viewer.html）

1. **アクセス**: `https://your-app.vercel.app/viewer.html`
2. **機能**:
   - タイマーの表示（操作不可）
   - プログレスバーで残り時間を視覚化
   - セッション終了時に音声通知
   - 開始時刻と終了予定時刻の表示

## ⚙️ カスタマイズ

### デフォルト時間の変更

`api/timer.js`を編集:
```javascript
let timerState = {
  totalDuration: 7200000,   // 2時間 → 変更可能
  sessionDuration: 1200000,  // 20分 → 変更可能
  // ...
};
```

### デザインの変更

各HTMLファイルの`<style>`セクションでカスタマイズ:
```css
/* 例: 背景色の変更 */
body {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

### APIエンドポイントの変更

本番環境用にURLを変更:
```javascript
const API_URL = 'https://your-custom-domain.com/api/timer';
```

## 🔧 トラブルシューティング

### タイマーが同期しない

- ブラウザのコンソールでエラーを確認
- APIエンドポイントのURLが正しいか確認
- CORSエラーの場合は`api/timer.js`の設定を確認

### 音が鳴らない

- ブラウザの音声許可を確認
- ページと一度でもインタラクション（クリック等）したか確認

### オフラインと表示される

- Vercelのデプロイが完了しているか確認
- ネットワーク接続を確認

## 📊 技術詳細

### なぜSocket.ioを使わないのか？

このプロジェクトでは意図的にWebSocketを使用せず、HTTPポーリング方式を採用しています：

**メリット:**
- ✅ Vercelなどのサーバーレス環境で確実に動作
- ✅ ファイアウォールの制限を受けにくい
- ✅ 実装がシンプルで保守しやすい
- ✅ アクセスカウンターと同じ確実な仕組み

**仕組み:**
```javascript
// 1秒ごとにサーバーに問い合わせ
setInterval(() => {
    fetch('/api/timer')
        .then(res => res.json())
        .then(data => updateDisplay(data));
}, 1000);
```

## 🔒 セキュリティ

現在の実装はパブリックアクセス可能です。本番環境では以下を検討してください：

- 管理者ページへの認証追加
- APIエンドポイントの保護
- Rate Limitingの実装

## 📈 今後の機能追加予定

- [ ] 複数タイマーの管理
- [ ] セッション履歴の記録
- [ ] 参加者数のカウント
- [ ] Slack/Discord通知連携
- [ ] ダークモード対応

## 🤝 コントリビューション

プルリクエストを歓迎します！大きな変更の場合は、まずissueを開いて変更内容を議論してください。

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 ライセンス

MIT License - 詳細は[LICENSE](LICENSE)ファイルを参照してください。

## 👥 作者

- GitHub: [@yourusername](https://github.com/yourusername)

## 🙏 謝辞

- アイコン: Emoji
- ホスティング: [Vercel](https://vercel.com)
- インスピレーション: アクセスカウンターの仕組み

## 📞 サポート

問題が発生した場合は、[Issues](https://github.com/yourusername/session-timer/issues)でお知らせください。

---

⭐ このプロジェクトが役に立ったら、スターをお願いします！