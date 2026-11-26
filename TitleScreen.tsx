import kv from './kv.jpg';

type Props = {
  onStart: () => void;
};

/** タイトル画面：キービジュアルを全面に出し、タップでホーム（初回は第1話）へ進むだけ */
export function TitleScreen({ onStart }: Props) {
  return (
    <main className="screen title" onClick={onStart}>
      <h1 className="sr-only">カサナリア</h1>
      <img className="title-bg" src={kv} alt="" aria-hidden="true" />
      <img className="title-kv" src={kv} alt="カサナリア　この場所には、もうひとつのセカイがある" />
      <div className="title-tap">
        <button type="button" className="btn primary" onClick={onStart}>
          TAP TO START
        </button>
      </div>
    </main>
  );
}
