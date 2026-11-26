import { useState, type FormEvent } from 'react';
import { DAILY_ITEMS, loadDailyDone, saveDailyDone, type DailyItem } from './daily';
import { isCorrect } from './normalize';
import { track } from './analytics';

type Props = { onBack: () => void };

/** 日常謎：汚れてしまった誰かの大切なものを、その場で直す（第1話クリアで解放） */
export function DailyScreen({ onBack }: Props) {
  const [done, setDone] = useState<string[]>(loadDailyDone);
  const [openId, setOpenId] = useState<string | null>(null);
  const item = DAILY_ITEMS.find((d) => d.id === openId) ?? null;

  function finish(id: string) {
    if (done.includes(id)) return;
    const next = [...done, id];
    setDone(next);
    saveDailyDone(next);
    track('daily_clear', { item: id });
  }

  return (
    <main className="screen daily">
      <header className="play-header">
        <button type="button" className="link" onClick={item ? () => setOpenId(null) : onBack}>
          ← {item ? '一覧へ' : 'ホームへ'}
        </button>
      </header>
      <p className="eyebrow">REPAIR SHOP</p>
      <h1 className="rules-title">想い修理屋</h1>

      {!item && (
        <>
          <p className="story">
            カサナリアで汚れてしまった、誰かの大切な「預かりもの」。ここは、リュカと開いた修理屋。小さな謎をひも解いて、持ち主の想いを、直してあげよう。
          </p>
          <ul className="daily-list">
            {DAILY_ITEMS.map((d) => (
              <li key={d.id}>
                <button
                  type="button"
                  className={`daily-card ${done.includes(d.id) ? 'restored' : ''}`}
                  onClick={() => setOpenId(d.id)}
                >
                  <span className="daily-name">{d.name}</span>
                  <span className="muted small">持ち主：{d.owner}</span>
                  <span className="badge">{done.includes(d.id) ? '直った' : '修理待ち'}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="muted small">いまは3つだけの、仮の内容です。</p>
        </>
      )}

      {item && <DailyDetail key={item.id} item={item} restored={done.includes(item.id)} onSolved={() => finish(item.id)} />}
    </main>
  );
}

function DailyDetail({ item, restored, onSolved }: { item: DailyItem; restored: boolean; onSolved: () => void }) {
  const [answer, setAnswer] = useState('');
  const [wrong, setWrong] = useState(0);
  const [hints, setHints] = useState(0);
  const [ok, setOk] = useState(restored);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (answer.trim() === '') return;
    if (isCorrect(answer, item.answers)) {
      setOk(true);
      onSolved();
    } else {
      setWrong((n) => n + 1);
    }
  }

  return (
    <section className={`card daily-detail ${ok ? 'restored' : ''}`}>
      <h2 className="stage-title">{item.name}</h2>
      <p className="muted small">持ち主：{item.owner}</p>
      <p className="story multiline">{item.story}</p>
      <p className="question multiline">{item.question}</p>

      {ok ? (
        <div className="reveal" role="status">
          <p className="correct">修理完了！</p>
          <p className="story multiline">{item.restored}</p>
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="answer-form">
            <label htmlFor="dans" className="label">こたえ</label>
            <input id="dans" type="text" lang="ja" value={answer} onChange={(e) => setAnswer(e.target.value)}
              autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck={false} />
            <button type="submit" className="btn primary" disabled={answer.trim() === ''}>回答する</button>
          </form>
          {wrong > 0 && <p key={wrong} className="feedback wrong" role="status">おしい！ちがうみたい。</p>}
          {hints > 0 && (
            <ul className="hints">
              {item.hints.slice(0, hints).map((h, i) => (
                <li key={i}><span className="hint-no">ヒント{i + 1}</span>{h}</li>
              ))}
            </ul>
          )}
          <button type="button" className="btn secondary" onClick={() => setHints((n) => n + 1)} disabled={hints >= 3}>
            {hints >= 3 ? 'ヒントはすべて表示しました' : `ヒントを見る（${hints}/3）`}
          </button>
        </>
      )}
    </section>
  );
}
