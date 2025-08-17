# Counselor Sync Timer 📱⏱️

相談会での複数カウンセラーによる同期セッション管理タイマー

[![Vercel](https://img.shields.io/badge/deployed%20on-Vercel-black)](https://sessiontimer.vercel.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🎯 概要

**Counselor Sync Timer** は、複数のカウンセラーが同時に相談セッションを行う際の時間管理を支援するリアルタイム同期タイマーアプリケーションです。管理者による一元制御により、全てのカウンセラーが同じタイマーを共有し、公平で効率的な相談会運営を実現します。

## 🔧 解決する課題

### 従来の問題
- ❌ カウンセラー個別のタイマー管理によるスタート忘れ
- ❌ 物理時計の座席による視認性の差
- ❌ 時間のバラつきによる相談者への不公平感
- ❌ セッション入れ替えタイミングの不統一

### 本アプリの解決策
- ✅ 管理者による一元的なタイマー制御
- ✅ 全カウンセラーのスマートフォン/PCで同期表示
- ✅ ヒューマンエラーの完全排除
- ✅ 座席レイアウトに依存しない個別表示

## 🚀 機能

### タイマー機能
- **全体タイマー**: 相談会全体の残り時間（初期値: 2時間）
- **セッションタイマー**: 1セッションの残り時間（初期値: 20分）
- **リアルタイム同期**: 1秒程度の精度で全デバイス同期

### 操作機能（管理者のみ）
- **Start**: タイマー開始・再開
- **Pause**: タイマー一時停止
- **Reset**: 全タイマーを初期値にリセット
- **Next**: セッションタイマーのみリセット（次の相談者へ）

### ユーザーインターフェース
- **レスポンシブデザイン**: スマートフォン〜デスクトップ対応
- **視覚的フィードバック**: タイマー終了時の点滅表示
- **接続状態表示**: リアルタイム通信状況の確認

## 💼 想定利用シーン

### 基本的な使用例
```
👨‍💼 管理者 (1名)
├── 管理者ページで全体制御
└── sessiontimer.vercel.app/admin

👩‍⚕️ カウンセラー (5-10名)
├── 各自のスマートフォン/PCでタイマー確認
├── sessiontimer.vercel.app/
└── 1対1または1対2での相談対応

🕐 セッション管理
├── 20分/セッション
├── 一斉入れ替えで不公平感を排除
└── 管理者の統一制御でヒューマンエラー防止
```

### 運用フロー
1. **開始前**: 管理者がタイマーをリセット
2. **セッション開始**: 管理者がStartボタンで一斉開始
3. **途中確認**: カウンセラーが各自の端末で残り時間確認
4. **セッション終了**: 管理者がNextボタンで次セッションへ
5. **全体終了**: 全体タイマー終了で相談会終了

## 🏗️ 技術仕様

### アーキテクチャ
- **フロントエンド**: HTML5, CSS3, Vanilla JavaScript
- **バックエンド**: Node.js, Express.js
- **通信方式**: REST API + ポーリング（1秒間隔）
- **ホスティング**: Vercel (サーバーレス)

### API エンドポイント
```
GET  /api/timer        # タイマー状態取得
POST /api/timer/start  # タイマー開始
POST /api/timer/pause  # タイマー一時停止
POST /api/timer/reset  # 全リセット
POST /api/timer/next   # セッションリセット
```

### 対応デバイス
- 📱 スマートフォン (iOS/Android)
- 💻 パソコン (Windows/Mac/Linux)
- 🖥️ タブレット (iPad/Android)
- 🌐 モダンブラウザ (Chrome, Firefox, Safari, Edge)

## 🚀 使用方法

### 1. アクセス方法

**カウンセラー用（閲覧専用）**
```
https://sessiontimer.vercel.app/
```

**管理者用（操作可能）**
```
https://sessiontimer.vercel.app/admin
```

### 2. 基本操作

#### 管理者の操作手順
1. 管理者ページにアクセス
2. 「Reset」で初期状態に設定
3. カウンセラー全員の準備完了を確認
4. 「Start」でセッション開始
5. 20分後に「Next」で次セッションへ
6. 全セッション終了まで繰り返し

#### カウンセラーの利用方法
1. 閲覧者ページにアクセス
2. 接続状態が「接続済み」になることを確認
3. セッション中は画面で残り時間を確認
4. 操作は一切不要（管理者が制御）

## 📊 性能・制限事項

### 同期性能
- **同期精度**: 1秒程度のばらつき
- **対応人数**: 理論上1000人以上（実用上10-20人想定）
- **通信量**: 200バイト/秒/ユーザー（軽量）

### 制限事項
- インターネット接続が必要
- JavaScript有効ブラウザが必要
- Vercelの無料プラン制限内での運用

## 🛠️ 開発・カスタマイズ

### ローカル開発
```bash
# リポジトリをクローン
git clone https://github.com/iidaatcnt/counselor-sync-timer.git
cd counselor-sync-timer

# 依存関係をインストール
npm install

# 開発サーバー起動
npm start

# アクセス
# 閲覧者: http://localhost:3000/
# 管理者: http://localhost:3000/admin
```

### カスタマイズ例
- タイマー初期値の変更 (`server.js` の `timerState`)
- ポーリング間隔の調整 (`index.html`, `admin.html`)
- デザインのカスタマイズ (CSS部分)

## 📁 プロジェクト構造

```
counselor-sync-timer/
├── server.js              # Express API サーバー
├── public/
│   ├── index.html         # カウンセラー用閲覧ページ
│   └── admin.html         # 管理者用操作ページ
├── package.json           # Node.js依存関係
├── vercel.json           # Vercel設定
├── SPEC.md               # 技術仕様書
└── README.md             # このファイル
```

## 🤝 貢献

バグ報告、機能提案、プルリクエストを歓迎します！

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📝 ライセンス

このプロジェクトは [MIT License](https://opensource.org/licenses/MIT) の下で公開されています。

## 📧 お問い合わせ

プロジェクトに関する質問や提案は、[GitHub Issues](https://github.com/iidaatcnt/counselor-sync-timer/issues) をご利用ください。

---

**Created with ❤️ for efficient counseling session management**