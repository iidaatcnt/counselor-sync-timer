// Vercel用のタイマーAPI - カウントダウン対応版
// このコードをapi/timer.jsに保存してください

// グローバル変数でタイマー状態を管理
let timerState = {
    isRunning: false,
    isPaused: false,
    startTime: null,
    totalDuration: 20 * 60 * 1000, // デフォルト20分
    remainingTime: 20 * 60 * 1000,
    pausedAt: null
};

export default function handler(req, res) {
    // CORS設定
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
        // 実行中の場合、残り時間を計算
        if (timerState.isRunning && !timerState.isPaused) {
            const elapsed = Date.now() - timerState.startTime;
            timerState.remainingTime = Math.max(0, timerState.totalDuration - elapsed);
            
            // タイムアップしたら自動停止
            if (timerState.remainingTime === 0) {
                timerState.isRunning = false;
            }
        }
        
        console.log('GET response:', timerState); // デバッグ用
        res.status(200).json(timerState);
        return;
    }

    // POST: タイマーを操作
    if (req.method === 'POST') {
        const { action, state } = req.body;
        console.log('POST request:', { action, state }); // デバッグ用

        switch (action) {
            case 'start':
                if (!timerState.isRunning) {
                    // 新規開始（stateから設定を受け取る）
                    if (state && state.totalDuration) {
                        timerState.totalDuration = state.totalDuration;
                        timerState.remainingTime = state.totalDuration;
                    }
                    timerState.isRunning = true;
                    timerState.isPaused = false;
                    timerState.startTime = Date.now();
                    timerState.pausedAt = null;
                } else if (timerState.isPaused) {
                    // 一時停止からの再開
                    const pauseDuration = Date.now() - timerState.pausedAt;
                    timerState.startTime += pauseDuration;
                    timerState.isPaused = false;
                    timerState.pausedAt = null;
                }
                break;

            case 'pause':
                if (timerState.isRunning && !timerState.isPaused) {
                    timerState.isPaused = true;
                    timerState.pausedAt = Date.now();
                    // 現在の残り時間を保存
                    const elapsed = Date.now() - timerState.startTime;
                    timerState.remainingTime = Math.max(0, timerState.totalDuration - elapsed);
                }
                break;

            case 'stop':
                timerState.isRunning = false;
                timerState.isPaused = false;
                timerState.startTime = null;
                timerState.remainingTime = timerState.totalDuration;
                timerState.pausedAt = null;
                break;

            case 'reset':
                // リセット時に新しい時間設定を受け取る
                if (state && state.totalDuration) {
                    timerState.totalDuration = state.totalDuration;
                }
                timerState.isRunning = false;
                timerState.isPaused = false;
                timerState.startTime = null;
                timerState.remainingTime = timerState.totalDuration;
                timerState.pausedAt = null;
                break;
        }

        console.log('POST response:', timerState); // デバッグ用
        res.status(200).json({ 
            success: true, 
            state: timerState
        });
        return;
    }

    res.status(405).json({ error: 'Method not allowed' });
}