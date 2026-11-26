import { useState, type FormEvent } from 'react';
import { DialogueScreen } from './DialogueScreen';
import { toLines, type Line } from './script';
import { isCorrect } from './normalize';
import type { SubPuzzle } from './commute';
import { track } from './analytics';
import {
  buildToday,
  cleanStation,
  loadCommute,
  pickOfferStation,
  pickSubStory,
  SUB_STORIES,
  parseVia,
  saveCommute,
  todayKey,
  STATION_MAX,
  VIA_MAX,
  type CommuteSave,
  type Route,
} from './commute';

type Props = {
  name: string;
  dev?: boolean;
  onBack: () => void;
};

type Phase = 'menu' | 'setup' | 'intro' | 'mission' | 'offer' | 'sub' | 'declined' | 'done';

function introLines(route: Route): Line[] {
  const way = [route.from, ...route.via, route.to].join(' → ');
  return [
    { speaker: 'mio', text: 'こちらミオ。ここからは、あなたの活動範囲の話。' },
    { speaker: 'mio', text: `毎日通る道にも、小さなゆがみはできる。登録された区間は、${way}。` },
    { speaker: 'ryuka', text: '電車の中でも、できることはあるぜ。短い補正だ。音は消して、周りの迷惑にならないようにな！' },
  ];
}

/** 活動範囲モード（第1話クリアで解放）。いつもの区間の中で遊べる短い補正 */
export function CommuteScreen({ name, dev = false, onBack }: Props) {
  const [save, setSave] = useState<CommuteSave>(loadCommute);
  const [phase, setPhase] = useState<Phase>(save.route ? 'menu' : 'setup');
  const [step, setStep] = useState(0);
  const [offer, setOffer] = useState('');
  const [subIdx, setSubIdx] = useState(0);
  /** サブストーリーの進み具合：0=導入 1=謎1 2=途中 3=謎2 4=結末 */
  const [subStep, setSubStep] = useState(0);

  const today = todayKey();
  // 開発モードでは、1日1回の制限をなくす
  const doneToday = save.lastDone === today && !dev;

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

  const subStory = SUB_STORIES[subIdx];
  const fill = (text: string) => text.split('{station}').join(offer).split('{name}').join(name);

  if (phase === 'sub' && save.route && subStep % 2 === 0) {
    const text = [subStory.intro, '', subStory.mid, '', subStory.outro][subStep];
    return (
      <DialogueScreen
        key={`${subIdx}-${subStep}`}
        lines={toLines(fill(text))}
        onDone={() => {
          if (subStep >= 4) {
            update({ ...save, feelings: save.feelings + 1 });
            track('area_sub_clear', { story: subIdx + 1 });
            setPhase('done');
          } else {
            setSubStep(subStep + 1);
          }
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
      <p className="eyebrow">ACTIVITY AREA</p>
      <h1 className="rules-title">活動範囲</h1>

      {phase === 'setup' && (
        <SetupForm
          initial={save.route}
          onSubmit={(route) => {
            update({ ...save, route });
            track('area_register', { via_count: route.via.length });
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
            <p className="muted small">助けた想い：{save.feelings} 件</p>
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

          {dev && (
            <section className="card dev-panel" aria-label="開発モード">
              <p className="label">DEV 開発モード（1日1回の制限なし）</p>
              <div className="actions">
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => {
                    if (save.route) setOffer(pickOfferStation(save.route));
                    setPhase('offer');
                  }}
                >
                  途中下車の連絡を出す
                </button>
                {SUB_STORIES.map((st, i) => (
                  <button
                    key={st.title}
                    type="button"
                    className="btn ghost"
                    onClick={() => {
                      if (save.route) setOffer(pickOfferStation(save.route));
                      setSubIdx(i);
                      setSubStep(0);
                      setPhase('sub');
                    }}
                  >
                    サブストーリー{i + 1}：{st.title}
                  </button>
                ))}
              </div>
            </section>
          )}

          <div className="actions">
            <button
              type="button"
              className="btn primary"
              disabled={doneToday}
              onClick={() => {
                track('area_start');
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
              track('area_clear', { stamps });
              if (save.route) setOffer(pickOfferStation(save.route));
              setSubIdx(pickSubStory());
              setPhase('offer');
            } else {
              setStep(step + 1);
            }
          }}
        />
      )}

      {phase === 'sub' && save.route && subStep % 2 === 1 && (
        <SubPuzzleCard
          key={`${subIdx}-${subStep}`}
          label={`${subStory.title}　${subStep === 1 ? '1' : '2'} / 2`}
          puzzle={fill_(subStep === 1 ? subStory.p1 : subStory.p2, fill)}
          onSolved={() => setSubStep(subStep + 1)}
        />
      )}

      {phase === 'offer' && (
        <section className="card">
          <p className="eyebrow">補正完了　＋　連絡</p>
          <p className="story">
            ミオ：『今日の補正、お疲れさま。……ひとつ連絡。{offer}駅のあたりで、小さなゆがみを感知したの。降りられそう？』
          </p>
          <p className="muted small">
            降りると、少し長めの補正（5〜10分くらい）になります。降りるのは、時間と安全に余裕があるときだけにしてください。登録した駅は定期の範囲内のはずですが、ご自身の定期の範囲をご確認ください。ホームでは歩きながらスマホを見ないでください。
          </p>
          <div className="actions">
            <button type="button" className="btn primary" onClick={() => { track('area_offer', { choice: 'get_off' }); setSubStep(0); setPhase('sub'); }}>
              {offer}駅で降りる
            </button>
            <button type="button" className="btn ghost" onClick={() => { track('area_offer', { choice: 'skip' }); setPhase('declined'); }}>
              今日は降りない
            </button>
          </div>
        </section>
      )}

      {phase === 'declined' && (
        <section className="card done-card">
          <p className="story">ミオ：『了解。他のアジャスターに要請をかけておくわ。無理は禁物よ』</p>
          <button type="button" className="btn primary" onClick={() => setPhase('menu')}>
            もどる
          </button>
        </section>
      )}

      {phase === 'done' && (
        <section className="card done-card">
          <p className="correct">補正完了！</p>
          <p className="story">ミオ：『ゆがみは、いまのところ静か。……ありがとう、また明日』</p>
          <p className="muted small">助けた想い：{save.feelings} 件</p>
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

function fill_(p: SubPuzzle, fill: (t: string) => string): SubPuzzle {
  return { ...p, question: fill(p.question), hints: p.hints.map(fill) as SubPuzzle['hints'] };
}

/** 途中下車のサブストーリーの謎（「降りない」より、手ごたえのある謎） */
function SubPuzzleCard({ label, puzzle, onSolved }: { label: string; puzzle: SubPuzzle; onSolved: () => void }) {
  const [answer, setAnswer] = useState('');
  const [wrong, setWrong] = useState(0);
  const [hints, setHints] = useState(0);
  const [ok, setOk] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (answer.trim() === '') return;
    if (isCorrect(answer, puzzle.answers)) setOk(true);
    else setWrong((n) => n + 1);
  }

  return (
    <section className="card puzzle">
      <p className="eyebrow">{label}</p>
      <h2 className="stage-title">{puzzle.title}</h2>
      <p className="question multiline">{puzzle.question}</p>
      {ok ? (
        <div className="reveal" role="status">
          <p className="correct">正解！</p>
          <button type="button" className="btn primary" onClick={onSolved}>つづきへ</button>
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="answer-form">
            <label htmlFor="subans" className="label">こたえ</label>
            <input id="subans" type="text" lang="ja" value={answer} onChange={(e) => setAnswer(e.target.value)}
              autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck={false} />
            <button type="submit" className="btn primary" disabled={answer.trim() === ''}>回答する</button>
          </form>
          {wrong > 0 && <p key={wrong} className="feedback wrong" role="status">おしい！ちがうみたい。もう一度考えてみよう。</p>}
          {hints > 0 && (
            <ul className="hints">
              {puzzle.hints.slice(0, hints).map((h, i) => (
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
