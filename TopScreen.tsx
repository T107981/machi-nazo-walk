import type { GameState, Story } from './types';

type Props = {
  story: Story;
  /** 保存されている進行状況（なければ null） */
  resume: GameState | null;
  onStart: () => void;
  onResume: () => void;
};

export function TopScreen({ story, resume, onStart, onResume }: Props) {
  const total = story.stages.length;
  const cleared = resume ? resume.stageIndex + (resume.solved ? 1 : 0) : 0;

  return (
    <main className="screen top">
      <div className="lamp" aria-hidden="true" />
      <p className="eyebrow">没入型謎解きアドベンチャー</p>
      <h1>
        日常に
        <br />
        ワクワクを
      </h1>
      <p className="story-title">
        {story.episode}『{story.title}』
      </p>
      <p className="story">{story.lead}</p>

      <section className="card">
        <h2>遊び方</h2>
        <ol className="steps">
          <li>通信で案内されながら、物語に出てくる謎を1つずつ解いていきます。</li>
          <li>謎を解くと「持ち物」が手に入ります。持ち物は、あとの謎で使います。</li>
          <li>全部で{total}問。約30分の物語です。場所は選びません。</li>
        </ol>
        <p className="muted">
          わからないときは「ヒント」が使えます。ヒントは3段階で、少しずつ答えに近づきます。
        </p>
      </section>

      <section className="card caution">
        <h2>遊ぶ前の注意</h2>
        <ul className="notes">
          <li>歩きながらスマホを見ないでください。立ち止まって、安全な場所で画面を見てください。</li>
          <li>車や自転車に気をつけ、交通ルールを守ってください。</li>
          <li>私有地・立入禁止の場所には入らないでください。</li>
          <li>暗い時間帯や天気の悪い日は、無理をせず日を改めてください。</li>
          <li>
            保存するのは、匿名ID・進み具合・ヒントの回数だけです。名前やメールアドレス、位置情報は集めません。
          </li>
        </ul>
      </section>

      <div className="actions">
        {resume ? (
          <>
            <button type="button" className="btn primary" onClick={onResume}>
              {resume.clearedAt ? 'クリア画面を見る' : `つづきから（${cleared}/${total}）`}
            </button>
            <button type="button" className="btn ghost" onClick={onStart}>
              最初からはじめる
            </button>
          </>
        ) : (
          <button type="button" className="btn primary" onClick={onStart}>
            物語をはじめる
          </button>
        )}
      </div>
    </main>
  );
}
