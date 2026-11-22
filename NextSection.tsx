import { useEffect, useState } from 'react';
import { track } from './analytics';

/** 次の通信が届くまでの時間（時間）。MVPでは仮の値 */
const WAIT_HOURS = 24;

type Props = {
  /** クリアした時刻（ISO文字列） */
  clearedAt: string | null;
  storyId: string;
};

function remainingMs(clearedAt: string | null): number {
  const base = clearedAt ? new Date(clearedAt).getTime() : Date.now();
  if (Number.isNaN(base)) return WAIT_HOURS * 3600_000;
  return Math.max(0, base + WAIT_HOURS * 3600_000 - Date.now());
}

function format(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const two = (n: number) => String(n).padStart(2, '0');
  return `${two(h)}:${two(m)}:${two(s)}`;
}

/**
 * クリア後の「次へ」のコーナー。
 * いまは「準備中（Coming Soon）」の表示と、需要を測るための仮ボタンだけ。
 * 実際の決済・ポイントの購入はまだ入っていません（お金は発生しません）。
 */
export function NextSection({ clearedAt, storyId }: Props) {
  const [left, setLeft] = useState(() => remainingMs(clearedAt));
  const [asked, setAsked] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setLeft(remainingMs(clearedAt)), 1000);
    return () => window.clearInterval(id);
  }, [clearedAt]);

  function handleSkipInterest() {
    setAsked(true);
    // 「早めたい人がどれだけいるか」を数えるためだけの記録（購入は発生しない）
    track('skip_interest', { story_id: storyId, remaining_min: Math.round(left / 60000) });
  }

  return (
    <>
      <section className="card next-comm" aria-label="次の通信">
        <p className="label">次の通信まで</p>
        <p className="countdown" role="timer">
          {left > 0 ? format(left) : '00:00:00'}
        </p>
        <p className="muted small">
          {left > 0
            ? '新しい通信が届くまで、しばらくお待ちください。'
            : '通信が届きました。第2話は、いま準備中です。'}
        </p>

        <div className="ticket">
          <div className="ticket-head">
            <p className="ticket-name">時間短縮チケット</p>
            <p className="points" aria-label="所持ポイント">
              <span className="muted small">所持</span> 0 pt
            </p>
          </div>
          <p className="muted small">待ち時間を早めるアイテムです。</p>
          <button type="button" className="btn secondary" onClick={handleSkipInterest}>
            チケットで早める
          </button>
          {asked && (
            <p className="feedback" role="status">
              このアイテムは、いま準備中です。お金はかかっていません。ご意見ありがとうございます！
            </p>
          )}
        </div>
      </section>

      <section className="card" aria-label="次のおすすめ">
        <h2>次のおすすめ</h2>
        <ul className="reco">
          <li>
            <span className="badge">COMING SOON</span>
            <span className="reco-title">第2話『？？？』</span>
            <span className="muted small">ミオからの、次の通信。</span>
          </li>
          <li>
            <span className="badge">COMING SOON</span>
            <span className="reco-title">短編 謎解き『？？？』</span>
            <span className="muted small">10分で遊べる、1話完結の謎。</span>
          </li>
        </ul>
      </section>
    </>
  );
}
