import { useEffect, useState } from 'react';
import { STORY } from './story';
import type { GameState } from './types';
import { loadState, saveState, loadName, saveName } from './storage';
import { NameScreen } from './NameScreen';
import { createRemoteSession, updateRemoteSession } from './remote';
import { track } from './analytics';
import { TitleScreen } from './TitleScreen';
import { TopScreen } from './TopScreen';
import { HomeScreen } from './HomeScreen';
import { DialogueScreen } from './DialogueScreen';
import { toLines, type Line } from './script';
import { PlayScreen } from './PlayScreen';
import { ClearScreen } from './ClearScreen';

type Screen = 'title' | 'home' | 'name' | 'rules' | 'dialogue' | 'play' | 'clear';
/** 会話画面の種類：謎の前 / 謎のあと / 結末 */
type Scene = 'intro' | 'outro' | 'ending';

/** 保存されていた進行状況が、今のストーリーで使えるか確認する */
function loadValidState(): GameState | null {
  const saved = loadState();
  if (!saved) return null;
  if (saved.storyId !== STORY.id) return null;
  if (saved.stageIndex < 0 || saved.stageIndex >= STORY.stages.length) return null;
  return saved;
}

/** Supabase へ進行状況を送る（失敗してもゲームは止まらない） */
function syncRemote(next: GameState): void {
  if (!next.sessionId) return;
  void updateRemoteSession(next.sessionId, {
    stagesCleared: next.stageIndex + (next.solved ? 1 : 0),
    hintsUsed: next.hintsTotal,
    wrongAnswers: next.wrongTotal,
    cleared: next.clearedAt !== null,
  });
}

/** いまの会話画面で流すセリフ */
function linesFor(scene: Scene, stageIndex: number, name: string): Line[] {
  return rawLines(scene, stageIndex).map((l) => ({ ...l, text: l.text.split('{name}').join(name) }));
}

function rawLines(scene: Scene, stageIndex: number): Line[] {
  const stage = STORY.stages[stageIndex];
  if (scene === 'ending') {
    return [...toLines(STORY.epilogue, null), ...toLines(STORY.next, 'mio')];
  }
  if (scene === 'outro') return toLines(stage.reveal, 'mio');
  // 第1話の最初だけ、導入（差出人不明の通知）から始める
  if (stageIndex === 0) return [...toLines(STORY.lead, 'unknown'), ...toLines(stage.scene, 'mio')];
  return toLines(stage.scene, 'mio');
}

export default function App() {
  const [state, setState] = useState<GameState | null>(loadValidState);
  const [screen, setScreen] = useState<Screen>('title');
  const [scene, setScene] = useState<Scene>('intro');
  const [name, setName] = useState<string | null>(loadName);
  // 名前画面のあと、ゲームを始めるのか・ホームへ戻るのか
  const [afterName, setAfterName] = useState<'start' | 'home'>('start');

  // 進行状況を端末内に保存（再読み込みしても続きから遊べる）
  useEffect(() => {
    if (state) saveState(state);
  }, [state]);

  // 画面や問題が切り替わったら、いちばん上へ戻す
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen, scene, state?.stageIndex]);

  function commit(next: GameState) {
    setState(next);
    syncRemote(next);
  }

  function startGame() {
    const next: GameState = {
      storyId: STORY.id,
      sessionId: null,
      mode: 'anywhere',
      stageIndex: 0,
      solved: false,
      hintsShown: 0,
      hintsTotal: 0,
      wrongTotal: 0,
      startedAt: new Date().toISOString(),
      clearedAt: null,
    };
    setState(next);
    setScene('intro');
    setScreen('dialogue');
    track('game_start', { mode: next.mode, story_id: STORY.id });

    // 保存先の行IDは、取れたときだけあとから反映する
    void createRemoteSession(STORY.id, next.mode).then((id) => {
      if (!id) return;
      setState((prev) =>
        prev && prev.startedAt === next.startedAt ? { ...prev, sessionId: id } : prev,
      );
    });
  }

  function resumeGame() {
    if (!state) return;
    const isFinal = state.stageIndex === STORY.stages.length - 1;
    if (state.clearedAt) {
      setScreen('clear');
    } else if (state.solved && !isFinal) {
      // 正解した直後に閉じていた場合は、正解後の会話から
      setScene('outro');
      setScreen('dialogue');
    } else {
      setScreen('play');
    }
  }

  function handleWrong() {
    if (!state) return;
    commit({ ...state, wrongTotal: state.wrongTotal + 1 });
  }

  function handleHint() {
    if (!state) return;
    const stage = STORY.stages[state.stageIndex];
    if (state.hintsShown >= stage.hints.length) return;
    track('hint_used', { stage_index: state.stageIndex + 1, story_id: STORY.id });
    commit({
      ...state,
      hintsShown: state.hintsShown + 1,
      hintsTotal: state.hintsTotal + 1,
    });
  }

  function handleSolved() {
    if (!state) return;
    const stage = STORY.stages[state.stageIndex];
    const isFinal = state.stageIndex === STORY.stages.length - 1;
    track('stage_clear', {
      stage_index: state.stageIndex + 1,
      stage_id: stage.id,
      story_id: STORY.id,
    });

    if (!isFinal) {
      commit({ ...state, solved: true });
      setScene('outro');
      setScreen('dialogue');
      return;
    }

    // 最終ステージの正解 = クリア。画面を閉じても記録が残るよう、ここで確定する
    const clearedAt = new Date().toISOString();
    const minutes = Math.max(
      1,
      Math.round((new Date(clearedAt).getTime() - new Date(state.startedAt).getTime()) / 60000),
    );
    track('game_clear', {
      mode: state.mode,
      hints_used: state.hintsTotal,
      wrong_answers: state.wrongTotal,
      duration_min: minutes,
      story_id: STORY.id,
    });
    commit({ ...state, solved: true, clearedAt });
    // 結末の会話へ（読み終わるとクリア画面）
    setScene('ending');
    setScreen('dialogue');
  }

  /** 会話画面を読み終えたとき */
  function handleDialogueDone() {
    if (!state) return;
    if (scene === 'ending') {
      setScreen('clear');
    } else if (scene === 'outro') {
      commit({
        ...state,
        stageIndex: state.stageIndex + 1,
        solved: false,
        hintsShown: 0,
      });
      setScene('intro');
      // 次の謎の前の会話へ（画面は 'dialogue' のまま）
    } else {
      setScreen('play');
    }
  }

  return (
    <div className="app">
      {screen === 'title' && (
        <TitleScreen story={STORY} onStart={() => setScreen('home')} />
      )}
      {screen === 'home' && (
        <HomeScreen
          story={STORY}
          resume={state}
          onStartNew={() => setScreen('rules')}
          onResume={resumeGame}
          codename={name}
          onEditName={() => {
            setAfterName('home');
            setScreen('name');
          }}
          onBack={() => setScreen('title')}
        />
      )}
      {screen === 'name' && (
        <NameScreen
          initial={name}
          canCancel={afterName === 'home'}
          onSubmit={(n) => {
            saveName(n);
            setName(n);
            if (afterName === 'start') startGame();
            else setScreen('home');
          }}
          onCancel={() => setScreen('home')}
        />
      )}
      {screen === 'rules' && (
        <TopScreen
          story={STORY}
          onStart={() => {
            if (name) {
              startGame();
            } else {
              setAfterName('start');
              setScreen('name');
            }
          }}
          onBack={() => setScreen('home')}
        />
      )}
      {screen === 'dialogue' && state && (
        <DialogueScreen
          key={`${scene}-${state.stageIndex}`}
          lines={linesFor(scene, state.stageIndex, name ?? 'ナナシ')}
          onDone={handleDialogueDone}
        />
      )}
      {screen === 'play' && state && (
        <PlayScreen
          key={state.stageIndex}
          story={STORY}
          state={state}
          onWrong={handleWrong}
          onSolved={handleSolved}
          onHint={handleHint}
          onBack={() => setScreen('home')}
        />
      )}
      {screen === 'clear' && state && (
        <ClearScreen story={STORY} state={state} onRestart={() => setScreen('rules')} onTop={() => setScreen('home')} />
      )}
    </div>
  );
}
