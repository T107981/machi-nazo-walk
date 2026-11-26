import { useCallback, useEffect, useRef, useState } from 'react';

// 会話画面で使う「ARのオンオフ」。カメラ映像を背景にして、立ち絵を置いたように見せる疑似AR。
// 映像は画面に表示するだけで、保存も送信もしません。

const PREF_KEY = 'machi-nazo:ar-pref';
const OK_KEY = 'machi-nazo:ar-ok';
const FOV_DEG = 60;

export function arPreferred(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(PREF_KEY) === '1';
  } catch {
    return false;
  }
}
export function arConfirmed(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(OK_KEY) === '1';
  } catch {
    return false;
  }
}
export function rememberArConfirmed(): void {
  try {
    localStorage.setItem(OK_KEY, '1');
  } catch {
    // 何もしない
  }
}
function setPref(on: boolean) {
  try {
    if (on) localStorage.setItem(PREF_KEY, '1');
    else localStorage.removeItem(PREF_KEY);
  } catch {
    // 何もしない
  }
}

function angleDiff(a: number, b: number): number {
  let d = a - b;
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  return d;
}

export type ArState = {
  on: boolean;
  error: string;
  videoRef: React.RefObject<HTMLVideoElement>;
  /** スマホの向きの変化によるずれ（px）。立ち絵を「その場に置いたように」見せるために使う */
  offset: { x: number; y: number };
  start: () => Promise<void>;
  stop: () => void;
};

export function useCameraBg(): ArState {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const base = useRef<{ a: number; b: number } | null>(null);
  const [on, setOn] = useState(false);
  const [error, setError] = useState('');
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    base.current = null;
    setOffset({ x: 0, y: 0 });
    setOn(false);
    setPref(false);
  }, []);

  const start = useCallback(async () => {
    setError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('この端末では、カメラが使えません。');
      return;
    }
    try {
      const DOE = (typeof DeviceOrientationEvent !== 'undefined' ? DeviceOrientationEvent : null) as unknown as {
        requestPermission?: () => Promise<string>;
      } | null;
      if (DOE && typeof DOE.requestPermission === 'function') {
        try {
          await DOE.requestPermission();
        } catch {
          // センサーなしでも、カメラだけで続ける
        }
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      setOn(true);
      setPref(true);
    } catch {
      setError('カメラを使えませんでした。ブラウザやスマホの設定で、このサイトのカメラを許可してください。');
      setPref(false);
    }
  }, []);

  // 映像を video 要素へ
  useEffect(() => {
    if (!on) return;
    const v = videoRef.current;
    if (v && streamRef.current) {
      v.srcObject = streamRef.current;
      void v.play().catch(() => undefined);
    }
  }, [on]);

  // 向きの変化 → ずれ
  useEffect(() => {
    if (!on) return;
    function onOrient(e: DeviceOrientationEvent) {
      if (e.alpha == null || e.beta == null) return;
      if (!base.current) base.current = { a: e.alpha, b: e.beta };
      const ppd = window.innerWidth / FOV_DEG;
      const clamp = (v: number, m: number) => Math.max(-m, Math.min(m, v));
      setOffset({
        x: clamp(angleDiff(e.alpha, base.current.a) * ppd, window.innerWidth * 0.9),
        y: clamp((e.beta - base.current.b) * ppd, window.innerHeight * 0.9),
      });
    }
    window.addEventListener('deviceorientation', onOrient);
    return () => window.removeEventListener('deviceorientation', onOrient);
  }, [on]);

  // 画面を離れたら、カメラを止める（設定は残す）
  useEffect(
    () => () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    },
    [],
  );

  return { on, error, videoRef, offset, start, stop };
}
