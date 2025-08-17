const express = require('express');
const path = require('path');

const app = express();

// JSON body parser
app.use(express.json());

// 静的ファイルの配信
app.use(express.static(path.join(__dirname, 'public')));

// HTMLファイルの明示的なルーティング
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// タイマーの状態管理（メモリ内）
let timerState = {
  totalTime: 7200,     // 02:00:00 in seconds
  sessionTime: 1200,   // 20:00 in seconds
  isPaused: true,      // 初期状態は停止
  lastUpdate: Date.now() // 最後の更新時刻
};

// タイマーのインターバル
let timerInterval = null;

// 時間をフォーマットする関数
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}

// タイマーを更新する関数
function updateTimer() {
  if (!timerState.isPaused) {
    const now = Date.now();
    const elapsed = Math.floor((now - timerState.lastUpdate) / 1000);
    
    if (elapsed >= 1) {
      // 全体タイマーを減算
      if (timerState.totalTime > 0) {
        timerState.totalTime = Math.max(0, timerState.totalTime - elapsed);
      }
      
      // セッションタイマーを減算
      if (timerState.sessionTime > 0) {
        timerState.sessionTime = Math.max(0, timerState.sessionTime - elapsed);
      }
      
      timerState.lastUpdate = now;
    }
  }
}

// 定期的にタイマーを更新
function startTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  timerInterval = setInterval(updateTimer, 1000);
}

// タイマー状態を取得するAPI
app.get('/api/timer', (req, res) => {
  updateTimer(); // 最新状態に更新
  
  res.json({
    totalTime: timerState.totalTime,
    sessionTime: timerState.sessionTime,
    isPaused: timerState.isPaused,
    totalTimeFormatted: formatTime(timerState.totalTime),
    sessionTimeFormatted: formatTime(timerState.sessionTime),
    timestamp: Date.now()
  });
});

// タイマー開始API
app.post('/api/timer/start', (req, res) => {
  console.log('タイマー開始');
  timerState.isPaused = false;
  timerState.lastUpdate = Date.now();
  
  res.json({
    success: true,
    message: 'タイマーを開始しました',
    state: {
      totalTime: timerState.totalTime,
      sessionTime: timerState.sessionTime,
      isPaused: timerState.isPaused,
      totalTimeFormatted: formatTime(timerState.totalTime),
      sessionTimeFormatted: formatTime(timerState.sessionTime)
    }
  });
});

// タイマー一時停止API
app.post('/api/timer/pause', (req, res) => {
  console.log('タイマー一時停止');
  updateTimer(); // 一時停止前に最新状態に更新
  timerState.isPaused = true;
  
  res.json({
    success: true,
    message: 'タイマーを一時停止しました',
    state: {
      totalTime: timerState.totalTime,
      sessionTime: timerState.sessionTime,
      isPaused: timerState.isPaused,
      totalTimeFormatted: formatTime(timerState.totalTime),
      sessionTimeFormatted: formatTime(timerState.sessionTime)
    }
  });
});

// タイマーリセットAPI
app.post('/api/timer/reset', (req, res) => {
  console.log('タイマーリセット');
  timerState.totalTime = 7200;    // 02:00:00
  timerState.sessionTime = 1200;  // 20:00
  timerState.isPaused = true;
  timerState.lastUpdate = Date.now();
  
  res.json({
    success: true,
    message: 'タイマーをリセットしました',
    state: {
      totalTime: timerState.totalTime,
      sessionTime: timerState.sessionTime,
      isPaused: timerState.isPaused,
      totalTimeFormatted: formatTime(timerState.totalTime),
      sessionTimeFormatted: formatTime(timerState.sessionTime)
    }
  });
});

// 次のセッションAPI
app.post('/api/timer/next', (req, res) => {
  console.log('次のセッション');
  timerState.sessionTime = 1200;  // 20:00にリセット
  timerState.lastUpdate = Date.now();
  
  res.json({
    success: true,
    message: '次のセッションに進みました',
    state: {
      totalTime: timerState.totalTime,
      sessionTime: timerState.sessionTime,
      isPaused: timerState.isPaused,
      totalTimeFormatted: formatTime(timerState.totalTime),
      sessionTimeFormatted: formatTime(timerState.sessionTime)
    }
  });
});

// タイマーを開始
startTimer();

// Vercel用のエクスポート
module.exports = app;