// public/index.html のJavaScript部分をこのスマート版に置き換え
// タイマーの状態に応じて同期頻度を自動調整

// グローバル変数
let timerState = {
    isRunning: false,
    isPaused: false,
    startTime: null,
    pausedDuration: 0,
    lastPauseTime: null,
    currentTime: 0
};

let syncInterval = null;
let displayInterval = null;
let countdownInterval = null;
let nextSyncTime = 10;
let lastKnownState = 'stopped'; // 状態変化を検知用

// 設定
const API_BASE_URL = window.location.origin;
const DISPLAY_UPDATE_INTERVAL = 100; // 表示更新は100ms（ローカル処理なのでOK）

// 動的な同期間隔
const SYNC_INTERVALS = {
    RUNNING: 5000,   // 実行中: 5秒ごと
    PAUSED: 10000,   // 一時停止中: 10秒ごと
    STOPPED: 30000   // 停止中: 30秒ごと（ほぼ変化しないため）
};

// DOM要素
const timerDisplay = document.getElementById('timerDisplay');
const connectionStatus = document.getElementById('connectionStatus');
const timerStateDisplay = document.getElementById('timerState');
const nextSyncDisplay = document.getElementById('nextSync');

// タイマー表示の更新（ローカル計算）
function updateDisplay() {
    if (timerState.isRunning && !timerState.isPaused) {
        const now = Date.now();
        const elapsed = now - timerState.startTime - timerState.pausedDuration;
        timerState.currentTime = elapsed;
    } else if (timerState.isPaused) {
        const elapsed = timerState.lastPauseTime - timerState.startTime - timerState.pausedDuration;
        timerState.currentTime = elapsed;
    }

    const totalSeconds = Math.floor(timerState.currentTime / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    timerDisplay.textContent = 
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// 同期間隔を動的に調整
function adjustSyncInterval() {
    let currentState;
    let interval;

    if (timerState.isRunning && !timerState.isPaused) {
        currentState = 'running';
        interval = SYNC_INTERVALS.RUNNING;
    } else if (timerState.isPaused) {
        currentState = 'paused';
        interval = SYNC_INTERVALS.PAUSED;
    } else {
        currentState = 'stopped';
        interval = SYNC_INTERVALS.STOPPED;
    }

    // 状態が変わった場合のみ間隔を調整
    if (currentState !== lastKnownState) {
        console.log(`同期間隔を変更: ${currentState} - ${interval/1000}秒ごと`);
        lastKnownState = currentState;
        
        // 既存の同期をクリア
        if (syncInterval) {
            clearInterval(syncInterval);
        }
        
        // 新しい間隔で同期を開始
        syncInterval = setInterval(syncWithServer, interval);
        
        // カウントダウンをリセット
        nextSyncTime = Math.floor(interval / 1000);
    }
}

// サーバーとの同期
async function syncWithServer() {
    try {
        const response = await fetch('/api/timer', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        
        // 前の状態を保存
        const wasRunning = timerState.isRunning;
        const wasPaused = timerState.isPaused;
        
        // サーバーの状態でローカル状態を更新
        timerState.isRunning = data.isRunning;
        timerState.isPaused = data.isPaused;
        timerState.startTime = data.startTime;
        timerState.pausedDuration = data.pausedDuration || 0;
        timerState.lastPauseTime = data.lastPauseTime;

        // 状態が変わった場合、同期間隔を調整
        if (wasRunning !== timerState.isRunning || wasPaused !== timerState.isPaused) {
            adjustSyncInterval();
        }

        // 接続状態の更新
        connectionStatus.textContent = '接続済み';
        connectionStatus.className = 'status connected';

        // タイマー状態の表示更新
        if (timerState.isRunning && !timerState.isPaused) {
            timerStateDisplay.textContent = '実行中（5秒ごと同期）';
            timerStateDisplay.className = 'timer-state pulse';
        } else if (timerState.isPaused) {
            timerStateDisplay.textContent = '一時停止中（10秒ごと同期）';
            timerStateDisplay.className = 'timer-state';
        } else {
            timerStateDisplay.textContent = '停止中（30秒ごと同期）';
            timerStateDisplay.className = 'timer-state';
        }

        // 表示を更新
        updateDisplay();
        
        // カウントダウンをリセット（現在の間隔に基づく）
        let currentInterval = SYNC_INTERVALS.STOPPED;
        if (timerState.isRunning && !timerState.isPaused) {
            currentInterval = SYNC_INTERVALS.RUNNING;
        } else if (timerState.isPaused) {
            currentInterval = SYNC_INTERVALS.PAUSED;
        }
        nextSyncTime = Math.floor(currentInterval / 1000);
        
    } catch (error) {
        console.error('同期エラー:', error);
        connectionStatus.textContent = '接続エラー';
        connectionStatus.className = 'status disconnected';
    }
}

// カウントダウンの更新
function updateCountdown() {
    nextSyncTime = Math.max(0, nextSyncTime - 1);
    nextSyncDisplay.textContent = nextSyncTime;
    
    // 0になったらリセット（現在の間隔に基づく）
    if (nextSyncTime === 0) {
        let currentInterval = SYNC_INTERVALS.STOPPED;
        if (timerState.isRunning && !timerState.isPaused) {
            currentInterval = SYNC_INTERVALS.RUNNING;
        } else if (timerState.isPaused) {
            currentInterval = SYNC_INTERVALS.PAUSED;
        }
        nextSyncTime = Math.floor(currentInterval / 1000);
    }
}

// 初期化
function initialize() {
    // 初回同期
    syncWithServer();

    // 初期状態に基づいて同期間隔を設定
    adjustSyncInterval();

    // 表示の定期更新（ローカル処理）
    displayInterval = setInterval(updateDisplay, DISPLAY_UPDATE_INTERVAL);

    // カウントダウンの更新
    countdownInterval = setInterval(updateCountdown, 1000);
}

// ページ表示/非表示の処理
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // ページが非表示になったら更新を停止
        clearInterval(displayInterval);
        clearInterval(syncInterval);
    } else {
        // ページが表示されたら即座に同期して更新を再開
        syncWithServer();
        adjustSyncInterval();
        displayInterval = setInterval(updateDisplay, DISPLAY_UPDATE_INTERVAL);
    }
});

// 初期化実行
initialize();