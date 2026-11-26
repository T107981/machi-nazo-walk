import type { Story } from './types';

type Props = {
  story: Story;
  onStart: () => void;
  onBack: () => void;
};

export function TopScreen({ story, onStart, onBack }: Props) {
  const total = story.stages.length;

  return (
    <main className="screen top">
      <p className="eyebrow">KASANARIA</p>
      <h1 className="rules-title">遊ぶ前に</h1>

      <section className="card">
        <h2>遊び方</h2>
        <ol className="steps">
          <li>リュカとミオに案内されながら、物語に出てくる謎を1つずつ解いていきます。</li>
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
        <button type="button" className="btn primary" onClick={onStart}>
          物語をはじめる
        </button>
        <button type="button" className="btn ghost" onClick={onBack}>
          ホームへ戻る
        </button>
      </div>
    </main>
  );
}
