/**
 * 画面を使わずに、ゲームの中核ロジックを確認するスクリプト。
 * 実行: npm run check:logic
 */
import { STORY } from '../src/data/story';
import { isCorrect, normalizeAnswer } from '../src/lib/normalize';
import { distanceM, hasCoords, isArrived } from '../src/lib/geo';

let failed = 0;
function check(label: string, ok: boolean) {
  console.log(`${ok ? 'OK  ' : 'NG  '} ${label}`);
  if (!ok) failed++;
}

// --- 回答の判定 ---
check('「あめ」を正解にできる', isCorrect('あめ', ['あめ', '雨']));
check('漢字「雨」を正解にできる', isCorrect('雨', ['あめ', '雨']));
check('カタカナ「アメ」を正解にできる', isCorrect('アメ', ['あめ', '雨']));
check('全角空白つき「　あ め　」を正解にできる', isCorrect('　あ め　', ['あめ']));
check('半角カタカナ「ｱﾒ」を正解にできる', isCorrect('ｱﾒ', ['あめ']));
check('「りんご」と「リンゴ」と「林檎」が通る', ['りんご', 'リンゴ', '林檎'].every((a) => isCorrect(a, ['りんご', '林檎'])));
check('不正解「ゆき」は通らない', !isCorrect('ゆき', ['あめ', '雨']));
check('空入力は通らない', !isCorrect('', ['あめ']) && !isCorrect('   ', ['あめ']));
check('正規化: 「ガ」→「が」', normalizeAnswer('カガミ') === 'かがみ');

// --- 距離・到着判定 ---
const a = { lat: 35.0, lng: 135.0 };
check('同一地点の距離は0', distanceM(a, a) === 0);
// 緯度0.001度 ≒ 111m
const d = distanceM(a, { lat: 35.001, lng: 135.0 });
check(`緯度0.001度は約111m（実測 ${d.toFixed(1)}m）`, d > 108 && d < 114);
const spot = { name: 't', description: '', lat: 35.0, lng: 135.0, radiusM: 80 };
check('座標ありを検出', hasCoords(spot));
check('半径内（約55m）は到着', isArrived(spot as never, { lat: 35.0005, lng: 135.0 }, 10).arrived);
check('半径外（約222m）は未到着', !isArrived(spot as never, { lat: 35.002, lng: 135.0 }, 10).arrived);
check(
  '精度が悪いときは最大50m分ゆとり（約111m・精度100m→到着）',
  isArrived(spot as never, { lat: 35.001, lng: 135.0 }, 100).arrived,
);
check(
  'ゆとりは50mまで（約167m・精度1000m→未到着）',
  !isArrived(spot as never, { lat: 35.0015, lng: 135.0 }, 1000).arrived,
);

// --- ストーリーデータの整合性 ---
check('ステージが1つ以上ある', STORY.stages.length > 0);
STORY.stages.forEach((stage, i) => {
  check(`ステージ${i + 1}「${stage.title}」に答えがある`, stage.answers.length > 0);
  check(`ステージ${i + 1}にヒントが1つ以上ある`, stage.hints.length > 0);
  check(
    `ステージ${i + 1}は自分の答えを正解と判定できる`,
    stage.answers.every((ans) => isCorrect(ans, stage.answers)),
  );
});
const last = STORY.stages[STORY.stages.length - 1];
check('最終ステージ以外は欠片を持つ', STORY.stages.slice(0, -1).every((s) => s.piece !== null));
check('最終ステージは欠片を持たない', last.piece === null);

// 欠片を集めた順 = 最終答えの文字順 になっているか
const collected = STORY.stages.map((s) => s.piece).filter((p): p is string => p !== null);
check('集めた欠片をつなぐと最終回答になる', isCorrect(collected.join(''), last.answers));
check(
  '並べ替え用の欠片は、集めた欠片と同じ文字の集合',
  [...STORY.scrambledPieces].sort().join('') === [...collected].sort().join(''),
);
check('並べ替え用の欠片は、集めた順と違う並びになっている', STORY.scrambledPieces.join('') !== collected.join(''));

// 各ステージの答えの頭文字が、欠片と一致しているか
STORY.stages.slice(0, -1).forEach((s, i) => {
  const first = normalizeAnswer(s.answers[0])[0];
  check(`ステージ${i + 1}の答えの頭文字「${first}」が欠片「${s.piece}」と一致`, first === s.piece);
});

console.log(failed === 0 ? '\nすべて合格' : `\n${failed} 件の失敗`);
if (failed > 0) throw new Error(`${failed} checks failed`);
