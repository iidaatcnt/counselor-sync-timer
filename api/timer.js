// Vercel用のタイマーAPI - セッション管理対応版
// SPEC.mdの仕様に準拠したセッション管理機能

// グローバル変数でタイマー状態を管理
let timerState = {
    // 基本状態
    startTime: null,
    totalDuration: 120 * 60 * 1000, // デフォルト2時間
    sessionDuration: 20 * 60 * 1000, // デフォルト20分
    isPaused: false,
    pausedAt: null,
    pausedElapsed: 0,
    
    // セッション管理
    sessionStartTime: null,
    sessionPausedElapsed: 0,
    isRunning: false,
    
    // 計算済み値
    remainingTotal: 120 * 60 * 1000,
    remainingSession: 20 * 60 * 1000,
    currentTime: null
};

module.exports = function handler(req, res) {
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
        const now = Date.now();
        timerState.currentTime = now;
        
        // 実行中の場合、残り時間を計算
        if (timerState.isRunning && !timerState.isPaused && timerState.startTime) {
            const totalElapsed = (now - timerState.startTime) + timerState.pausedElapsed;
            const sessionElapsed = (now - (timerState.sessionStartTime || timerState.startTime)) + timerState.sessionPausedElapsed;
            
            timerState.remainingTotal = Math.max(0, timerState.totalDuration - totalElapsed);
            timerState.remainingSession = Math.max(0, timerState.sessionDuration - sessionElapsed);
            
            // セッション終了チェック
            if (timerState.remainingSession === 0 && timerState.remainingTotal > 0) {
                // 自動的に次のセッションを開始
                timerState.sessionStartTime = now;
                timerState.sessionPausedElapsed = 0;
                timerState.remainingSession = timerState.sessionDuration;
            }
            
            // 全体タイムアップチェック
            if (timerState.remainingTotal === 0) {
                timerState.isRunning = false;
                timerState.isPaused = false;
            }
        }
        
        console.log('GET response:', timerState); // デバッグ用
        res.status(200).json(timerState);
        return;
    }

    // POST: タイマーを操作
    if (req.method === 'POST') {
        const { action, totalMinutes, sessionMinutes } = req.body;
        const now = Date.now();
        console.log('POST request:', { action, totalMinutes, sessionMinutes }); // デバッグ用

        switch (action) {
            case 'start':
                if (!timerState.isRunning) {
                    // 新規開始
                    timerState.isRunning = true;
                    timerState.isPaused = false;
                    timerState.startTime = now;
                    timerState.sessionStartTime = now;
                    timerState.pausedAt = null;
                    timerState.pausedElapsed = 0;
                    timerState.sessionPausedElapsed = 0;
                    timerState.remainingTotal = timerState.totalDuration;
                    timerState.remainingSession = timerState.sessionDuration;
                } else if (timerState.isPaused) {
                    // 一時停止からの再開
                    const pauseDuration = now - timerState.pausedAt;
                    timerState.pausedElapsed += pauseDuration;
                    timerState.sessionPausedElapsed += pauseDuration;
                    timerState.isPaused = false;
                    timerState.pausedAt = null;
                }
                break;

            case 'pause':
                if (timerState.isRunning && !timerState.isPaused) {
                    timerState.isPaused = true;
                    timerState.pausedAt = now;
                    
                    // 現在の残り時間を計算して保存
                    if (timerState.startTime) {
                        const totalElapsed = (now - timerState.startTime) + timerState.pausedElapsed;
                        const sessionElapsed = (now - (timerState.sessionStartTime || timerState.startTime)) + timerState.sessionPausedElapsed;
                        
                        timerState.remainingTotal = Math.max(0, timerState.totalDuration - totalElapsed);
                        timerState.remainingSession = Math.max(0, timerState.sessionDuration - sessionElapsed);
                    }
                }
                break;

            case 'reset':
                // 時間設定の更新
                if (totalMinutes !== undefined) {
                    timerState.totalDuration = totalMinutes * 60 * 1000;
                }
                if (sessionMinutes !== undefined) {
                    timerState.sessionDuration = sessionMinutes * 60 * 1000;
                }
                
                // 状態のリセット
                timerState.isRunning = false;
                timerState.isPaused = false;
                timerState.startTime = null;
                timerState.sessionStartTime = null;
                timerState.pausedAt = null;
                timerState.pausedElapsed = 0;
                timerState.sessionPausedElapsed = 0;
                timerState.remainingTotal = timerState.totalDuration;
                timerState.remainingSession = timerState.sessionDuration;
                break;

            case 'nextSession':
                if (timerState.isRunning) {
                    // 新しいセッションを開始
                    timerState.sessionStartTime = now;
                    timerState.sessionPausedElapsed = 0;
                    timerState.remainingSession = timerState.sessionDuration;
                }
                break;

            case 'setTime':
                // 実行中でない場合のみ時間変更を許可
                if (!timerState.isRunning) {
                    if (totalMinutes !== undefined) {
                        timerState.totalDuration = totalMinutes * 60 * 1000;
                        timerState.remainingTotal = timerState.totalDuration;
                    }
                    if (sessionMinutes !== undefined) {
                        timerState.sessionDuration = sessionMinutes * 60 * 1000;
                        timerState.remainingSession = timerState.sessionDuration;
                    }
                }
                break;
        }

        // レスポンス用の現在時刻を設定
        timerState.currentTime = now;
        
        console.log('POST response:', timerState); // デバッグ用
        res.status(200).json({ 
            success: true, 
            state: timerState,
            currentTime: now
        });
        return;
    }

    res.status(405).json({ error: 'Method not allowed' });
}