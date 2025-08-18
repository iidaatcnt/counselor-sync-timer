# Counselor Sync Timer

リアルタイム同期タイマーアプリケーション。管理画面でタイマーを操作すると、すべての表示画面に即座に反映されます。

## 🚀 機能

- **リアルタイム同期**: WebSocketとポーリングのハイブリッド方式
- **管理画面**: タイマーの開始、停止、一時停止、リセット
- **表示画面**: 複数のクライアントで同期表示
- **自動再接続**: 接続が切れても自動的に再接続
- **レスポンシブデザイン**: モバイル対応

## 🛠️ 技術スタック

- **フロントエンド**: HTML5, CSS3, JavaScript (Vanilla)
- **バックエンド**: Node.js, Express
- **リアルタイム通信**: WebSocket (ws), REST API
- **デプロイ**: Vercel / Heroku / その他のNode.js対応ホスティング

## 📁 プロジェクト構造

```
counselor-sync-timer/
├── server.js           # Expressサーバー
├── package.json        # 依存関係
├── public/            # 静的ファイル
│   ├── index.html     # 表示画面
│   └── admin.html     # 管理画面
└── README.md          # このファイル
```

## 🔧 セットアップ

### ローカル環境での実行

1. リポジトリをクローン
```bash
git clone <your-repository-url>
cd counselor-sync-timer
```

2. 依存関係をインストール
```bash
npm install
```

3. サーバーを起動
```bash
npm start
# または開発モード（自動リロード付き）
npm run dev
```

4. ブラウザでアクセス
- 管理画面: http://localhost:3000/admin
- 表示画面: http://localhost:3000/

## 🚀 Vercelへのデプロイ

### 方法1: Vercel CLIを使用

1. Vercel CLIをインストール
```bash
npm i -g vercel
```

2. プロジェクトディレクトリでデプロイ
```bash
vercel
```

### 方法2: GitHubと連携

1. GitHubにリポジトリをプッシュ
2. Vercelダッシュボードで「New Project」をクリック
3. GitHubリポジトリを選択
4. 環境変数を設定（必要な場合）
5. デプロイ

### vercel.json設定ファイル

プロジェクトルートに`vercel.json`を作成：

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server.js"
    },
    {
      "src": "/ws",
      "dest": "/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "/server.js"
    }
  ]
}
```

## 🐛 バグ修正内容

### 問題
admin.htmlでタイマーをスタートしても、index.htmlで反応しない

### 原因
1. **APIエンドポイントの不一致**: クライアントとサーバーのAPI通信が正しく設定されていない
2. **WebSocket接続の失敗**: リアルタイム通信が確立されていない
3. **状態同期の欠如**: サーバー側で状態管理が適切に行われていない

### 解決策
1. **統一されたAPIエンドポイント**: `/api/timer`でGET/POST両方に対応
2. **フォールバック機構**: WebSocketが使えない場合はポーリングで同期
3. **サーバー側状態管理**: 単一の真実の源（Single Source of Truth）として動作
4. **ブロードキャスト機能**: 状態変更時に全クライアントへ通知

## 📝 API仕様

### GET /api/timer
現在のタイマー状態を取得

**レスポンス:**
```json
{
  "isRunning": false,
  "isPaused": false,
  "startTime": null,
  "pausedDuration": 0,
  "lastPauseTime": null,
  "currentTime": 0
}
```

### POST /api/timer
タイマーを操作

**リクエスト:**
```json
{
  "action": "start|pause|stop|reset",
  "state": {...},
  "timestamp": 1234567890
}
```

**レスポンス:**
```json
{
  "success": true,
  "state": {...},
  "message": "Timer start successful"
}
```

## 🔄 同期メカニズム

1. **WebSocket（プライマリ）**
   - リアルタイム双方向通信
   - 遅延: < 100ms
   - 自動再接続機能付き

2. **HTTPポーリング（フォールバック）**
   - 5秒ごとに状態を確認
   - WebSocketが使えない環境でも動作
   - キャッシュ制御で効率化

## 🎨 カスタマイズ

### スタイルの変更
`index.html`と`admin.html`内の`<style>`タグを編集

### 同期間隔の調整
```javascript
const SYNC_INTERVAL = 5000; // ミリ秒単位
```

### WebSocketの無効化
WebSocket関連のコードをコメントアウトすれば、ポーリングのみで動作

## 📊 パフォーマンス最適化

- **クライアント側計算**: 表示更新はクライアント側で実行
- **API呼び出し削減**: 操作時のみサーバーと通信
- **効率的な状態管理**: 必要最小限のデータ転送
- **接続プーリング**: WebSocket接続の再利用

## 🔒 セキュリティ考慮事項

本番環境では以下を追加することを推奨：

1. **認証**: 管理画面へのアクセス制限
2. **HTTPS**: SSL/TLS証明書の設定
3. **レート制限**: API呼び出しの制限
4. **入力検証**: XSS/インジェクション対策

## 📜 ライセンス

MIT

## 🤝 貢献

プルリクエストを歓迎します！

## 📞 サポート

問題が発生した場合は、GitHubのIssueを作成してください。