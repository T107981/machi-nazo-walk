import kv from './kv.jpg';
import ryuka from './ryuka.webp';

/** 起動時のローディング画面（キービジュアルをぼかして背景にする） */
export function LoadingScreen() {
  return (
    <main className="loading" role="status" aria-label="読み込み中">
      <img className="loading-bg" src={kv} alt="" aria-hidden="true" />
      <div className="loading-center">
        <div className="loading-ring" aria-hidden="true">
          <span className="ring r1" />
          <span className="ring r2" />
          <img className="loading-ryuka" src={ryuka} alt="" />
        </div>
        <p className="loading-title">KASANARIA</p>
        <p className="loading-text">セカイが、重なっています…</p>
        <div className="loading-bar" aria-hidden="true"><span /></div>
      </div>
    </main>
  );
}
