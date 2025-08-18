// api/timer.js - ファイル永続化版（ローカル開発用）
import fs from 'fs';
import path from 'path';

// 状態ファイルのパス（プロジェクトルートに保存）
const STATE_FILE = path.join(process.cwd(), 'timer-state.json');

// デフォルトのタイマー状態
const defaultState = {
  totalDuration: 7200000,    // 2時間
  sessionDuration: 1200000,   // 20分
  startedAt: null,
  pausedAt: null,
  totalElapsed: 0,
  sessionElapsed: 0,
  isRunning: false,
  lastModified: null,
  version: 1
};

// 状態を読み込む
function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const data = fs.readFileSync(STATE_FILE, 'utf8');
      const state = JSON.parse(data);
      console.log('[LOAD] State loaded from file');
      return state;
    }
  } catch (error) {
    console.error('[LOAD] Error loading state:', error);
  }
  console.log('[LOAD] Using default state');
  return { ...defaultState };
}

// 状態を保存
function saveState(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    console.log('[SAVE] State saved to file');
  } catch (error) {
    console.error('[SAVE] Error saving state:', error);
  }
}

export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const now = Date.now();
  
  // 状態を読み込む（毎回ファイルから）
  let timerState = loadState();

  // GET: タイマー状態を取得
  if (req.method === 'GET') {
    // 現在の経過時間を計算
    let currentTotalElapsed = timerState.totalElapsed;
    let currentSessionElapsed = timerState.sessionElapsed;
    
    if (timerState.isRunning && timerState.startedAt) {
      const runningTime = now - timerState.startedAt;
      currentTotalElapsed += runningTime;
      currentSessionElapsed += runningTime;
    }
    
    const remainingTotal = Math.max(0, timerState.totalDuration - currentTotalElapsed);
    const remainingSession = Math.max(0, timerState.sessionDuration - currentSessionElapsed);
    
    const response = {
      totalDuration: timerState.totalDuration,
      sessionDuration: timerState.sessionDuration,
      isRunning: timerState.isRunning,
      isPaused: !timerState.isRunning,
      startedAt: timerState.startedAt,
      pausedAt: timerState.pausedAt,
      totalElapsed: timerState.totalElapsed,
      sessionElapsed: timerState.sessionElapsed,
      currentTotalElapsed,
      currentSessionElapsed,
      remainingTotal,
      remainingSession,
      serverTime: now,
      currentTime: now,
      lastModified: timerState.lastModified,
      version: timerState.version
    };

    console.log(`[GET] Running: ${timerState.isRunning}, Remaining: ${Math.floor(remainingTotal/1000)}s / ${Math.floor(remainingSession/1000)}s`);
    return res.status(200).json(response);
  }

  // POST: タイマー操作
  if (req.method === 'POST') {
    let body = req.body;
    
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (error) {
        return res.status(400).json({ error: 'Invalid JSON' });
      }
    }

    const { action, totalMinutes, sessionMinutes } = body || {};

    if (!action) {
      return res.status(400).json({ error: 'Action is required' });
    }

    console.log(`[POST] Action: ${action}`);
    let message = '';

    switch (action) {
      case 'start':
        if (!timerState.isRunning) {
          if (timerState.totalElapsed === 0 && timerState.sessionElapsed === 0) {
            // 新規スタート
            console.log('[START] New timer');
            timerState.startedAt = now;
            timerState.pausedAt = null;
            timerState.totalElapsed = 0;
            timerState.sessionElapsed = 0;
          } else {
            // 再開
            console.log(`[START] Resume - Total: ${timerState.totalElapsed}ms, Session: ${timerState.sessionElapsed}ms`);
            timerState.startedAt = now;
            timerState.pausedAt = null;
          }
          
          timerState.isRunning = true;
          message = 'Timer started';
        } else {
          message = 'Timer is already running';
        }
        break;

      case 'pause':
        if (timerState.isRunning && timerState.startedAt) {
          const runningTime = now - timerState.startedAt;
          timerState.totalElapsed += runningTime;
          timerState.sessionElapsed += runningTime;
          
          console.log(`[PAUSE] Running time: ${runningTime}ms, Total: ${timerState.totalElapsed}ms`);
          
          timerState.isRunning = false;
          timerState.pausedAt = now;
          timerState.startedAt = null;
          message = 'Timer paused';
        } else {
          message = 'Timer is not running';
        }
        break;

      case 'reset':
        console.log('[RESET] Timer reset');
        timerState = {
          totalDuration: (totalMinutes || 120) * 60 * 1000,
          sessionDuration: (sessionMinutes || 20) * 60 * 1000,
          startedAt: null,
          pausedAt: null,
          totalElapsed: 0,
          sessionElapsed: 0,
          isRunning: false,
          lastModified: now,
          version: 1
        };
        message = 'Timer reset';
        break;

      case 'nextSession':
        console.log('[NEXT] Next session');
        if (timerState.isRunning && timerState.startedAt) {
          const runningTime = now - timerState.startedAt;
          timerState.totalElapsed += runningTime;
          timerState.sessionElapsed = 0;
          timerState.startedAt = now;
        } else {
          timerState.sessionElapsed = 0;
        }
        message = 'Session reset';
        break;

      case 'setTime':
        if (totalMinutes) {
          timerState.totalDuration = totalMinutes * 60 * 1000;
        }
        if (sessionMinutes) {
          timerState.sessionDuration = sessionMinutes * 60 * 1000;
        }
        message = 'Time settings updated';
        break;

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }

    timerState.lastModified = now;
    
    // 状態を保存
    saveState(timerState);

    // 現在の状態を計算
    let currentTotalElapsed = timerState.totalElapsed;
    let currentSessionElapsed = timerState.sessionElapsed;
    
    if (timerState.isRunning && timerState.startedAt) {
      const runningTime = now - timerState.startedAt;
      currentTotalElapsed += runningTime;
      currentSessionElapsed += runningTime;
    }

    const response = {
      success: true,
      message,
      action,
      state: {
        totalDuration: timerState.totalDuration,
        sessionDuration: timerState.sessionDuration,
        isRunning: timerState.isRunning,
        isPaused: !timerState.isRunning,
        startedAt: timerState.startedAt,
        pausedAt: timerState.pausedAt,
        totalElapsed: timerState.totalElapsed,
        sessionElapsed: timerState.sessionElapsed,
        currentTotalElapsed,
        currentSessionElapsed,
        remainingTotal: Math.max(0, timerState.totalDuration - currentTotalElapsed),
        remainingSession: Math.max(0, timerState.sessionDuration - currentSessionElapsed),
        serverTime: now,
        currentTime: now,
        lastModified: timerState.lastModified
      }
    };

    console.log(`[POST] ${message} - Running: ${timerState.isRunning}`);
    return res.status(200).json(response);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}