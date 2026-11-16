import { useState, type FormEvent } from 'react';
import type { GameState, Story } from './types';
import { isCorrect } from './normalize';
import {
  geoFailureMessage,
  getCurrentPosition,
  hasCoords,
  isArrived,
} from './geo';

type Props = {
  story: Story;
  state: GameState;
  onArrived: () => void;
  onWrong: () => void;
  onSolved: () => void;
  onHint: () => void;
  onNext: () => void;
  onBack: () => void;
};

function formatDistance(m: number): string {
  if (m < 1000) return `${Math.max(10, Math.round(m / 10) * 10)}m`;
  return `${(m / 1000).toFixed(1)}km`;
}

export function PlayScreen({
  story,
  state,
  onArrived,
  onWrong,
  onSolved,
  onHint,
  onNext,
  onBack,
}: Props) {
  const stage = story.stages[state.stageIndex];
  const total = story.stages.length;
  const isFinal = state.stageIndex === total - 1;
  const spot = stage.spot;

  const [answer, setAnswer] = useState('');
  const [wrongTick, setWrongTick] = useState(0);
  const [geoBusy, setGeoBusy] = useState(false);
  const [geoMessage, setGeoMessage] = useState<string | null>(null);

  // 街歩きモードで、座標が設定されていて、まだ到着していない間は謎を隠す
  const needsArrival = state.mode === 'geo' && hasCoords(spot) && !state.arrived;

  // 集めた欠片の表示（最終ステージだけは並べ替え前の状態で見せる）
  const collectedCount = Math.min(
    state.stageIndex + (state.solved ? 1 : 0),
    total - 1,
  );
  const pieces: string[] = isFinal
    ? story.scrambledPieces
    : story.stages
        .slice(0, total - 1)
        .map((s, i) => (i < collectedCount ? (s.piece ?? '？') : '？'));

  async function checkArrival() {
    setGeoBusy(true);
    setGeoMessage(null);
    const result = await getCurrentPosition();
    setGeoBusy(false);
    if (!result.ok) {
      setGeoMessage(geoFailureMessage(result.reason));
      return;
    }
    if (!hasCoords(spot)) {
      onArrived();
      return;
    }
    const verdict = isArrived(spot, result.position, result.accuracyM);
    if (verdict.arrived) {
      onArrived();
    } else {
      setGeoMessage(
        `目的地まで、あと約${formatDistance(verdict.distanceM)}です。もう少し歩いてみましょう。`,
      );
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (answer.trim() === '') return;
    if (isCorrect(answer, stage.answers)) {
      setWrongTick(0);
      onSolved();
    } else {
      setWrongTick((n) => n + 1);
      onWrong();
    }
  }

  return (
    <main className="screen play">
      <header className="play-header">
        <button type="button" className="link" onClick={onBack}>
          ← トップへ
        </button>
        <ol className="dots" aria-label={`ステージ ${state.stageIndex + 1} / ${total}`}>
          {story.stages.map((s, i) => {
            const done = i < state.stageIndex || (i === state.stageIndex && state.solved);
            const cls = done ? 'done' : i === state.stageIndex ? 'current' : '';
            return <li key={s.id} className={cls} />;
          })}
        </ol>
      </header>

      <p className="eyebrow">
        STAGE {state.stageIndex + 1} / {total}
      </p>
      <h2 className="stage-title">{stage.title}</h2>
      <p className="story">{stage.intro}</p>

      <section className="card spot">
        <p className="label">場所</p>
        <p className="spot-name">{spot.name}</p>
        <p className="muted">{spot.description}</p>
        {state.mode === 'demo' && (
          <p className="tag">デモモード：場所の確認なしで進めます</p>
        )}
      </section>

      {needsArrival ? (
        <section className="card arrival">
          <p className="label">到着チェック</p>
          <p>
            場所に着いたら、ボタンを押して現在地を確認してください。確認できると、謎が現れます。
          </p>
          <button
            type="button"
            className="btn primary"
            onClick={checkArrival}
            disabled={geoBusy}
          >
            {geoBusy ? '現在地を確認しています…' : '現在地を確認する'}
          </button>
          {geoMessage && (
            <p className="feedback info" role="status">
              {geoMessage}
            </p>
          )}
          <button type="button" className="btn ghost" onClick={onArrived}>
            位置情報を使わずに進める
          </button>
          <p className="muted small">
            位置情報は端末の中で判定するだけで、保存・送信はしません。
          </p>
        </section>
      ) : (
        <>
          <section className="card puzzle">
            <p className="label">謎</p>
            <p className="question">{stage.question}</p>

            {!state.solved ? (
              <>
                <form onSubmit={handleSubmit} className="answer-form">
                  <label htmlFor="answer" className="label">
                    こたえ
                  </label>
                  <input
                    id="answer"
                    type="text"
                    lang="ja"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    autoComplete="off"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck={false}
                    enterKeyHint="send"
                    placeholder="ひらがな・漢字どちらでもOK"
                  />
                  <button type="submit" className="btn primary" disabled={answer.trim() === ''}>
                    回答する
                  </button>
                </form>

                {wrongTick > 0 && (
                  <p key={wrongTick} className="feedback wrong" role="status">
                    おしい！ちがうみたい。もう一度考えてみよう。
                  </p>
                )}

                {state.hintsShown > 0 && (
                  <ul className="hints">
                    {stage.hints.slice(0, state.hintsShown).map((hint, i) => (
                      <li key={i}>
                        <span className="hint-no">ヒント{i + 1}</span>
                        {hint}
                      </li>
                    ))}
                  </ul>
                )}

                <button
                  type="button"
                  className="btn secondary"
                  onClick={onHint}
                  disabled={state.hintsShown >= stage.hints.length}
                >
                  {state.hintsShown >= stage.hints.length
                    ? 'ヒントはすべて表示しました'
                    : `ヒントを見る（${state.hintsShown}/${stage.hints.length}）`}
                </button>
              </>
            ) : (
              <div className="reveal" role="status">
                <p className="correct">正解！</p>
                <p className="story">{stage.reveal}</p>
                <button type="button" className="btn primary" onClick={onNext}>
                  {isFinal ? 'クリア画面へ' : '次の場所へ'}
                </button>
              </div>
            )}
          </section>

          <section className="pieces-wrap" aria-label="集めた灯りの欠片">
            <p className="label">灯りの欠片</p>
            <ul className="pieces">
              {pieces.map((p, i) => (
                <li key={i} className={p === '？' ? 'empty' : 'filled'}>
                  {p}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </main>
  );
}
