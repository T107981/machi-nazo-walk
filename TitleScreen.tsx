import type { Story } from './types';
import { Skyline } from './Skyline';

type Props = {
  story: Story;
  onStart: () => void;
};

/** 最初に出るタイトル画面（一枚絵の上にタイトルを重ねる） */
export function TitleScreen({ story, onStart }: Props) {
  return (
    <main className="screen title" onClick={onStart}>
      <div className="title-art">
        <Skyline />
      </div>
      <div className="title-body">
        <p className="eyebrow">没入型謎解きアドベンチャー</p>
        <h1 className="title-call">
          日常に
          <br />
          ワクワクを
        </h1>
        <p className="story-title">
          {story.episode}『{story.title}』
        </p>
      </div>
      <div className="actions">
        <button type="button" className="btn primary" onClick={onStart}>
          START
        </button>
        <p className="muted small tap">画面のどこかをタップ</p>
      </div>
    </main>
  );
}
