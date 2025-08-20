const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

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
    currentTime: 0,
    totalDuration: 5 * 60 * 1000, // デフォルト5分
    remainingTime: 5 * 60 * 1000
};

// WebSocketを削除 - HTTPポーリングのみ使用

// タイマーの現在の状態を計算
function calculateCurrentState() {
    if (timerState.isRunning && !timerState.isPaused) {
        const now = Date.now();
        const elapsed = now - timerState.startTime - timerState.pausedDuration;
        timerState.currentTime = elapsed;
        timerState.remainingTime = Math.max(0, timerState.totalDuration - elapsed);
    } else if (timerState.isPaused) {
        const elapsed = timerState.lastPauseTime - timerState.startTime - timerState.pausedDuration;
        timerState.currentTime = elapsed;
        timerState.remainingTime = Math.max(0, timerState.totalDuration - elapsed);
    }
    return timerState;
}

// APIエンドポイント

// タイマー状態の取得
app.get('/api/timer', (req, res) => {
    const currentState = calculateCurrentState();
    console.log('GET /api/timer - 現在の状態:', {
        isRunning: currentState.isRunning,
        isPaused: currentState.isPaused,
        totalDuration: currentState.totalDuration,
        remainingTime: currentState.remainingTime
    });
    res.json(currentState);
});

// タイマー状態の更新
app.post('/api/timer', (req, res) => {
    const { action, state, timestamp } = req.body;

    console.log(`タイマーアクション: ${action}`, state);
    console.log('アクション前のサーバー状態:', {
        totalDuration: timerState.totalDuration,
        remainingTime: timerState.remainingTime
    });

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
                    
                    // クライアントから送られてきた時間設定を保存
                    if (state && state.totalDuration) {
                        timerState.totalDuration = state.totalDuration;
                        timerState.remainingTime = state.totalDuration;
                    }
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
                    
                    // 現在の残り時間を計算して保存
                    const elapsed = Date.now() - timerState.startTime - timerState.pausedDuration;
                    timerState.remainingTime = Math.max(0, timerState.totalDuration - elapsed);
                }
                
                // クライアントから送られてきた時間設定を保持
                if (state && state.totalDuration) {
                    timerState.totalDuration = state.totalDuration;
                }
                break;

            case 'stop':
                timerState.isRunning = false;
                timerState.isPaused = false;
                timerState.currentTime = 0;
                timerState.startTime = null;
                timerState.pausedDuration = 0;
                timerState.lastPauseTime = null;
                // 停止時は時間設定は保持し、残り時間を総時間にリセット
                timerState.remainingTime = timerState.totalDuration;
                break;

            case 'reset':
                timerState.isRunning = false;
                timerState.isPaused = false;
                timerState.currentTime = 0;
                timerState.startTime = null;
                timerState.pausedDuration = 0;
                timerState.lastPauseTime = null;
                
                // クライアントから送られてきた時間設定を保存
                if (state && state.totalDuration) {
                    timerState.totalDuration = state.totalDuration;
                    timerState.remainingTime = state.totalDuration;
                }
                break;

            default:
                return res.status(400).json({ 
                    success: false, 
                    error: 'Invalid action' 
                });
        }

        console.log('アクション後のサーバー状態:', {
            totalDuration: timerState.totalDuration,
            remainingTime: timerState.remainingTime
        });

        // WebSocket削除 - クライアントは定期ポーリングで取得

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
        timerState: timerState
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
app.listen(PORT, () => {
    console.log(`サーバーが起動しました: http://localhost:${PORT}`);
    console.log(`管理画面: http://localhost:${PORT}/admin`);
    console.log(`表示画面: http://localhost:${PORT}/`);
    console.log('HTTPポーリング方式で動作中');
});

// グレースフルシャットダウン
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    process.exit(0);
});