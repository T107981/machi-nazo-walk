/**
 * 各画面を実際に描画して、必要な文言・ボタンが出ているかを確認するスクリプト。
 * 実行: npm run check:render
 */
import { renderToStaticMarkup } from 'react-dom/server';
import App from '../src/App';
import { STORY } from '../src/data/story';
import type { GameState, Story } from '../src/types';
import { TopScreen } from '../src/screens/TopScreen';
import { PlayScreen } from '../src/screens/PlayScreen';
import { ClearScreen } from '../src/screens/ClearScreen';

let failed = 0;
function check(label: string, ok: boolean) {
  console.log(`${ok ? 'OK  ' : 'NG  '} ${label}`);
  if (!ok) failed++;
}

const noop = () => {};
const base: GameState = {
  storyId: STORY.id,
  sessionId: null,
  mode: 'demo',
  stageIndex: 0,
  arrived: false,
  solved: false,
  hintsShown: 0,
  hintsTotal: 0,
  wrongTotal: 0,
  startedAt: '2026-11-12T09:00:00.000Z',
  clearedAt: null,
};

function play(story: Story, state: GameState) {
  return renderToStaticMarkup(
    <PlayScreen
      story={story}
      state={state}
      onArrived={noop}
      onWrong={noop}
      onSolved={noop}
      onHint={noop}
      onNext={noop}
      onBack={noop}
    />,
  );
}

// 座標つきのストーリー（街歩きモードの到着チェックを確かめる用）
const geoStory: Story = {
  ...STORY,
  stages: STORY.stages.map((s) => ({
    ...s,
    spot: { ...s.spot, lat: 35.0, lng: 135.0 },
  })),
};

// --- トップ画面 ---
const top = renderToStaticMarkup(
  <TopScreen story={STORY} resume={null} onStart={noop} onResume={noop} />,
);
check('トップ: タイトルが出る', top.includes('ワクワクを'));
check('トップ: 遊び方が出る', top.includes('遊び方'));
check('トップ: 注意事項が出る', top.includes('遊ぶ前の注意') && top.includes('歩きながらスマホを見ない'));
check('トップ: 街歩き/デモの開始ボタンが出る', top.includes('街歩きではじめる') && top.includes('デモモードで試す'));
check('トップ: 個人情報を集めない旨が出る', top.includes('名前やメールアドレスは集めません'));
check('トップ: 保存がなければ「つづきから」は出ない', !top.includes('つづきから'));

const topResume = renderToStaticMarkup(
  <TopScreen
    story={STORY}
    resume={{ ...base, stageIndex: 1, solved: false }}
    onStart={noop}
    onResume={noop}
  />,
);
check('トップ: 保存があれば「つづきから（1/4）」が出る', topResume.includes('つづきから（1/4）'));

// --- 謎解き画面 ---
const demo0 = play(STORY, base);
check('謎解き(デモ): ステージ名と謎が出る', demo0.includes('広場の掲示板') && demo0.includes('空から降ってきて'));
check('謎解き(デモ): 回答ボタンとヒントボタンが出る', demo0.includes('回答する') && demo0.includes('ヒントを見る（0/3）'));
check('謎解き(デモ): デモモード表示が出る', demo0.includes('デモモード'));
check('謎解き(デモ): 到着チェックは出ない', !demo0.includes('到着チェック'));

const geoNoCoords = play(STORY, { ...base, mode: 'geo' });
check('謎解き(街歩き・座標未設定): 到着チェックなしで謎が出る', geoNoCoords.includes('回答する') && !geoNoCoords.includes('到着チェック'));

const geoLocked = play(geoStory, { ...base, mode: 'geo' });
check('謎解き(街歩き・座標あり): 到着チェックが出る', geoLocked.includes('到着チェック') && geoLocked.includes('現在地を確認する'));
check('謎解き(街歩き・座標あり): 位置情報なしの代替ボタンが出る', geoLocked.includes('位置情報を使わずに進める'));
check('謎解き(街歩き・座標あり): 到着前は謎を隠す', !geoLocked.includes('回答する') && !geoLocked.includes('空から降ってきて'));

const geoArrived = play(geoStory, { ...base, mode: 'geo', arrived: true });
check('謎解き(街歩き・到着後): 謎が出る', geoArrived.includes('回答する') && !geoArrived.includes('現在地を確認する'));

const hints2 = play(STORY, { ...base, hintsShown: 2, hintsTotal: 2 });
check('ヒント: 2つ目まで表示される', hints2.includes('ヒント1') && hints2.includes('ヒント2') && !hints2.includes('ヒント3'));
check('ヒント: 残りの回数が出る', hints2.includes('ヒントを見る（2/3）'));

const hintsAll = play(STORY, { ...base, hintsShown: 3, hintsTotal: 3 });
check('ヒント: 全部出すとボタンが無効になる', hintsAll.includes('ヒントはすべて表示しました') && hintsAll.includes('disabled'));

const solved0 = play(STORY, { ...base, solved: true });
check('正解後: 正解表示・次の手がかり・次へボタン', solved0.includes('正解！') && solved0.includes('水辺か、姿の映る場所へ') && solved0.includes('次の場所へ'));
check('正解後: 回答フォームは消える', !solved0.includes('回答する'));
check('正解後: 欠片「あ」が増える', /class="filled">あ</.test(solved0));

const stage2 = play(STORY, { ...base, stageIndex: 1 });
check('2問目: 欠片「あ」が引き継がれ、残りは空', /class="filled">あ</.test(stage2) && (stage2.match(/class="empty"/g) ?? []).length === 2);

const finalOpen = play(STORY, { ...base, stageIndex: 3 });
const strip = finalOpen.slice(finalOpen.indexOf('class="pieces"'));
const iRi = strip.indexOf('>り<');
const iA = strip.indexOf('>あ<');
const iKa = strip.indexOf('>か<');
check('最終問題: 欠片が並べ替え前の順（り・あ・か）で出る', iRi > -1 && iRi < iA && iA < iKa);
check('最終問題: 謎が出る', finalOpen.includes('並べ替えると'));

const finalSolved = play(STORY, { ...base, stageIndex: 3, solved: true });
check('最終正解後: 「クリア画面へ」が出る', finalSolved.includes('クリア画面へ'));

// --- クリア画面 ---
const clear = renderToStaticMarkup(
  <ClearScreen
    story={STORY}
    state={{
      ...base,
      stageIndex: 3,
      solved: true,
      hintsTotal: 2,
      wrongTotal: 1,
      clearedAt: '2026-11-12T09:25:00.000Z',
    }}
    onRestart={noop}
    onTop={noop}
  />,
);
check('クリア: メッセージが出る', clear.includes('街に灯りが'));
check('クリア: 所要時間25分・ヒント2回・まちがい1回', clear.includes('約25分') && clear.includes('2回') && clear.includes('1回'));
check('クリア: デモモードの案内が出る', clear.includes('デモモードでのクリア'));
check('クリア: 再開ボタンが出る', clear.includes('もう一度、最初から遊ぶ'));

// --- App全体（保存なしの初期表示）---
const app = renderToStaticMarkup(<App />);
check('App: 初期表示はトップ画面', app.includes('街歩きではじめる'));

console.log(failed === 0 ? '\nすべて合格' : `\n${failed} 件の失敗`);
if (failed > 0) throw new Error(`${failed} checks failed`);
