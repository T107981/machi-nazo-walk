import { useMemo } from 'react';

/**
 * 夕暮れの街の一枚絵（コードで描いたSVG）。
 * 本物のイラストに差し替えるときは、画像ファイルを用意して
 * <img src=...> に置き換えるだけで使えます（このコンポーネントの中身だけ変更）。
 */

// 同じ見た目になるよう、乱数は固定の種から作る
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

type Building = { x: number; w: number; h: number; layer: 0 | 1 | 2 };

export function Skyline({ rift = true }: { rift?: boolean }) {
  const { buildings, windows } = useMemo(() => {
    const rnd = seeded(20261122);
    const list: Building[] = [];
    const layers: Array<{ layer: 0 | 1 | 2; min: number; max: number; wMin: number; wMax: number }> = [
      { layer: 0, min: 60, max: 120, wMin: 26, wMax: 46 },
      { layer: 1, min: 90, max: 170, wMin: 24, wMax: 42 },
      { layer: 2, min: 70, max: 150, wMin: 30, wMax: 54 },
    ];
    for (const l of layers) {
      let x = -10 + rnd() * 20;
      while (x < 410) {
        const w = l.wMin + rnd() * (l.wMax - l.wMin);
        const h = l.min + rnd() * (l.max - l.min);
        list.push({ x, w, h, layer: l.layer });
        x += w + rnd() * 6;
      }
    }
    const wins: Array<{ x: number; y: number; c: 'a' | 'c' }> = [];
    for (const b of list) {
      if (b.layer === 0) continue;
      const cols = Math.floor(b.w / 8);
      const rows = Math.floor(b.h / 10);
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          if (rnd() < (b.layer === 2 ? 0.28 : 0.14)) {
            wins.push({
              x: b.x + 4 + i * 8,
              y: 220 - b.h + 6 + j * 10,
              c: rnd() < 0.8 ? 'a' : 'c',
            });
          }
        }
      }
    }
    return { buildings: list, windows: wins };
  }, []);

  return (
    <svg className="skyline" viewBox="0 0 400 220" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0d0f2b" />
          <stop offset="0.45" stopColor="#2b1f5c" />
          <stop offset="0.8" stopColor="#8a3d7a" />
          <stop offset="1" stopColor="#ff8a4c" />
        </linearGradient>
        <radialGradient id="glow" cx="0.5" cy="1" r="0.7">
          <stop offset="0" stopColor="#ffd08a" stopOpacity="0.85" />
          <stop offset="1" stopColor="#ffd08a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.6" stopColor="#0f1226" stopOpacity="0" />
          <stop offset="1" stopColor="#0f1226" stopOpacity="1" />
        </linearGradient>
      </defs>

      <rect width="400" height="220" fill="url(#sky)" />
      <ellipse cx="270" cy="220" rx="190" ry="120" fill="url(#glow)" />

      {/* 夕空の細い雲 */}
      <g stroke="#ffb27a" strokeOpacity="0.35" strokeWidth="1.2" strokeLinecap="round">
        <line x1="30" y1="70" x2="140" y2="64" />
        <line x1="70" y1="82" x2="170" y2="78" />
        <line x1="230" y1="52" x2="350" y2="46" />
        <line x1="280" y1="64" x2="380" y2="60" />
      </g>

      {/* 遠景 → 中景 → 近景 */}
      {buildings
        .filter((b) => b.layer === 0)
        .map((b, i) => (
          <rect key={`a${i}`} x={b.x} y={220 - b.h} width={b.w} height={b.h} fill="#4a2a6a" opacity="0.7" />
        ))}
      {buildings
        .filter((b) => b.layer === 1)
        .map((b, i) => (
          <rect key={`b${i}`} x={b.x} y={220 - b.h} width={b.w} height={b.h} fill="#2a1b52" />
        ))}
      {buildings
        .filter((b) => b.layer === 2)
        .map((b, i) => (
          <g key={`c${i}`}>
            <rect x={b.x} y={220 - b.h} width={b.w} height={b.h} fill="#150f33" />
            <line
              x1={b.x + b.w}
              y1={220 - b.h}
              x2={b.x + b.w}
              y2="220"
              stroke="#ff9a62"
              strokeOpacity="0.35"
              strokeWidth="1"
            />
          </g>
        ))}

      {/* 窓あかり */}
      {windows.map((w, i) => (
        <rect key={i} x={w.x} y={w.y} width="3" height="4" fill={w.c === 'a' ? '#ffcf7a' : '#7fe8ff'} opacity="0.85" />
      ))}

      {/* 歪：景色が横にずれて見える帯 */}
      {rift && (
        <g>
          <rect x="150" y="96" width="70" height="3" fill="#7fe8ff" opacity="0.55" />
          <rect x="162" y="104" width="64" height="2" fill="#ff7ad0" opacity="0.5" />
          <rect x="140" y="112" width="58" height="4" fill="#7fe8ff" opacity="0.35" />
          <rect x="168" y="122" width="52" height="2" fill="#ffffff" opacity="0.4" />
          <rect x="146" y="132" width="72" height="3" fill="#ff7ad0" opacity="0.35" />
        </g>
      )}

      {/* 観測端末（レンズ）をイメージした二重の輪 */}
      <g fill="none" stroke="#7fe8ff" strokeOpacity="0.7">
        <circle cx="344" cy="92" r="20" strokeWidth="1.2" />
        <circle cx="344" cy="92" r="13" strokeWidth="0.8" strokeDasharray="3 4" />
        <line x1="344" y1="64" x2="344" y2="70" strokeWidth="1.2" />
        <line x1="344" y1="114" x2="344" y2="120" strokeWidth="1.2" />
      </g>

      <rect width="400" height="220" fill="url(#fade)" />
    </svg>
  );
}
