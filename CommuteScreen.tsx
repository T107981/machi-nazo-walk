import { useState, type FormEvent } from 'react';
import { DialogueScreen } from './DialogueScreen';
import type { Line } from './script';
import { isCorrect } from './normalize';
import { track } from './analytics';
import {
  buildToday,
  cleanStation,
  loadCommute,
  parseVia,
  saveCommute,
  todayKey,
  STATION_MAX,
  VIA_MAX,
  type CommuteSave,
  type Route,
} from './commute';

type Props = {
  onBack: () => void;
};

type Phase = 'menu' | 'setup' | 'intro' | 'mission' | 'done';

function introLines(route: Route): Line[] {
  const way = [route.from, ...route.via, route.to].join(' → ');
  return [
    { speaker: 'mio', text: '通信、つながった？　ここからは、あなたの持ち場の話。' },
    { speaker: 'mio', text: `毎日通る道にも、小さな歪はできる。登録された区間は、${way}。` },
    { speaker: 'mio', text: '電車の中でやる、短い補正。音は消して、周りの迷惑にならないようにね。' },
  ];
}

/** 通勤補正モード（第1話クリアで解放）。定期区間の中で遊べる短い補正 */
export function CommuteScreen({ onBack }: Props) {
  const [save, setSave] = useState<CommuteSave>(loadCommute);
  const [phase, setPhase] = useState<Phase>(save.route ? 'menu' : 'setup');
  const [step, setStep] = useState(0);

  const today = todayKey();
  const doneToday = save.lastDone === today;

  function update(next: CommuteSave) {
    setSave(next);
    saveCommute(next);
  }

  if (phase === 'intro' && save.route) {
    return (
      <DialogueScreen
        lines={introLines(save.route)}
        onDone={() => {
          setStep(0);
          setPhase('mission');
        }}
      />
    );
  }

  return (
    <main className="screen commute">
      <header className="play-header">
        <button type="button" className="link" onClick={onBack}>
          ← ホームへ
        </button>
      </header>
      <p className="eyebrow">COMMUTE ADJUST</p>
      <h1 className="rules-title">通勤補正</h1>

      {phase === 'setup' && (
        <SetupForm
          initial={save.route}
          onSubmit={(route) => {
            update({ ...save, route });
            track('commute_register', { via_count: route.via.length });
            setPhase('menu');
          }}
          onCancel={save.route ? () => setPhase('menu') : onBack}
        />
      )}

      {phase === 'menu' && save.route && (
        <>
          <section className="card">
            <p className="label">登録中の区間</p>
            <p className="route">{[save.route.from, ...save.route.via, save.route.to].join(' → ')}</p>
            <p className="muted small">この端末の中だけに保存されています。</p>
            <button type="button" className="btn ghost" onClick={() => setPhase('setup')}>
              区間を変更する
            </button>
          </section>

          <section className="card">
            <p className="label">補正スタンプ</p>
            <p className="stamps">{save.stamps} 個</p>
            {doneToday ? (
              <p className="muted small">今日の補正は完了しました。明日、また新しい補正が届きます。</p>
            ) : (
              <p className="muted small">1日1回、新しい補正が届きます。</p>
            )}
          </section>

          <section className="card caution">
            <h2>電車での注意</h2>
            <ul className="notes">
              <li>音は消して、周りの人に画面や声が迷惑にならないようにしてください。</li>
              <li>混んでいるときは、無理に操作しないでください。</li>
              <li>乗り過ごしに気をつけてください。降りるときは、歩きながらスマホを見ないでください。</li>
              <li>人や、他人の画面を撮影しないでください。</li>
            </ul>
          </section>

          <div className="actions">
            <button
              type="button"
              className="btn primary"
              disabled={doneToday}
              onClick={() => {
                track('commute_start');
                setPhase('intro');
              }}
            >
              {doneToday ? '今日の補正は完了' : '今日の補正をはじめる'}
            </button>
          </div>
        </>
      )}

      {phase === 'mission' && save.route && (
        <MissionView
          key={step}
          route={save.route}
          step={step}
          onNext={() => {
            if (step >= 2) {
              const stamps = save.stamps + 1;
              update({ ...save, stamps, lastDone: today });
              track('commute_clear', { stamps });
              setPhase('done');
            } else {
              setStep(step + 1);
            }
          }}
        />
      )}

      {phase === 'done' && (
        <section className="card done-card">
          <p className="correct">補正完了！</p>
          <p className="story">ミオ：『歪は、いまのところ静か。……ありがとう、また明日』</p>
          <p className="stamps">補正スタンプ {save.stamps} 個</p>
          <button type="button" className="btn primary" onClick={() => setPhase('menu')}>
            もどる
          </button>
        </section>
      )}
    </main>
  );
}

function SetupForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial: Route | null;
  onSubmit: (r: Route) => void;
  onCancel: () => void;
}) {
  const [from, setFrom] = useState(initial?.from ?? '');
  const [to, setTo] = useState(initial?.to ?? '');
  const [via, setVia] = useState((initial?.via ?? []).join('、'));
  const [error, setError] = useState('');

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = cleanStation(from);
    const t = cleanStation(to);
    if (f === '' || t === '') return setError('乗る駅と、降りる駅を入力してください。');
    if (f === t) return setError('乗る駅と降りる駅は、別の駅にしてください。');
    onSubmit({ from: f, to: t, via: parseVia(via).filter((v) => v !== f && v !== t) });
  }

  return (
    <form className="card answer-form" onSubmit={handleSubmit}>
      <p className="story">いつも乗る区間（定期の範囲）を登録してください。駅名は、自由に入力できます。</p>

      <label htmlFor="from" className="label">乗る駅</label>
      <input id="from" type="text" lang="ja" value={from} maxLength={STATION_MAX + 1}
        onChange={(e) => setFrom(e.target.value)} autoComplete="off" placeholder="例：新大阪" />

      <label htmlFor="to" className="label">降りる駅</label>
      <input id="to" type="text" lang="ja" value={to} maxLength={STATION_MAX + 1}
        onChange={(e) => setTo(e.target.value)} autoComplete="off" placeholder="例：心斎橋" />

      <label htmlFor="via" className="label">途中の駅（なくてもOK。{VIA_MAX}つまで、「、」で区切る）</label>
      <input id="via" type="text" lang="ja" value={via}
        onChange={(e) => setVia(e.target.value)} autoComplete="off" placeholder="例：梅田、本町" />

      <p className="muted small">
        位置情報は使いません。入力した駅名は、このスマホの中だけに保存され、サーバーには送られません。
      </p>
      {error && <p className="feedback wrong" role="alert">{error}</p>}
      <button type="submit" className="btn primary">この区間で登録する</button>
      <button type="button" className="btn ghost" onClick={onCancel}>やめる</button>
    </form>
  );
}

function MissionView({ route, step, onNext }: { route: Route; step: number; onNext: () => void }) {
  const mission = buildToday(route)[step];
  const [answer, setAnswer] = useState('');
  const [wrong, setWrong] = useState(0);
  const [hint, setHint] = useState(false);
  const [ok, setOk] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (mission.kind !== 'puzzle' || answer.trim() === '') return;
    if (isCorrect(answer, [mission.answer])) setOk(true);
    else setWrong((n) => n + 1);
  }

  return (
    <section className="card puzzle" key={step}>
      <p className="eyebrow">
        {step + 1} / 3　{mission.kind === 'puzzle' ? '駅名の謎' : '車内ミッション'}
      </p>
      <h2 className="stage-title">{mission.title}</h2>
      <p className="question multiline">{mission.text}</p>

      {mission.kind === 'watch' ? (
        <button type="button" className="btn primary" onClick={onNext}>
          見つけた！
        </button>
      ) : ok ? (
        <div className="reveal" role="status">
          <p className="correct">正解！</p>
          <button type="button" className="btn primary" onClick={onNext}>
            {step >= 2 ? '補正を完了する' : '次へ'}
          </button>
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="answer-form">
            <label htmlFor="ans" className="label">こたえ</label>
            <input id="ans" type="text" lang="ja" value={answer}
              onChange={(e) => setAnswer(e.target.value)} autoComplete="off" autoCapitalize="off"
              autoCorrect="off" spellCheck={false} />
            <button type="submit" className="btn primary" disabled={answer.trim() === ''}>回答する</button>
          </form>
          {wrong > 0 && (
            <p key={wrong} className="feedback wrong" role="status">おしい！ちがうみたい。もう一度考えてみよう。</p>
          )}
          {hint && <p className="hints"><span className="hint-no">ヒント</span>{mission.hint}</p>}
          <button type="button" className="btn secondary" onClick={() => setHint(true)} disabled={hint}>
            {hint ? 'ヒントを表示しました' : 'ヒントを見る'}
          </button>
        </>
      )}
    </section>
  );
}
