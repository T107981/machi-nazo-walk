import type { GameState } from './types';

// 進行状況を端末内（localStorage）に保存し、再読み込みしても続きから遊べるようにする
const KEY = 'machi-nazo:v1';

export function loadState(): GameState | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<GameState>;
    if (
      typeof parsed.storyId !== 'string' ||
      typeof parsed.stageIndex !== 'number' ||
      (parsed.mode !== 'geo' && parsed.mode !== 'demo')
    ) {
      return null;
    }
    return parsed as GameState;
  } catch {
    return null;
  }
}

export function saveState(state: GameState): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // 保存できなくても（プライベートモード等）ゲームは続けられる
  }
}

export function clearState(): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(KEY);
  } catch {
    // 何もしない
  }
}
