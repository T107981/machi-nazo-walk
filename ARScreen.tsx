import { useEffect, useRef, useState } from 'react';
import ryuka from './ryuka.webp';
import { track } from './analytics';

type Props = { dev: boolean; onBack: () => void };

type Cam = 'idle' | 'starting' | 'on' | 'denied' | 'unsupported';

const LINES = [
  'おっ、ちゃんと見えてるな！',
  'ここに、重なってるんだぜ。カサナリアは。',
  'オレは、ずっとここにいるぞ。',
  'ゆがみを見つけたら、教えてくれ！',
  '今日の「あとで」は、もう片づけたか？',
];

/** 画面の幅あたり、何度ぶんの向きの変化を、画面いっぱいに動かすか */
const FOV_DEG = 60;

function angleDiff(a: number, b: number): number {
  let d = a - b;
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  return d;
}

/**
 * リュカにARで会う（カメラ映像の上に、リュカを「その場に置いたように」見せる）。
 * 本物のAR（床の認識）ではなく、スマホの向きの変化に合わせて、リュカの位置をずらす疑似AR。
 *  ・画面をタップすると、その場所にリュカを置く
 *  ・スマホを左右・上下に向けると、リュカは置いた場所に残って見える
 * カメラ映像は、この画面の中で表示するだけで、保存も送信もしません。
 */
export function ARScreen({ dev, onBack }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cam, setCam] = useState<Cam>('idle');
  const [pos, setPos] = useState({ x: 0.5, y: 0.62 }); // 置いた位置（画面の割合）
  const [offset, setOffset] = useState({ x: 0, y: 0 }); // 向きの変化によるずれ（px）
  const [line, setLine] = useState<number | null>(null);
  const [sensor, setSensor] = useState<'unknown' | 'on' | 'off'>('unknown');
  const [flip, setFlip] = useState({ x: false, y: false });
  const base = useRef<{ a: number; b: number } | null>(null);
  const flipRef = useRef(flip);
  flipRef.current = flip;

  function stop() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }
  useEffect(() => stop, []);

  // スマホの向きの変化を、リュカのずれに変える
  useEffect(() => {
    if (cam !== 'on') return;
    function onOrient(e: DeviceOrientationEvent) {
      if (e.alpha == null || e.beta == null) return;
      setSensor('on');
      if (!base.current) base.current = { a: e.alpha, b: e.beta };
      const ppd = window.innerWidth / FOV_DEG;
      const dYaw = angleDiff(e.alpha, base.current.a);
      const dPitch = e.beta - base.current.b;
      const f = flipRef.current;
      const clamp = (v: number, m: number) => Math.max(-m, Math.min(m, v));
      setOffset({
        x: clamp((f.x ? -1 : 1) * dYaw * ppd, window.innerWidth * 0.9),
        y: clamp((f.y ? -1 : 1) * dPitch * ppd, window.innerHeight * 0.9),
      });
    }
    window.addEventListener('deviceorientation', onOrient);
    return () => window.removeEventListener('deviceorientation', onOrient);
  }, [cam]);

  async function start() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCam('unsupported');
      return;
    }
    setCam('starting');
    try {
      // iPhone では、向きのセンサーの許可が別に必要
      const DOE = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
      if (typeof DOE?.requestPermission === 'function') {
        try {
          const r = await DOE.requestPermission();
          if (r !== 'granted') setSensor('off');
        } catch {
          setSensor('off');
        }
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      setCam('on');
      track('ar_start');
      // video 要素は、cam が 'on' になってから描画されるので、次の描画後に流し込む
      requestAnimationFrame(() => {
        const v = videoRef.current;
        if (v) {
          v.srcObject = stream;
          void v.play().catch(() => undefined);
        }
      });
    } catch {
      setCam('denied');
    }
  }

  function place(e: React.MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    setPos({ x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height });
    base.current = null; // 置いた時点の向きを、あたらしい基準にする
    setOffset({ x: 0, y: 0 });
  }

  if (cam !== 'on') {
    return (
      <main className="screen ar-intro">
        <header className="play-header">
          <button type="button" className="link" onClick={onBack}>← ホームへ</button>
        </header>
        <p className="eyebrow">AR</p>
        <h1 className="rules-title">リュカにARで会う</h1>
        <p className="story">カメラ越しの景色に、リュカが現れる。画面をタップすると、その場所に置けるよ。</p>
        <section className="card caution">
          <h2>使う前に</h2>
          <ul className="notes">
            <li>カメラとスマホの向きのセンサーを使います。映像は、画面に表示するだけで、保存も送信もしません。</li>
            <li>歩きながら使わないでください。立ち止まって、周りに気をつけて使ってください。</li>
            <li>人にカメラを向けたり、他人を映したりしないでください。</li>
          </ul>
        </section>
        {cam === 'denied' && (
          <p className="feedback wrong" role="status">
            カメラを使えませんでした。ブラウザやスマホの設定で、このサイトのカメラを許可してください。
          </p>
        )}
        {cam === 'unsupported' && <p className="feedback wrong" role="status">この端末では、カメラが使えません。</p>}
        <div className="actions">
          <button type="button" className="btn primary" onClick={start} disabled={cam === 'starting'}>
            {cam === 'starting' ? '起動しています…' : 'カメラを起動する'}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="ar" onClick={place} aria-label="AR表示。タップでリュカを置く">
      <video ref={videoRef} className="ar-video" playsInline muted autoPlay />
      <div
        className="ar-ryuka"
        style={{
          left: `${pos.x * 100}%`,
          top: `${pos.y * 100}%`,
          transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
        }}
      >
        <button
          type="button"
          className="ar-ryuka-btn"
          onClick={(e) => {
            e.stopPropagation();
            setLine((n) => (n === null ? 0 : (n + 1) % LINES.length));
          }}
          aria-label="リュカに話しかける"
        >
          <img src={ryuka} alt="リュカ" />
        </button>
      </div>
      {line !== null && (
        <p
          className="ar-bubble"
          style={{
            left: `${pos.x * 100}%`,
            top: `calc(${pos.y * 100}% - 17vh)`,
            transform: `translate(calc(-50% + ${offset.x}px), ${offset.y}px)`,
          }}
        >
          {LINES[line]}
        </p>
      )}

      <div className="ar-top">
        <button type="button" className="dlg-btn" onClick={(e) => { e.stopPropagation(); stop(); setCam('idle'); }}>
          とじる
        </button>
      </div>
      <p className="ar-hint">
        {sensor === 'off' ? '向きのセンサーが許可されていないため、リュカは画面に固定されます。' : '画面をタップすると、その場所にリュカを置けます。'}
      </p>
      {dev && (
        <div className="ar-dev">
          <button type="button" className="dlg-btn" onClick={(e) => { e.stopPropagation(); setFlip((f) => ({ ...f, x: !f.x })); }}>
            左右 {flip.x ? '逆' : '正'}
          </button>
          <button type="button" className="dlg-btn" onClick={(e) => { e.stopPropagation(); setFlip((f) => ({ ...f, y: !f.y })); }}>
            上下 {flip.y ? '逆' : '正'}
          </button>
          <span className="dlg-btn">センサー:{sensor}</span>
        </div>
      )}
    </main>
  );
}
