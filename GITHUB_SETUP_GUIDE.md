# GitHub同期版 セットアップガイド

## 🎯 概要

GitHub Pagesを使用した完全サーバーレス版のSessionTimerです。
- **API制限**: 完全回避（無制限）
- **コスト**: 完全無料
- **可用性**: GitHub CDNによる高可用性

## 📋 必要な準備

### 1. GitHubアカウント
- GitHub.comのアカウントが必要
- 無料アカウントで十分

### 2. GitHubリポジトリの作成

```bash
# 1. GitHub.comでリポジトリを作成
#    Repository name: timer-state (任意の名前)
#    Public repository（重要）
#    Initialize with README: チェック

# 2. GitHub Pagesを有効化
#    Settings > Pages > Source: Deploy from a branch
#    Branch: main / (root)
```

### 3. Personal Access Token の取得

```bash
# 1. GitHub.com > Settings > Developer settings > Personal access tokens > Tokens (classic)
# 2. Generate new token (classic)
# 3. Scopes: 
#    ✅ repo (Full control of private repositories)
#    ✅ public_repo (Access public repositories)
# 4. Generate token をクリック
# 5. トークンをコピーして保存（再表示されません）
```

## 🚀 使用方法

### 管理者（タイマー操作者）

1. **アクセス**: `http://localhost:3000/admin-github`

2. **初回設定**:
   ```
   GitHub Username: your-username
   Repository名: timer-state
   Personal Token: ghp_xxxxxxxxxx
   ```

3. **接続テスト**: 「接続テスト & 保存」をクリック

4. **タイマー操作**: 通常通り開始/停止/リセット

### 相談員（閲覧のみ）

1. **アクセス**: `http://localhost:3000/viewer-github`

2. **設定**:
   ```
   GitHub Username: your-username (管理者と同じ)
   Repository名: timer-state (管理者と同じ)
   ```

3. **接続**: 「接続」をクリック

4. **自動同期**: リアルタイムで状態が更新される

## 🔧 トラブルシューティング

### よくある問題と解決法

#### 1. 「リポジトリが見つかりません」
```
原因: リポジトリ名が間違っているか、プライベートリポジトリ
解決: 
- リポジトリ名を確認
- リポジトリをPublicに設定
- Personal Access Tokenの権限を確認
```

#### 2. 「GitHub Pagesに接続できません」
```
原因: GitHub Pagesが有効化されていない
解決:
1. リポジトリのSettings > Pages
2. Source: Deploy from a branch
3. Branch: main, / (root)
4. 5-10分待ってから再試行
```

#### 3. 「同期が遅い」
```
原因: GitHub Pagesの更新に時間がかかる
対策:
- 管理者操作時: 1-2秒で反映
- 相談員画面: 10秒間隔で自動更新
- 通常の使用には問題なし
```

#### 4. 「認証に失敗しました」
```
原因: Personal Access Tokenが間違っているか期限切れ
解決:
1. 新しいTokenを生成
2. repo権限があることを確認
3. Tokenをコピー＆ペーストで確実に入力
```

## 📊 リポジトリ構造

セットアップ完了後、リポジトリに以下のファイルが作成されます：

```
your-username/timer-state/
├── README.md
└── timer-state.json    # タイマー状態（自動生成）
```

### timer-state.json の例
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

## 🌐 本番環境での使用

### GitHub Pagesでの直接ホスティング

1. **HTMLファイルをリポジトリに追加**:
   ```
   timer-state/
   ├── index.html           # viewer-github.htmlをコピー
   ├── admin.html          # admin-github.htmlをコピー
   ├── github-sync-client.js
   └── timer-state.json
   ```

2. **アクセスURL**:
   ```
   管理画面: https://your-username.github.io/timer-state/admin.html
   相談員画面: https://your-username.github.io/timer-state/
   ```

### セキュリティベストプラクティス

1. **Personal Access Token**:
   - 管理者端末のみに保存
   - 定期的にローテーション
   - 最小権限の原則

2. **リポジトリ設定**:
   - Publicリポジトリ（必須）
   - 適切なREADME.mdで用途を明記

## 📈 使用制限とコスト

| 項目 | GitHub版 | 従来版 |
|------|----------|--------|
| 月間コスト | **$0** | $20-100 |
| API制限 | **なし** | あり |
| 同時アクセス | **無制限** | 制限あり |
| 可用性 | 99.9%+ | サーバー依存 |

## 🎉 メリット

✅ **完全無料**: GitHub Pagesは無料
✅ **API制限なし**: 読み取りは無制限
✅ **高可用性**: GitHub CDNの恩恵
✅ **グローバル**: 世界中からアクセス可能
✅ **履歴管理**: Git履歴で状態変更追跡
✅ **災害復旧**: 自動バックアップ

これで **完全無料かつ無制限** でタイマーシステムを運用できます！