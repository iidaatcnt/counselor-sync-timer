// Vercel用のタイマーAPI
// このコードをapi/timer.jsにコピーして置き換えてください

// グローバル変数でタイマー状態を管理
let timerState = {
    isRunning: false,
    isPaused: false,
    startTime: null,
    pausedDuration: 0,
    lastPauseTime: null,
    currentTime: 0
};

export default function handler(req, res) {
    // CORS設定（重要：これがないとブラウザからアクセスできない）
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // GET: タイマーの現在状態を返す
    if (req.method === 'GET') {
        // 実行中の場合、現在時刻を計算
        if (timerState.isRunning && !timerState.isPaused) {
            const now = Date.now();
            const elapsed = now - timerState.startTime - timerState.pausedDuration;
            timerState.currentTime = elapsed;
        }
        
        res.status(200).json(timerState);
        return;
    }

    // POST: タイマーを操作
    if (req.method === 'POST') {
        const { action } = req.body;

        switch (action) {
            case 'start':
                if (!timerState.isRunning) {
                    timerState.isRunning = true;
                    timerState.isPaused = false;
                    timerState.startTime = Date.now();
                    timerState.pausedDuration = 0;
                    timerState.lastPauseTime = null;
                } else if (timerState.isPaused) {
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
            case 'reset':
                timerState = {
                    isRunning: false,
                    isPaused: false,
                    startTime: null,
                    pausedDuration: 0,
                    lastPauseTime: null,
                    currentTime: 0
                };
                break;
        }

        res.status(200).json({ 
            success: true, 
            state: timerState
        });
        return;
    }

    res.status(405).json({ error: 'Method not allowed' });
}