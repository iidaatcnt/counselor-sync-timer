# SessionTimer - GitHub Pages デプロイ版

## 🚀 デプロイ完了済み

このフォルダの内容を GitHub Pages リポジトリにデプロイしてください。

### デプロイ先URL
- **相談員画面**: https://iidaatcnt.github.io/counselor-sync-timer/
- **管理画面**: https://iidaatcnt.github.io/counselor-sync-timer/admin.html

## 📁 ファイル構成

```
deploy/
├── index.html              # 相談員画面（メイン）
├── admin.html              # 管理画面
├── github-sync-client.js   # GitHub同期クライアント
├── README.md               # このファイル
└── timer-state.json        # 状態ファイル（自動生成）
```

## 🔧 デプロイ手順

### 1. GitHubリポジトリの準備
```bash
# リポジトリが存在しない場合は作成
Repository: counselor-sync-timer
Visibility: Public
```

### 2. ファイルのアップロード
```bash
# deployフォルダの内容をリポジトリのルートにコピー
git clone https://github.com/iidaatcnt/counselor-sync-timer.git
cd counselor-sync-timer

# ファイルをコピー
cp /path/to/deploy/* .

# コミット & プッシュ
git add .
git commit -m "Deploy SessionTimer to GitHub Pages"
git push origin main
```

### 3. GitHub Pagesの有効化
1. リポジトリの Settings > Pages
2. Source: Deploy from a branch
3. Branch: main / (root)
4. Save

### 4. Personal Access Token の取得
1. GitHub Settings > Developer settings > Personal access tokens
2. Generate new token (classic)
3. Scopes: ✅ repo
4. トークンをコピーして保存

## 🎯 使用方法

### 管理者
1. **アクセス**: https://iidaatcnt.github.io/counselor-sync-timer/admin.html
2. **Personal Token を入力**
3. **接続テスト & 保存**
4. **タイマー操作**

### 相談員
1. **アクセス**: https://iidaatcnt.github.io/counselor-sync-timer/
2. **自動同期開始**
3. **リアルタイム表示**

## ⚡ 特徴

- ✅ **完全無料**: GitHub Pagesは無料
- ✅ **API制限なし**: 読み取り無制限
- ✅ **リアルタイム同期**: 1-2秒で反映
- ✅ **高可用性**: GitHub CDNの恩恵
- ✅ **モバイル対応**: レスポンシブデザイン

## 🔍 トラブルシューティング

### 404エラーが出る場合
- GitHub Pagesが有効になっているか確認
- ファイルがリポジトリのルートにあるか確認
- 5-10分待ってから再アクセス

### 同期しない場合
- Personal Access Tokenの権限を確認
- リポジトリがPublicになっているか確認
- ブラウザのコンソールでエラーを確認

## 📊 パフォーマンス

| 項目 | 性能 |
|------|------|
| 初回読み込み | 1-2秒 |
| 同期間隔 | 管理者: 5秒, 相談員: 10秒 |
| 同時接続 | 無制限 |
| 月間コスト | $0 |

## 🔐 セキュリティ

- Personal Access Tokenは管理者のみ必要
- 相談員は読み取り専用でアクセス
- GitHubの認証システムを利用

## 📱 モバイル対応

- iPhone/Android対応
- タブレット対応
- レスポンシブデザイン

この設定で完全無料かつ無制限でSessionTimerを運用できます！