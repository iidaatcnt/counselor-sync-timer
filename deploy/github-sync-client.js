// GitHub Pages 状態同期クライアント
class GitHubSyncClient {
    constructor(config = {}) {
        this.config = {
            owner: config.owner || 'your-username',
            repo: config.repo || 'timer-state',
            filePath: config.filePath || 'timer-state.json',
            githubToken: config.githubToken || null, // 管理者のみ
            pagesUrl: config.pagesUrl || `https://${config.owner || 'your-username'}.github.io/${config.repo || 'timer-state'}`,
            isAdmin: config.isAdmin || false,
            pollInterval: config.pollInterval || 10000, // 10秒間隔
            maxRetries: config.maxRetries || 3
        };
        
        this.timerState = {
            lastUpdate: null,
            startTime: null,
            totalDuration: 120 * 60 * 1000,
            sessionDuration: 20 * 60 * 1000,
            isPaused: false,
            pausedAt: null,
            pausedElapsed: 0,
            sessionStartTime: null,
            sessionPausedElapsed: 0,
            isRunning: false,
            action: 'init',
            actionBy: 'system',
            version: 0
        };
        
        this.lastKnownSha = null;
        this.pollTimer = null;
        this.isPolling = false;
        this.listeners = [];
        this.retryCount = 0;
        
        this.init();
    }
    
    init() {
        this.startPolling();
        this.setupVisibilityHandling();
    }
    
    // 状態変更リスナーの登録
    addListener(callback) {
        this.listeners.push(callback);
    }
    
    // リスナーへの通知
    notifyListeners(oldState, newState) {
        this.listeners.forEach(callback => {
            try {
                callback(newState, oldState);
            } catch (error) {
                console.error('リスナーエラー:', error);
            }
        });
    }
    
    // ページの表示/非表示の処理
    setupVisibilityHandling() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.stopPolling();
            } else {
                this.startPolling();
                this.forceSync(); // フォアグラウンド復帰時に即座に同期
            }
        });
    }
    
    // ポーリング開始
    startPolling() {
        if (this.isPolling) return;
        
        this.isPolling = true;
        this.pollTimer = setInterval(() => {
            this.syncFromGitHub();
        }, this.config.pollInterval);
        
        // 初回同期
        this.syncFromGitHub();
    }
    
    // ポーリング停止
    stopPolling() {
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
        }
        this.isPolling = false;
    }
    
    // 強制同期
    forceSync() {
        this.syncFromGitHub();
    }
    
    // GitHub Pagesから状態を読み取り
    async syncFromGitHub() {
        try {
            const url = `${this.config.pagesUrl}/${this.config.filePath}?_t=${Date.now()}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            
            if (!response.ok) {
                if (response.status === 404) {
                    console.log('状態ファイルが見つかりません。初期化中...');
                    if (this.config.isAdmin && this.config.githubToken) {
                        await this.createInitialState();
                    }
                    return;
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const newState = await response.json();
            const oldState = { ...this.timerState };
            
            // バージョンチェック（競合検出）
            if (newState.version > this.timerState.version) {
                this.timerState = { ...newState };
                this.notifyListeners(oldState, this.timerState);
                console.log(`状態同期完了 (v${newState.version}):`, newState.action);
            }
            
            this.retryCount = 0; // 成功時はリトライカウントをリセット
            
        } catch (error) {
            console.error('GitHub同期エラー:', error);
            this.handleSyncError(error);
        }
    }
    
    // 同期エラーの処理
    handleSyncError(error) {
        this.retryCount++;
        
        if (this.retryCount < this.config.maxRetries) {
            console.log(`リトライ中... (${this.retryCount}/${this.config.maxRetries})`);
            setTimeout(() => {
                this.syncFromGitHub();
            }, 2000 * this.retryCount); // 指数バックオフ
        } else {
            console.error('最大リトライ回数に達しました。オフラインモードで継続...');
            this.retryCount = 0;
        }
    }
    
    // 初期状態ファイルの作成
    async createInitialState() {
        const initialState = {
            ...this.timerState,
            lastUpdate: Date.now(),
            action: 'initialize',
            actionBy: 'admin'
        };
        
        return await this.updateGitHubState(initialState, '初期状態の作成');
    }
    
    // GitHubへの状態更新（管理者のみ）
    async updateGitHubState(newState, commitMessage = 'タイマー状態更新') {
        if (!this.config.isAdmin || !this.config.githubToken) {
            throw new Error('管理者権限が必要です');
        }
        
        try {
            // 現在のファイル情報を取得
            const currentFileInfo = await this.getCurrentFileInfo();
            
            // 新しい状態を準備
            const stateToSave = {
                ...newState,
                lastUpdate: Date.now(),
                version: (this.timerState.version || 0) + 1
            };
            
            // GitHub APIでファイル更新
            const updateData = {
                message: `${commitMessage} (v${stateToSave.version})`,
                content: btoa(JSON.stringify(stateToSave, null, 2)),
                branch: 'main'
            };
            
            if (currentFileInfo.sha) {
                updateData.sha = currentFileInfo.sha;
            }
            
            const response = await fetch(
                `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.filePath}`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `token ${this.config.githubToken}`,
                        'Content-Type': 'application/json',
                        'User-Agent': 'SessionTimer-App'
                    },
                    body: JSON.stringify(updateData)
                }
            );
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`GitHub API Error: ${errorData.message}`);
            }
            
            const result = await response.json();
            this.lastKnownSha = result.content.sha;
            
            // ローカル状態も更新
            const oldState = { ...this.timerState };
            this.timerState = { ...stateToSave };
            this.notifyListeners(oldState, this.timerState);
            
            console.log(`GitHub状態更新完了 (v${stateToSave.version}):`, commitMessage);
            
            // GitHub Pagesの反映を待つため、少し待ってから同期
            setTimeout(() => {
                this.syncFromGitHub();
            }, 2000);
            
            return result;
            
        } catch (error) {
            console.error('GitHub更新エラー:', error);
            throw error;
        }
    }
    
    // 現在のファイル情報を取得
    async getCurrentFileInfo() {
        try {
            const response = await fetch(
                `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.filePath}`,
                {
                    headers: {
                        'Authorization': `token ${this.config.githubToken}`,
                        'User-Agent': 'SessionTimer-App'
                    }
                }
            );
            
            if (response.status === 404) {
                return { sha: null }; // ファイルが存在しない
            }
            
            if (!response.ok) {
                throw new Error(`GitHub API Error: ${response.status}`);
            }
            
            const data = await response.json();
            return { sha: data.sha };
            
        } catch (error) {
            console.error('ファイル情報取得エラー:', error);
            return { sha: null };
        }
    }
    
    // タイマー操作メソッド（管理者のみ）
    async startTimer(totalMinutes = null, sessionMinutes = null) {
        if (!this.config.isAdmin) {
            throw new Error('管理者権限が必要です');
        }
        
        const now = Date.now();
        const newState = {
            ...this.timerState,
            isRunning: true,
            isPaused: false,
            startTime: now,
            sessionStartTime: now,
            pausedAt: null,
            pausedElapsed: 0,
            sessionPausedElapsed: 0,
            action: 'start',
            actionBy: 'admin'
        };
        
        if (totalMinutes !== null) {
            newState.totalDuration = totalMinutes * 60 * 1000;
        }
        if (sessionMinutes !== null) {
            newState.sessionDuration = sessionMinutes * 60 * 1000;
        }
        
        return await this.updateGitHubState(newState, 'タイマー開始');
    }
    
    async pauseTimer() {
        if (!this.config.isAdmin) {
            throw new Error('管理者権限が必要です');
        }
        
        const now = Date.now();
        const newState = {
            ...this.timerState,
            isPaused: true,
            pausedAt: now,
            action: 'pause',
            actionBy: 'admin'
        };
        
        return await this.updateGitHubState(newState, 'タイマー一時停止');
    }
    
    async resumeTimer() {
        if (!this.config.isAdmin) {
            throw new Error('管理者権限が必要です');
        }
        
        const now = Date.now();
        const pauseDuration = now - this.timerState.pausedAt;
        
        const newState = {
            ...this.timerState,
            isPaused: false,
            pausedAt: null,
            pausedElapsed: this.timerState.pausedElapsed + pauseDuration,
            sessionPausedElapsed: this.timerState.sessionPausedElapsed + pauseDuration,
            action: 'resume',
            actionBy: 'admin'
        };
        
        return await this.updateGitHubState(newState, 'タイマー再開');
    }
    
    async resetTimer(totalMinutes = 120, sessionMinutes = 20) {
        if (!this.config.isAdmin) {
            throw new Error('管理者権限が必要です');
        }
        
        const newState = {
            ...this.timerState,
            isRunning: false,
            isPaused: false,
            startTime: null,
            sessionStartTime: null,
            pausedAt: null,
            pausedElapsed: 0,
            sessionPausedElapsed: 0,
            totalDuration: totalMinutes * 60 * 1000,
            sessionDuration: sessionMinutes * 60 * 1000,
            action: 'reset',
            actionBy: 'admin'
        };
        
        return await this.updateGitHubState(newState, 'タイマーリセット');
    }
    
    async nextSession() {
        if (!this.config.isAdmin) {
            throw new Error('管理者権限が必要です');
        }
        
        const now = Date.now();
        const newState = {
            ...this.timerState,
            sessionStartTime: now,
            sessionPausedElapsed: 0,
            action: 'nextSession',
            actionBy: 'admin'
        };
        
        return await this.updateGitHubState(newState, '次のセッション開始');
    }
    
    // 現在の状態計算
    getCurrentState() {
        const now = Date.now();
        const state = { ...this.timerState };
        
        if (state.isRunning && !state.isPaused && state.startTime) {
            const totalElapsed = (now - state.startTime) + state.pausedElapsed;
            const sessionElapsed = (now - (state.sessionStartTime || state.startTime)) + state.sessionPausedElapsed;
            
            state.remainingTotal = Math.max(0, state.totalDuration - totalElapsed);
            state.remainingSession = Math.max(0, state.sessionDuration - sessionElapsed);
        } else {
            state.remainingTotal = state.totalDuration;
            state.remainingSession = state.sessionDuration;
        }
        
        return state;
    }
    
    // 統計情報
    getStats() {
        return {
            version: this.timerState.version,
            lastUpdate: this.timerState.lastUpdate,
            lastAction: this.timerState.action,
            actionBy: this.timerState.actionBy,
            isPolling: this.isPolling,
            pollInterval: this.config.pollInterval,
            retryCount: this.retryCount,
            githubUrl: `${this.config.pagesUrl}/${this.config.filePath}`,
            apiCallsToday: 0 // GitHub Pagesは読み取り無制限
        };
    }
    
    // クリーンアップ
    destroy() {
        this.stopPolling();
        this.listeners = [];
    }
}

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GitHubSyncClient;
}