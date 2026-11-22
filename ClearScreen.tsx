import type { GameState, Story } from './types';
import { NextSection } from './NextSection';

type Props = {
  story: Story;
  state: GameState;
  onRestart: () => void;
  onTop: () => void;
};

function minutesBetween(startIso: string, endIso: string | null): number {
  const start = new Date(startIso).getTime();
  const end = endIso ? new Date(endIso).getTime() : Date.now();
  if (Number.isNaN(start) || Number.isNaN(end)) return 1;
  return Math.max(1, Math.round((end - start) / 60000));
}

export function ClearScreen({ story, state, onRestart, onTop }: Props) {
  const minutes = minutesBetween(state.startedAt, state.clearedAt);

  return (
    <main className="screen clear">
      <div className="lamp lit" aria-hidden="true" />
      <p className="eyebrow">CLEAR</p>
      <h1>
        ゆがみを
        <br />
        補正しました
      </h1>
      <p className="story-title">
        {story.episode}『{story.title}』
      </p>

      <p className="card-note multiline" aria-label="残されたキーカード">
        {`KEY CARD　${story.cardNo}\n${story.card}\n\n裏面に刻印：${story.cardEngraving}\n（いまは、意味がわからない）`}
      </p>

      <p className="story">第1話　完</p>

      <section className="card">
        <h2>あなたの記録</h2>
        <dl className="stats">
          <div>
            <dt>所要時間</dt>
            <dd>約{minutes}分</dd>
          </div>
          <div>
            <dt>ヒント</dt>
            <dd>{state.hintsTotal}回</dd>
          </div>
          <div>
            <dt>まちがい</dt>
            <dd>{state.wrongTotal}回</dd>
          </div>
        </dl>
      </section>

      <NextSection clearedAt={state.clearedAt} storyId={story.id} />

      <div className="actions">
        <button type="button" className="btn primary" onClick={onRestart}>
          もう一度、最初から遊ぶ
        </button>
        <button type="button" className="btn ghost" onClick={onTop}>
          ホームへ戻る
        </button>
      </div>
    </main>
  );
}
