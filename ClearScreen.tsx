import type { GameState, Story } from '../types';

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
      <h1>街に灯りが
        <br />
        戻りました</h1>
      <p className="story-title">『{story.title}』</p>
      <p className="story">
        三つの欠片が、ひとつの灯りになりました。あなたが歩いた道のりが、街をもう一度照らしています。ご参加ありがとうございました。
      </p>

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
        {state.mode === 'demo' && (
          <p className="muted small">デモモードでのクリアです。次は街を歩いて遊んでみてください。</p>
        )}
      </section>

      <div className="actions">
        <button type="button" className="btn primary" onClick={onRestart}>
          もう一度、最初から遊ぶ
        </button>
        <button type="button" className="btn ghost" onClick={onTop}>
          トップへ戻る
        </button>
      </div>
    </main>
  );
}
