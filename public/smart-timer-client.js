// スマートタイマークライアント - API呼び出し最適化版
class SmartTimerClient {
    constructor(isAdmin = false) {
        this.isAdmin = isAdmin;
        this.timerState = {
            startTime: null,
            totalDuration: 120 * 60 * 1000,
            sessionDuration: 20 * 60 * 1000,
            isPaused: false,
            pausedAt: null,
            pausedElapsed: 0,
            sessionStartTime: null,
            sessionPausedElapsed: 0,
            isRunning: false,
            remainingTotal: 120 * 60 * 1000,
            remainingSession: 20 * 60 * 1000,
            currentTime: null
        };
        
        // 同期戦略の設定
        this.syncConfig = {
            // 状態に応じた同期間隔（秒）
            running: 30,      // 実行中: 30秒ごと（毎分2回）
            paused: 60,       // 一時停止: 1分ごと（毎分1回）
            stopped: 300,     // 停止中: 5分ごと（毎時12回）
            adminActive: 10,  // 管理画面アクティブ時: 10秒ごと
            background: 120   // バックグラウンド: 2分ごと
        };
        
        this.lastSync = 0;
        this.localStartTime = null;
        this.syncInterval = null;
        this.displayInterval = null;
        this.isBackground = false;
        this.lastActivity = Date.now();
        this.needsSync = true;
        
        this.init();
    }
    
    init() {
        this.setupVisibilityHandling();
        this.setupActivityTracking();
        this.startLocalTimer();
        this.startSmartSync();
    }
    
    // ユーザーアクティビティの監視
    setupActivityTracking() {
        if (this.isAdmin) {
            ['click', 'keypress', 'mousemove'].forEach(event => {
                document.addEventListener(event, () => {
                    this.lastActivity = Date.now();
                });
            });
        }
    }
    
    // ページの表示/非表示の処理
    setupVisibilityHandling() {
        document.addEventListener('visibilitychange', () => {
            this.isBackground = document.hidden;
            if (!this.isBackground) {
                // フォアグラウンドに戻ったら即座に同期
                this.forceSync();
            }
        });
    }
    
    // ローカルタイマーによる補間
    startLocalTimer() {
        this.displayInterval = setInterval(() => {
            this.updateLocalTime();
            this.updateDisplay();
        }, 100); // 100msごとに表示更新
    }
    
    // ローカル時間の計算
    updateLocalTime() {
        if (!this.timerState.isRunning || this.timerState.isPaused || !this.timerState.startTime) {
            return;
        }
        
        const now = Date.now();
        const totalElapsed = (now - this.timerState.startTime) + this.timerState.pausedElapsed;
        const sessionElapsed = (now - (this.timerState.sessionStartTime || this.timerState.startTime)) + this.timerState.sessionPausedElapsed;
        
        this.timerState.remainingTotal = Math.max(0, this.timerState.totalDuration - totalElapsed);
        this.timerState.remainingSession = Math.max(0, this.timerState.sessionDuration - sessionElapsed);
        
        // セッション自動終了の検出
        if (this.timerState.remainingSession === 0 && this.timerState.remainingTotal > 0) {
            this.needsSync = true; // サーバー同期が必要
        }
    }
    
    // スマート同期の開始
    startSmartSync() {
        this.syncInterval = setInterval(() => {
            if (this.shouldSync()) {
                this.sync();
            }
        }, 1000); // 1秒ごとに同期判定
        
        // 初回同期
        this.sync();
    }
    
    // 同期が必要かどうかの判定
    shouldSync() {
        const now = Date.now();
        const timeSinceLastSync = now - this.lastSync;
        
        // 強制同期が必要
        if (this.needsSync) {
            return true;
        }
        
        // 状態に応じた同期間隔を決定
        let interval;
        
        if (this.isBackground) {
            interval = this.syncConfig.background * 1000;
        } else if (this.isAdmin && (now - this.lastActivity) < 60000) {
            // 管理画面でアクティブな場合
            interval = this.syncConfig.adminActive * 1000;
        } else if (this.timerState.isRunning && !this.timerState.isPaused) {
            interval = this.syncConfig.running * 1000;
        } else if (this.timerState.isPaused) {
            interval = this.syncConfig.paused * 1000;
        } else {
            interval = this.syncConfig.stopped * 1000;
        }
        
        return timeSinceLastSync >= interval;
    }
    
    // 強制同期
    forceSync() {
        this.needsSync = true;
        this.sync();
    }
    
    // サーバーとの同期
    async sync() {
        try {
            const response = await fetch('/api/timer', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (!response.ok) {
                throw new Error('Sync failed');
            }
            
            const serverState = await response.json();
            this.updateFromServer(serverState);
            this.lastSync = Date.now();
            this.needsSync = false;
            
            this.onSyncSuccess();
            
        } catch (error) {
            console.error('同期エラー:', error);
            this.onSyncError(error);
        }
    }
    
    // サーバー状態での更新
    updateFromServer(serverState) {
        const wasRunning = this.timerState.isRunning;
        this.timerState = { ...serverState };
        
        // 状態変化の検出
        if (!wasRunning && this.timerState.isRunning) {
            this.onTimerStart();
        } else if (wasRunning && !this.timerState.isRunning) {
            this.onTimerStop();
        }
    }
    
    // タイマー操作（管理画面のみ）
    async sendAction(action, data = {}) {
        if (!this.isAdmin) {
            throw new Error('Unauthorized action');
        }
        
        try {
            const response = await fetch('/api/timer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, ...data })
            });
            
            if (!response.ok) {
                throw new Error('Action failed');
            }
            
            const result = await response.json();
            if (result.success && result.state) {
                this.updateFromServer(result.state);
            }
            
            // 操作後は即座に同期を要求
            this.needsSync = true;
            
            return result;
            
        } catch (error) {
            console.error('操作エラー:', error);
            throw error;
        }
    }
    
    // 統計情報の取得
    getStats() {
        const now = Date.now();
        const uptime = now - (this.localStartTime || now);
        const estimatedCallsPerHour = this.calculateEstimatedCalls();
        
        return {
            uptime: uptime,
            lastSync: this.lastSync,
            estimatedCallsPerHour: estimatedCallsPerHour,
            currentSyncInterval: this.getCurrentSyncInterval(),
            isBackground: this.isBackground
        };
    }
    
    getCurrentSyncInterval() {
        const now = Date.now();
        
        if (this.isBackground) {
            return this.syncConfig.background;
        } else if (this.isAdmin && (now - this.lastActivity) < 60000) {
            return this.syncConfig.adminActive;
        } else if (this.timerState.isRunning && !this.timerState.isPaused) {
            return this.syncConfig.running;
        } else if (this.timerState.isPaused) {
            return this.syncConfig.paused;
        } else {
            return this.syncConfig.stopped;
        }
    }
    
    calculateEstimatedCalls() {
        const interval = this.getCurrentSyncInterval();
        return Math.ceil(3600 / interval); // 1時間あたりの予想呼び出し回数
    }
    
    // イベントハンドラー（オーバーライド用）
    onSyncSuccess() {}
    onSyncError(error) {}
    onTimerStart() {}
    onTimerStop() {}
    updateDisplay() {}
}

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SmartTimerClient;
}