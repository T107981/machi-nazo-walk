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
      parsed.mode !== 'anywhere'
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

// コードネーム（名前）は、この端末の中だけに保存する。サーバーや計測には送らない
const NAME_KEY = 'machi-nazo:name';
export const DEFAULT_NAME = 'ナナシ';
export const NAME_MAX = 8;

export function cleanName(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim().slice(0, NAME_MAX);
}

export function loadName(): string | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const v = localStorage.getItem(NAME_KEY);
    const name = v ? cleanName(v) : '';
    return name === '' ? null : name;
  } catch {
    return null;
  }
}

export function saveName(name: string): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(NAME_KEY, cleanName(name));
  } catch {
    // 保存できなくても続けられる
  }
}
