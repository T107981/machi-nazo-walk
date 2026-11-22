import type { GameState, Story } from './types';

type Props = {
  story: Story;
  resume: GameState | null;
  onStart: () => void;
  onResume: () => void;
};

/** 最初に出るタイトル画面 */
export function TitleScreen({ story, resume, onStart, onResume }: Props) {
  const total = story.stages.length;
  const cleared = resume ? resume.stageIndex + (resume.solved ? 1 : 0) : 0;

  return (
    <main className="screen title">
      <div className="lamp" aria-hidden="true" />
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
        {resume ? (
          <>
            <button type="button" className="btn primary" onClick={onResume}>
              {resume.clearedAt ? 'クリア画面を見る' : `つづきから（${cleared}/${total}）`}
            </button>
            <button type="button" className="btn ghost" onClick={onStart}>
              はじめから
            </button>
          </>
        ) : (
          <button type="button" className="btn primary" onClick={onStart}>
            START
          </button>
        )}
      </div>
    </main>
  );
}
