const express = require('express');
const cors = require('cors');
const path = require('path');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3000;

// HTTPサーバーの作成
const server = http.createServer(app);

// WebSocketサーバーの設定
const wss = new WebSocket.Server({ server });

// ミドルウェア
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// タイマーの状態を管理するグローバル変数
let timerState = {
    isRunning: false,
    isPaused: false,
    startTime: null,
    pausedDuration: 0,
    lastPauseTime: null,
    currentTime: 0
};

// 接続されているWebSocketクライアントを管理
const clients = new Set();

// WebSocket接続の処理
wss.on('connection', (ws) => {
    console.log('新しいWebSocketクライアントが接続しました');
    clients.add(ws);

    // 現在のタイマー状態を新しいクライアントに送信
    ws.send(JSON.stringify({
        type: 'timer-update',
        state: timerState,
        timestamp: Date.now()
    }));

    // メッセージ受信時の処理
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log('WebSocketメッセージ受信:', data);

            // すべてのクライアントに状態更新を送信（送信元を除く）
            broadcastToClients(data, ws);
        } catch (error) {
            console.error('WebSocketメッセージ処理エラー:', error);
        }
    });

    // 接続終了時の処理
    ws.on('close', () => {
        console.log('WebSocketクライアントが切断しました');
        clients.delete(ws);
    });

    // エラー処理
    ws.on('error', (error) => {
        console.error('WebSocketエラー:', error);
        clients.delete(ws);
    });
});

// すべてのWebSocketクライアントにメッセージを送信
function broadcastToClients(data, excludeClient = null) {
    const message = JSON.stringify(data);
    clients.forEach((client) => {
        if (client !== excludeClient && client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

// タイマーの現在の状態を計算
function calculateCurrentState() {
    if (timerState.isRunning && !timerState.isPaused) {
        const now = Date.now();
        const elapsed = now - timerState.startTime - timerState.pausedDuration;
        timerState.currentTime = elapsed;
    } else if (timerState.isPaused) {
        const elapsed = timerState.lastPauseTime - timerState.startTime - timerState.pausedDuration;
        timerState.currentTime = elapsed;
    }
    return timerState;
}

// APIエンドポイント

// タイマー状態の取得
app.get('/api/timer', (req, res) => {
    const currentState = calculateCurrentState();
    res.json(currentState);
});

// タイマー状態の更新
app.post('/api/timer', (req, res) => {
    const { action, state, timestamp } = req.body;

    console.log(`タイマーアクション: ${action}`, state);

    try {
        switch (action) {
            case 'start':
                if (!timerState.isRunning) {
                    // 新規開始
                    timerState.isRunning = true;
                    timerState.isPaused = false;
                    timerState.startTime = Date.now();
                    timerState.pausedDuration = 0;
                    timerState.lastPauseTime = null;
                } else if (timerState.isPaused) {
                    // 一時停止からの再開
                    const pauseDuration = Date.now() - timerState.lastPauseTime;
                    timerState.pausedDuration += pauseDuration;
                    timerState.isPaused = false;
                    timerState.lastPauseTime = null;
                }
                break;

            case 'pause':
                if (timerState.isRunning && !timerState.isPaused) {
                    timerState.isPaused = true;
                    timerState.lastPauseTime = Date.now();
                }
                break;

            case 'stop':
                timerState.isRunning = false;
                timerState.isPaused = false;
                timerState.currentTime = 0;
                timerState.startTime = null;
                timerState.pausedDuration = 0;
                timerState.lastPauseTime = null;
                break;

            case 'reset':
                timerState.isRunning = false;
                timerState.isPaused = false;
                timerState.currentTime = 0;
                timerState.startTime = null;
                timerState.pausedDuration = 0;
                timerState.lastPauseTime = null;
                break;

            default:
                return res.status(400).json({ 
                    success: false, 
                    error: 'Invalid action' 
                });
        }

        // WebSocketで全クライアントに通知
        broadcastToClients({
            type: 'timer-update',
            action: action,
            state: timerState,
            timestamp: Date.now(),
            source: 'api'
        });

        res.json({ 
            success: true, 
            state: timerState,
            message: `Timer ${action} successful`
        });

    } catch (error) {
        console.error('タイマー更新エラー:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// ヘルスチェックエンドポイント
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        timestamp: Date.now(),
        timerState: timerState,
        connectedClients: clients.size
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

// サーバー起動
server.listen(PORT, () => {
    console.log(`サーバーが起動しました: http://localhost:${PORT}`);
    console.log(`管理画面: http://localhost:${PORT}/admin`);
    console.log(`表示画面: http://localhost:${PORT}/`);
});

// グレースフルシャットダウン
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        // WebSocketクライアントをすべて閉じる
        clients.forEach((client) => {
            client.close();
        });
        wss.close(() => {
            console.log('WebSocket server closed');
            process.exit(0);
        });
    });
});