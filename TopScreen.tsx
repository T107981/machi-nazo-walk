import type { GameState, Mode, Story } from './types';

type Props = {
  story: Story;
  /** 保存されている進行状況（なければ null） */
  resume: GameState | null;
  onStart: (mode: Mode) => void;
  onResume: () => void;
};

export function TopScreen({ story, resume, onStart, onResume }: Props) {
  const total = story.stages.length;
  const cleared = resume ? resume.stageIndex + (resume.solved ? 1 : 0) : 0;

  return (
    <main className="screen top">
      <div className="lamp" aria-hidden="true" />
      <p className="eyebrow">没入型謎解きアドベンチャー</p>
      <h1>日常に
        <br />
        ワクワクを</h1>
      <p className="story-title">『{story.title}』</p>
      <p className="story">{story.lead}</p>

      <section className="card">
        <h2>遊び方</h2>
        <ol className="steps">
          <li>物語の手がかりをもとに、街の「場所」へ歩いて向かいます。</li>
          <li>着いたら「現在地を確認」。謎が現れます。</li>
          <li>答えを入力して、灯りの欠片を集めましょう。</li>
          <li>全部で{total}か所。約30分の街歩きです。</li>
        </ol>
        <p className="muted">
          わからないときは「ヒント」が使えます。位置情報が使えなくても、デモモードで最後まで試せます。
        </p>
      </section>

      <section className="card caution">
        <h2>遊ぶ前の注意</h2>
        <ul className="notes">
          <li>歩きながらスマホを見ないでください。立ち止まって、安全な場所で画面を見てください。</li>
          <li>車や自転車に気をつけ、交通ルールを守ってください。</li>
          <li>私有地・立入禁止の場所には入らないでください。お店や住民の方の迷惑にならないようにお願いします。</li>
          <li>暗い時間帯や天気の悪い日は、無理をせず日を改めてください。</li>
          <li>
            位置情報は「到着の確認」だけに使い、端末の中で判定します。サーバーへは送らず、保存もしません。
          </li>
          <li>
            保存するのは、匿名ID・進み具合・ヒントの回数だけです。名前やメールアドレスは集めません。
          </li>
        </ul>
      </section>

      <div className="actions">
        {resume ? (
          <>
            <button type="button" className="btn primary" onClick={onResume}>
              {resume.clearedAt ? 'クリア画面を見る' : `つづきから（${cleared}/${total}）`}
            </button>
            <button type="button" className="btn secondary" onClick={() => onStart('geo')}>
              最初から街歩きで遊ぶ
            </button>
            <button type="button" className="btn ghost" onClick={() => onStart('demo')}>
              最初からデモモードで試す
            </button>
          </>
        ) : (
          <>
            <button type="button" className="btn primary" onClick={() => onStart('geo')}>
              街歩きではじめる
            </button>
            <button type="button" className="btn secondary" onClick={() => onStart('demo')}>
              デモモードで試す（位置情報なし）
            </button>
          </>
        )}
      </div>
    </main>
  );
}
