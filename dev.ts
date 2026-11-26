// 開発モード：URLの末尾に「?dev=1」を付けて開くと、この端末で有効になる（「?dev=0」で解除）。
// 1日1回の制限をなくしたり、第1話をクリア済みにしたりして、あとの機能を試せる。

const KEY = 'machi-nazo:dev';

export function isDev(): boolean {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return false;
    const q = new URLSearchParams(window.location.search).get('dev');
    if (q === '1') localStorage.setItem(KEY, '1');
    else if (q === '0') localStorage.removeItem(KEY);
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

/** 開発用：この端末に保存された、ゲームのデータをすべて消す */
export function wipeAll(): void {
  try {
    if (typeof localStorage === 'undefined') return;
    Object.keys(localStorage)
      .filter((k) => k.startsWith('machi-nazo:') && k !== KEY)
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    // 何もしない
  }
}
