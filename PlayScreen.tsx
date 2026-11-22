import { useState, type FormEvent } from 'react';
import type { GameState, Item, Story } from './types';
import { isCorrect } from './normalize';

type Props = {
  story: Story;
  state: GameState;
  onWrong: () => void;
  onSolved: () => void;
  onHint: () => void;
  onBack: () => void;
};

export function PlayScreen({ story, state, onWrong, onSolved, onHint, onBack }: Props) {
  const stage = story.stages[state.stageIndex];
  const total = story.stages.length;

  const [answer, setAnswer] = useState('');
  const [wrongTick, setWrongTick] = useState(0);

  // これまでに手に入れたもの（この謎を解いた直後は、その分も含める）
  const doneCount = state.stageIndex + (state.solved ? 1 : 0);
  const doneStages = story.stages.slice(0, doneCount);
  const items: Item[] = doneStages.flatMap((s) => (s.item ? [s.item] : []));
  const pieces: string[] = doneStages.flatMap((s) => (s.piece ? [s.piece] : []));
  const hasBag = items.length > 0 || pieces.length > 0;

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
          ← ホームへ
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
        {story.episode}　{state.stageIndex + 1} / {total}
      </p>
      <h2 className="stage-title">{stage.title}</h2>
      <p className="place">目安の場所：{stage.place}</p>

      <section className="card puzzle">
        <p className="label">謎</p>
        <p className="question multiline">{stage.question}</p>

        {stage.uses.length > 0 && (
          <p className="uses">
            使う持ち物：
            {stage.uses
              .map((id) => items.find((it) => it.id === id)?.name ?? id)
              .join('、')}
            （下の「持ち物」を見る）
          </p>
        )}

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
        ) : null}
      </section>

      {hasBag && (
        <section className="card bag" aria-label="持ち物">
          <p className="label">持ち物</p>

          {pieces.length > 0 && (
            <div>
              <p className="muted small">ことばの欠片</p>
              <ul className="pieces">
                {pieces.map((p, i) => (
                  <li key={i} className="filled">
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {items.map((item) => (
            <div key={item.id} className={`item ${stage.uses.includes(item.id) ? 'in-use' : ''}`}>
              <p className="item-name">{item.name}</p>
              <p className="muted small">{item.note}</p>
              <p className="item-body multiline">{item.body}</p>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
