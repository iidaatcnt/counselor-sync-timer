# GitHub Pages 状態同期戦略

## 🎯 コンセプト

GitHubリポジトリの特定ファイルをタイマー状態のデータストアとして使用する完全サーバーレスソリューション。

## 📁 データ構造

### timer-state.json
```json
{
  "lastUpdate": 1755734400000,
  "startTime": 1755734350000,
  "totalDuration": 7200000,
  "sessionDuration": 1200000,
  "isPaused": false,
  "pausedAt": null,
  "pausedElapsed": 0,
  "sessionStartTime": 1755734350000,
  "sessionPausedElapsed": 0,
  "isRunning": true,
  "action": "start",
  "actionBy": "admin-001",
  "version": 42
}
```

## 🔄 同期メカニズム

### 1. 読み取り同期
```javascript
// GitHub Pages経由でJSONファイルを取得
const response = await fetch('https://username.github.io/timer-repo/timer-state.json');
const state = await response.json();
```

### 2. 書き込み同期（管理者のみ）
```javascript
// GitHub API経由でファイル更新
const response = await fetch('https://api.github.com/repos/username/timer-repo/contents/timer-state.json', {
  method: 'PUT',
  headers: {
    'Authorization': `token ${GITHUB_TOKEN}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: 'Update timer state',
    content: btoa(JSON.stringify(newState)),
    sha: currentSha
  })
});
```

## 📊 APIレート制限比較

| サービス | 制限 | SessionTimer使用量 |
|----------|------|-------------------|
| GitHub API | 5,000回/時 | 管理操作時のみ（~10回/時） |
| GitHub Pages | 無制限 | 読み取り専用（全端末） |
| Vercel API | 100,000回/月 | 0回（完全回避） |

## 🔐 セキュリティ

### Personal Access Token
- 管理者端末のみに設定
- `repo` スコープのみ
- 環境変数で管理

### 読み取り専用アクセス
- 相談員端末はGitHub Pagesから読み取りのみ
- 認証不要でアクセス可能

## ⚡ 同期戦略

### 管理画面
```
操作時: GitHub API経由で即座に更新
監視: GitHub Pages経由で5秒ごとに確認（競合検出）
```

### 相談員画面
```
監視: GitHub Pages経由で10秒ごとに確認
キャッシュ: CDN効果で高速アクセス
```

## 🚀 実装メリット

1. **ゼロコスト**: 完全無料運用
2. **無制限**: API制限の心配なし  
3. **高可用性**: GitHub CDNの恩恵
4. **履歴管理**: Git履歴で状態変更追跡
5. **災害復旧**: 自動バックアップ
6. **スケーラブル**: 相談員数無制限

## 🔧 技術仕様

### GitHub Pages設定
```
Repository: timer-state
Branch: main
Directory: / (root)
File: timer-state.json
URL: https://username.github.io/timer-state/timer-state.json
```

### 自動デプロイ
- GitHub Actionsで自動更新
- ファイル変更時に即座にPages反映
- 1-2秒で全世界に配信

## 📈 パフォーマンス予測

### 従来版 vs GitHub版

| 項目 | 従来版 | GitHub版 |
|------|--------|----------|
| API呼び出し/時 | 3,600回 | 10回 |
| 月間コスト | $20-100 | $0 |
| レスポンス時間 | 100-500ms | 50-200ms |
| 同時アクセス | 制限あり | 無制限 |
| ダウンタイム | Vercel依存 | GitHub SLA |

この戦略により、**完全無料かつ無制限でタイマーシステムを運用**できます！