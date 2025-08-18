# SessionTimer 技術仕様書

## 1. 概要

### 1.1 プロジェクト名
SessionTimer - リアルタイム同期タイマーシステム

### 1.2 目的
複数の相談員が同じタイマーを見ながらセッション管理を行うためのWebアプリケーション。管理者がタイマーを操作し、相談員は閲覧のみを行う。

### 1.3 主要な設計決定
- **同期方式**: WebSocketではなくHTTPポーリング方式を採用
- **理由**: Vercelのようなサーバーレス環境での安定動作、実装の簡潔性、ファイアウォール互換性
- **原理**: アクセスカウンターと同じ仕組みで確実な同期を実現

## 2. システムアーキテクチャ

### 2.1 構成要素

```
┌─────────────┐     HTTP Request    ┌─────────────┐
│  管理者画面  │ ←─────────────────→ │             │
│ admin.html  │     (1秒ごと)       │   API       │
└─────────────┘                     │ /api/timer  │
                                    │             │
┌─────────────┐     HTTP Request    │  (状態管理)  │
│  相談員画面  │ ←─────────────────→ │             │
│ viewer.html │     (1秒ごと)       └─────────────┘
└─────────────┘
```

### 2.2 技術スタック
- **フロントエンド**: Pure HTML/CSS/JavaScript（フレームワーク不使用）
- **バックエンド**: Node.js（Vercel Edge Functions）
- **通信方式**: REST API（HTTPポーリング）
- **ホスティング**: Vercel

## 3. API仕様

### 3.1 エンドポイント
`/api/timer`

### 3.2 メソッド

#### GET /api/timer
タイマーの現在状態を取得

**レスポンス:**
```json
{
  "startTime": 1234567890000,
  "totalDuration": 7200000,
  "sessionDuration": 1200000,
  "isPaused": false,
  "pausedAt": null,
  "pausedElapsed": 0,
  "sessionStartTime": 1234567890000,
  "sessionPausedElapsed": 0,
  "currentTime": 1234567891000,
  "remainingTotal": 7199000,
  "remainingSession": 1199000
}
```

#### POST /api/timer
タイマーを操作

**リクエストボディ:**
```json
{
  "action": "start|pause|reset|nextSession|setTime",
  "totalMinutes": 120,    // resetまたはsetTime時のみ
  "sessionMinutes": 20     // resetまたはsetTime時のみ
}
```

**レスポンス:**
```json
{
  "success": true,
  "state": { /* 更新後の状態 */ },
  "currentTime": 1234567891000
}
```

## 4. データモデル

### 4.1 タイマー状態オブジェクト

```javascript
{
  startTime: number | null,        // タイマー開始時刻（Unix timestamp）
  totalDuration: number,           // 全体時間（ミリ秒）
  sessionDuration: number,         // セッション時間（ミリ秒）
  isPaused: boolean,              // 一時停止状態
  pausedAt: number | null,        // 一時停止した時刻
  pausedElapsed: number,          // 一時停止までの経過時間
  sessionStartTime: number | null, // 現在のセッション開始時刻
  sessionPausedElapsed: number    // セッションの一時停止までの経過時間
}
```

## 5. 同期メカニズム

### 5.1 ポーリング戦略
- **アクティブ時**: 1秒間隔でポーリング
- **バックグラウンド時**: 5秒間隔でポーリング
- **原理**: アクセスカウンターと同じくサーバーが唯一の時刻源（Single Source of Truth）

### 5.2 時間計算ロジック
```javascript
// 実行中の残り時間計算
if (!isPaused && startTime) {
  const elapsed = (now - startTime) + pausedElapsed;
  remainingTotal = Math.max(0, totalDuration - elapsed);
}
```

## 6. ユーザーインターフェース

### 6.1 管理者画面（admin.html）
- **権限**: フルコントロール
- **機能**:
  - タイマー開始/一時停止
  - タイマーリセット
  - セッション切り替え
  - 時間設定変更
- **URL**: `/admin.html`

### 6.2 相談員画面（viewer.html）
- **権限**: 閲覧のみ
- **機能**:
  - タイマー表示
  - プログレスバー表示
  - セッション終了通知
  - 音声アラート
- **URL**: `/viewer.html`

## 7. セキュリティ考慮事項

### 7.1 現在の実装
- パブリックAPI（認証なし）
- CORSは全オリジン許可

### 7.2 本番環境での推奨事項
- 管理者ページへの認証機能追加
- CORS設定の制限
- Rate Limiting の実装

## 8. パフォーマンス最適化

### 8.1 通信量削減
- タイマー停止中はポーリング間隔を延長可能
- バックグラウンドタブでの自動間隔調整

### 8.2 レスポンシブデザイン
- モバイル対応
- 最小限のDOM操作

## 9. エラーハンドリング

### 9.1 ネットワークエラー
- オフライン時はローカルで時間を進める
- 接続復帰時に自動同期

### 9.2 ユーザー通知
- 接続状態の視覚的表示
- エラー時のフォールバック動作

## 10. 拡張性

### 10.1 データ永続化
- 現状: メモリ上で管理（サーバー再起動でリセット）
- 推奨: Vercel KV Storage への移行

### 10.2 機能拡張の可能性
- 複数タイマーの同時管理
- タイマー履歴の記録
- 参加者数のカウント
- チャット機能の追加

## 11. デプロイメント

### 11.1 必要ファイル
```
session-timer/
├── api/
│   └── timer.js
├── admin.html
├── viewer.html
└── package.json
```

### 11.2 環境要件
- Node.js 18.0.0以上
- Vercelアカウント

## 12. テスト要件

### 12.1 機能テスト
- [ ] タイマー開始/停止の動作確認
- [ ] 複数クライアント間の同期確認
- [ ] セッション終了時のアラート動作
- [ ] オフライン時の動作確認

### 12.2 パフォーマンステスト
- [ ] 100クライアント同時接続時の負荷確認
- [ ] 長時間動作の安定性確認

## 13. 既知の制限事項

- Vercelの無料プランではFunction実行時間に制限あり
- ブラウザのバックグラウンドタブ制限により完全なリアルタイム性は保証されない
- 音声通知はユーザーインタラクション後のみ有効

## 14. バージョン履歴

### v1.0.0 (2024-08)
- 初回リリース
- HTTPポーリング方式での実装
- 管理者/相談員ページの分離

## 15. ライセンス

MIT License