// 「協力ゲージ」：仲間に協力を求めるときに使う。時間がたつと回復する（端末の中だけで管理）

const KEY = 'machi-nazo:energy:v1';
export const ENERGY_MAX = 3;
/** 1つ回復するまでの時間（ミリ秒）。MVPでは仮の値 */
export const REGEN_MS = 3 * 3600 * 1000;

type Saved = { value: number; at: number };

function read(): Saved {
  const fresh: Saved = { value: ENERGY_MAX, at: Date.now() };
  try {
    if (typeof localStorage === 'undefined') return fresh;
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh;
    const p = JSON.parse(raw) as Partial<Saved>;
    if (typeof p.value !== 'number' || typeof p.at !== 'number') return fresh;
    return { value: Math.min(ENERGY_MAX, Math.max(0, Math.floor(p.value))), at: p.at };
  } catch {
    return fresh;
  }
}

function write(s: Saved): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // 保存できなくても続けられる
  }
}

/** 時間がたった分を回復させた、いまの値 */
export function currentEnergy(now: number = Date.now()): number {
  const s = read();
  if (s.value >= ENERGY_MAX) return ENERGY_MAX;
  const gained = Math.floor(Math.max(0, now - s.at) / REGEN_MS);
  return Math.min(ENERGY_MAX, s.value + gained);
}

/** 1つ使う。足りなければ false */
export function spendEnergy(now: number = Date.now()): boolean {
  const s = read();
  const gained = s.value >= ENERGY_MAX ? 0 : Math.floor(Math.max(0, now - s.at) / REGEN_MS);
  const value = Math.min(ENERGY_MAX, s.value + gained);
  if (value <= 0) return false;
  // 満タンから減らすときは、いまを回復の起点にする。そうでなければ起点を進める
  const at = s.value >= ENERGY_MAX ? now : s.at + gained * REGEN_MS;
  write({ value: value - 1, at });
  return true;
}
