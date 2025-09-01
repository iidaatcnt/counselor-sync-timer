const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ミドルウェア
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// タイマー状態の管理は api/timer.js で行う

// APIエンドポイント - 新しいAPI実装を直接読み込み
const timerHandler = require('./api/timer.js');

// APIルートの設定
app.all('/api/timer', (req, res) => {
    timerHandler(req, res);
});

// ヘルスチェックエンドポイント
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        timestamp: Date.now()
    });
});

// 静的ファイルの提供
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/viewer', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'viewer.html'));
});

app.get('/viewer.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'viewer.html'));
});

// 最適化版のルート
app.get('/admin-optimized', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-optimized.html'));
});

app.get('/viewer-optimized', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'viewer-optimized.html'));
});

// GitHub同期版のルート
app.get('/admin-github', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-github.html'));
});

app.get('/viewer-github', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'viewer-github.html'));
});

// サーバー起動
app.listen(PORT, () => {
    console.log(`サーバーが起動しました: http://localhost:${PORT}`);
    console.log(`管理画面: http://localhost:${PORT}/admin`);
    console.log(`相談員画面: http://localhost:${PORT}/viewer`);
    console.log(`表示画面: http://localhost:${PORT}/`);
    console.log('');
    console.log('🚀 最適化版（API呼び出し削減）:');
    console.log(`管理画面: http://localhost:${PORT}/admin-optimized`);
    console.log(`相談員画面: http://localhost:${PORT}/viewer-optimized`);
    console.log('');
    console.log('🔥 GitHub同期版（完全サーバーレス）:');
    console.log(`管理画面: http://localhost:${PORT}/admin-github`);
    console.log(`相談員画面: http://localhost:${PORT}/viewer-github`);
    console.log('HTTPポーリング方式で動作中（セッション管理対応版）');
});

// グレースフルシャットダウン
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    process.exit(0);
});