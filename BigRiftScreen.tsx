import { useState } from 'react';
import { track } from './analytics';

type Props = { onBack: () => void };

type Status = 'idle' | 'asking' | 'ok' | 'denied' | 'unsupported' | 'error';

/**
 * 大きなゆがみに挑む（第1話クリアで解放）
 * 地図の上の、決まった場所に行かないと挑めないモード。いまは位置情報の確認と、ボタンだけ。
 * 位置情報は、ボタンを押したときに1回だけ確認します。保存も、サーバーへの送信もしません。
 */
export function BigRiftScreen({ onBack }: Props) {
  const [status, setStatus] = useState<Status>('idle');

  function check() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus('unsupported');
      return;
    }
    setStatus('asking');
    track('bigrift_location_check');
    navigator.geolocation.getCurrentPosition(
      () => setStatus('ok'),
      (err) => setStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'error'),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  }

  return (
    <main className="screen bigrift">
      <header className="play-header">
        <button type="button" className="link" onClick={onBack}>← ホームへ</button>
      </header>
      <p className="eyebrow">GREAT RIFT</p>
      <h1 className="rules-title">大きなゆがみに挑む</h1>
      <p className="story">
        街のあちこちに、ふつうのゆがみとは桁ちがいの「大きなゆがみ」がある。そこへ行って、はじめて挑める。
      </p>

      <section className="card">
        <p className="label">位置情報</p>
        <p className="small">
          大きなゆがみは、決まった場所に行かないと挑めません。そのために、位置情報の確認ができるようにします。
        </p>
        <ul className="notes small">
          <li>ボタンを押したときだけ、現在地を1回確認します。</li>
          <li>位置情報は、保存も、サーバーへの送信もしません。</li>
          <li>歩きながらスマホを見ないでください。立ち止まって、安全な場所で操作してください。</li>
        </ul>
        <button type="button" className="btn secondary" onClick={check} disabled={status === 'asking'}>
          {status === 'asking' ? '確認しています…' : '位置情報を確認する'}
        </button>
        {status === 'ok' && <p className="feedback ok" role="status">現在地を確認できました。（記録はしていません）</p>}
        {status === 'denied' && (
          <p className="feedback wrong" role="status">
            位置情報が許可されていません。ブラウザやスマホの設定で、このサイトの位置情報を許可してください。
          </p>
        )}
        {status === 'unsupported' && <p className="feedback wrong" role="status">この端末では、位置情報が使えません。</p>}
        {status === 'error' && <p className="feedback wrong" role="status">現在地を取得できませんでした。電波の良い場所で、もう一度試してください。</p>}
      </section>

      <section className="card">
        <p className="label">挑戦できる、大きなゆがみ</p>
        <ul className="reco">
          <li>
            <span className="badge">COMING SOON</span>
            <span className="reco-title">？？？</span>
            <span className="muted small">場所は準備中です。</span>
          </li>
        </ul>
        <button type="button" className="btn primary" disabled>
          挑む（指定の場所に行くと解放）
        </button>
      </section>
    </main>
  );
}
