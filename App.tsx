import { useEffect, useState } from 'react';
import { STORY } from './data/story';
import type { GameState, Mode } from './types';
import { loadState, saveState } from './lib/storage';
import { createRemoteSession, updateRemoteSession } from './lib/remote';
import { track } from './lib/analytics';
import { TopScreen } from './screens/TopScreen';
import { PlayScreen } from './screens/PlayScreen';
import { ClearScreen } from './screens/ClearScreen';

type Screen = 'top' | 'play' | 'clear';

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

export default function App() {
  const [state, setState] = useState<GameState | null>(loadValidState);
  const [screen, setScreen] = useState<Screen>('top');

  // 進行状況を端末内に保存（再読み込みしても続きから遊べる）
  useEffect(() => {
    if (state) saveState(state);
  }, [state]);

  // 画面や問題が切り替わったら、いちばん上へ戻す
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen, state?.stageIndex]);

  function commit(next: GameState) {
    setState(next);
    syncRemote(next);
  }

  function startGame(mode: Mode) {
    const next: GameState = {
      storyId: STORY.id,
      sessionId: null,
      mode,
      stageIndex: 0,
      arrived: false,
      solved: false,
      hintsShown: 0,
      hintsTotal: 0,
      wrongTotal: 0,
      startedAt: new Date().toISOString(),
      clearedAt: null,
    };
    setState(next);
    setScreen('play');
    track('game_start', { mode, story_id: STORY.id });

    // 保存先の行IDは、取れたときだけあとから反映する
    void createRemoteSession(STORY.id, mode).then((id) => {
      if (!id) return;
      setState((prev) =>
        prev && prev.startedAt === next.startedAt ? { ...prev, sessionId: id } : prev,
      );
    });
  }

  function resumeGame() {
    if (!state) return;
    setScreen(state.clearedAt ? 'clear' : 'play');
  }

  function handleArrived() {
    if (!state) return;
    setState({ ...state, arrived: true });
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
  }

  function handleNext() {
    if (!state) return;
    const isFinal = state.stageIndex === STORY.stages.length - 1;
    if (isFinal) {
      setScreen('clear');
      return;
    }
    commit({
      ...state,
      stageIndex: state.stageIndex + 1,
      arrived: false,
      solved: false,
      hintsShown: 0,
    });
  }

  return (
    <div className="app">
      {screen === 'top' && (
        <TopScreen
          story={STORY}
          resume={state}
          onStart={startGame}
          onResume={resumeGame}
        />
      )}
      {screen === 'play' && state && (
        <PlayScreen
          key={state.stageIndex}
          story={STORY}
          state={state}
          onArrived={handleArrived}
          onWrong={handleWrong}
          onSolved={handleSolved}
          onHint={handleHint}
          onNext={handleNext}
          onBack={() => setScreen('top')}
        />
      )}
      {screen === 'clear' && state && (
        <ClearScreen
          story={STORY}
          state={state}
          onRestart={() => startGame(state.mode)}
          onTop={() => setScreen('top')}
        />
      )}
    </div>
  );
}
