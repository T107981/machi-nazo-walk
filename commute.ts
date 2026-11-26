// 活動範囲モード：いつもの区間の登録と、「今日の補正」の中身を作る
// 駅名・区間は、この端末の中だけに保存する（サーバーや計測には送らない）

export type Route = {
  from: string;
  to: string;
  via: string[];
};

export type CommuteSave = {
  route: Route | null;
  stamps: number;
  lastDone: string | null;
  /** 途中下車して助けた「想い」の数 */
  feelings: number;
};

const KEY = 'machi-nazo:commute:v1';
export const STATION_MAX = 10;
export const VIA_MAX = 3;

export function chars(text: string): string[] {
  return Array.from(text);
}

/** 駅名を整える（空白除去・末尾の「駅」を外す・長さ制限） */
export function cleanStation(raw: string): string {
  let s = raw.normalize('NFKC').replace(/\s+/g, '');
  if (chars(s).length > 1 && s.endsWith('駅')) s = s.slice(0, -1);
  return chars(s).slice(0, STATION_MAX).join('');
}

/** 「、」「,」「スペース」で区切った途中駅を配列にする */
export function parseVia(raw: string): string[] {
  return raw
    .split(/[、,，\n]+|\s{1,}/)
    .map(cleanStation)
    .filter((s) => s !== '')
    .slice(0, VIA_MAX);
}

export function loadCommute(): CommuteSave {
  const empty: CommuteSave = { route: null, stamps: 0, lastDone: null, feelings: 0 };
  try {
    if (typeof localStorage === 'undefined') return empty;
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty;
    const p = JSON.parse(raw) as Partial<CommuteSave>;
    const r = p.route;
    const route =
      r && typeof r.from === 'string' && typeof r.to === 'string' && Array.isArray(r.via)
        ? { from: cleanStation(r.from), to: cleanStation(r.to), via: r.via.map(String).map(cleanStation).slice(0, VIA_MAX) }
        : null;
    return {
      route: route && route.from && route.to ? route : null,
      stamps: typeof p.stamps === 'number' && p.stamps >= 0 ? Math.floor(p.stamps) : 0,
      lastDone: typeof p.lastDone === 'string' ? p.lastDone : null,
      feelings: typeof p.feelings === 'number' && p.feelings >= 0 ? Math.floor(p.feelings) : 0,
    };
  } catch {
    return empty;
  }
}

export function saveCommute(data: CommuteSave): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // 保存できなくても続けられる
  }
}

/** 端末の日付（YYYY-MM-DD）。日付が変わると、新しい「今日の補正」になる */
export function todayKey(d: Date = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function dayIndex(d: Date): number {
  return Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 86400000);
}

export type Mission =
  | { kind: 'puzzle'; id: string; title: string; text: string; answer: string; hint: string }
  | { kind: 'watch'; id: string; title: string; text: string };

type PuzzleMaker = (r: Route) => { id: string; title: string; text: string; answer: string; hint: string };

const first = (s: string) => chars(s)[0] ?? '';
const last = (s: string) => chars(s).slice(-1)[0] ?? '';

const PUZZLES: PuzzleMaker[] = [
  (r) => ({
    id: 'sum',
    title: '駅名の長さ',
    text: `乗る駅「${r.from}」と、降りる駅「${r.to}」。\n二つの駅名の文字数を、たすといくつ？（数字で）`,
    answer: String(chars(r.from).length + chars(r.to).length),
    hint: `「${r.from}」は${chars(r.from).length}文字。「${r.to}」の文字数をたそう。`,
  }),
  (r) => ({
    id: 'fl',
    title: '出発と到着',
    text: `「${r.from}」の1文字目と、「${r.to}」の最後の文字を、この順に並べて答えよ。`,
    answer: first(r.from) + last(r.to),
    hint: `1文字目は「${first(r.from)}」。`,
  }),
  (r) => ({
    id: 'lf',
    title: '駅から駅へ',
    text: `「${r.from}」の最後の文字と、「${r.to}」の1文字目を、この順に並べて答えよ。`,
    answer: last(r.from) + first(r.to),
    hint: `最後の文字は「${last(r.from)}」。`,
  }),
  (r) => {
    const all = [r.from, ...r.via, r.to];
    return {
      id: 'heads',
      title: '駅名の頭文字',
      text: `${all.map((s) => `「${s}」`).join('→')}\n駅を乗る順に、それぞれの1文字目を並べて答えよ。`,
      answer: all.map(first).join(''),
      hint: `最初の文字は「${first(r.from)}」。`,
    };
  },
  (r) => ({
    id: 'diff',
    title: '駅名の差',
    text: `「${r.from}」と「${r.to}」。\n二つの駅名の文字数の差は、いくつ？（同じなら0。数字で）`,
    answer: String(Math.abs(chars(r.from).length - chars(r.to).length)),
    hint: `「${r.from}」は${chars(r.from).length}文字。`,
  }),
];

const WATCHES: Array<{ id: string; title: string; text: string }> = [
  { id: 'w1', title: '赤を探す', text: '車内で、赤い文字か赤い色のものを見つけよう。見つけたら、ボタンを押してね。' },
  { id: 'w2', title: '丸いもの', text: '車内にある「丸いもの」を、3つ探そう。（吊り革、広告の丸い図形など）' },
  { id: 'w3', title: '路線図', text: 'ドアの上の路線図や、駅名の表示を見て、いまの駅の名前を確認しよう。' },
  { id: 'w4', title: '同じ色', text: '車内で、同じ色のものが3つ並んでいる場所を探そう。' },
  { id: 'w5', title: '文字を探す', text: '広告やポスターの中から、ひらがなだけの言葉を1つ見つけよう。' },
  { id: 'w6', title: '光と影', text: '窓から入る光で、車内にできている影を探そう。見つけたらボタンを押してね。' },
];

/** 今日の補正（謎 → 車内ミッション → 謎 の3つ）。日付で内容が変わる */
export function buildToday(route: Route, d: Date = new Date()): Mission[] {
  const n = dayIndex(d);
  const a = PUZZLES[n % PUZZLES.length](route);
  const b = PUZZLES[(n + 2) % PUZZLES.length](route);
  const w = WATCHES[n % WATCHES.length];
  return [
    { kind: 'puzzle', ...a },
    { kind: 'watch', ...w },
    { kind: 'puzzle', ...b },
  ];
}

/** 途中下車の提案に使う駅を、登録した駅のなかからランダムに選ぶ */
export function pickOfferStation(route: Route, rnd: () => number = Math.random): string {
  const all = [route.from, ...route.via, route.to];
  return all[Math.floor(rnd() * all.length)];
}

export type SubPuzzle = {
  title: string;
  question: string;
  answers: string[];
  hints: [string, string, string];
};

export type SubStory = {
  title: string;
  /** 降りたところから、謎1の前まで */
  intro: string;
  p1: SubPuzzle;
  /** 謎1と謎2のあいだ */
  mid: string;
  p2: SubPuzzle;
  outro: string;
};

/**
 * 途中下車したときのサブストーリー（助けた人の想い）。
 * 「降りない」より長く、謎を2つ解く。{station} は降りた駅、{name} はコードネームに置きかわる。
 */
export const SUB_STORIES: SubStory[] = [
  {
    title: 'ベンチの伝言',
    intro:
      'ミオ『{station}のホームに、ゆがみ反応。……ごく小さいけど、中の想いは、かなり長く積もってる』\n\nベンチの端に、小さな光のゆがみがあった。その中から、かすかな声がする。\n\n「毎朝、同じ電車で会う人がいる。話しかけたいけど、『あとで』って思い続けて、もう半年」\n\nリュカ『半年分の「あとで」か。そりゃ、にごるわけだ』\n\nリュカ『{name}、まず光の文字を読め。この手の想いは、言葉が一つずつ、ずれて固まってる』',
    p1: {
      title: '光の文字',
      question: '光の文字が、ぜんぶ「五十音順で、ひとつ先」にずれている。\n\n　かひらえ\n\n元の言葉に戻せ。（ひらがな4文字）',
      answers: ['おはよう'],
      hints: [
        '「ひとつ先」にずれているなら、「ひとつ前」の文字に戻す。',
        '「か」のひとつ前は「お」。',
        '朝に言う、あいさつの言葉。',
      ],
    },
    mid:
      '光の中の声が、少しだけはっきりした。\n\n「……そう。おはよう、って言いたいだけなのに」\n\nミオ『でも、いつ言えばいいか、本人も分からないのね。——その人が毎朝乗る電車の時刻、手がかりがあるみたい』\n\nリュカ『声の記憶に、時刻が残ってる。解いて、聞いてやれ』',
    p2: {
      title: '毎朝の電車',
      question:
        '光の記憶から、その人が乗る電車の時刻が読みとれる。\n\n①7時台の電車\n②「分」は2けたの数で、十の位は、一の位の2倍\n③十の位と一の位を足すと、6\n\n何時何分の電車？\n（7時15分 なら「715」と、数字3けたで答える）',
      answers: ['742', '7時42分', '7:42', '07:42'],
      hints: [
        '十の位を□、一の位を○とすると、□は○の2倍。□＋○＝6。',
        '○を決めて試す。○＝2なら、□＝4。',
        '7時42分。数字3けたで「742」。',
      ],
    },
    outro:
      '{name}は、光に向かって言った。「明日の7時42分、あの人にいちばんに言うのは、『おはよう』だよ」\n\nゆがみは、朝の光のようにほどけて、消えた。\n\nリュカ『ひとこと言う練習、終わりだな！』\n\nミオ『ありがとう。きっと明日、誰かが「おはよう」って言える。……あなたも、今日は誰かに言ってみたら？』',
  },
  {
    title: '改札の落とし物',
    intro:
      'リュカ『おい、{name}。{station}の改札のそばだ。にごった気持ちが、ひとつ引っかかってる』\n\n改札の脇の柱に、うすく曇った光がはりついていた。\n\n「ごめん、って言いたかった。言えないまま、あの人は引っ越してしまった」\n\nミオ『伝えられなかった言葉……。この手の想いは、放っておくと、にごりやすいの』\n\nリュカ『光の言葉が、バラバラに散ってる。まず、集めて並べるぞ』',
    p1: {
      title: 'ちらばった言葉',
      question: '光の言葉が、四つに散っている。\n\n　ね　め　ご　ん\n\n並べ替えて、あやまる言葉にせよ。（ひらがな4文字）',
      answers: ['ごめんね'],
      hints: ['「ご」ではじまり、「ね」でおわる。', 'あやまるときの言葉。', '「ごめん」に、やわらかい「ね」がつく。'],
    },
    mid:
      '光が、ふるえた。\n\n「ごめん、って言いたかった。……でも、もう一つ、ある。ちゃんと、見送れなかったから」\n\nミオ『もう一つ、言葉が隠れてる。数字の暗号みたい』\n\nリュカ『表の読み方を、よく見ろよ。暗号は、ルールが分かれば、ただの数字だ』',
    p2: {
      title: '数字の暗号',
      question:
        '光の中に、数字が浮かんでいる。\n\n　31　85　51　91\n\n数字は、五十音の表の場所を表している。\n　十の位：行（1=あ行 2=か行 3=さ行 4=た行 5=な行 6=は行 7=ま行 8=や行 9=ら行）\n　一の位：段（1=あ段 2=い段 3=う段 4=え段 5=お段）\n\n例：「21」は「か行のあ段」で「か」\n\nできた言葉を答えよ。（ひらがな4文字）',
      answers: ['さよなら'],
      hints: [
        '一つずつ読む。「31」は、さ行のあ段。',
        '「85」は、や行のお段。や行は「や・ゆ・よ」。',
        '「さ」「よ」「な」「ら」。別れのときの言葉。',
      ],
    },
    outro:
      '{name}は、光に向かって、静かに言った。「ちゃんと、届いてるよ」\n\n曇りが晴れて、光は、きれいな白にもどった。\n\nリュカ『言えなかった「ごめんね」と「さよなら」。ちゃんと受けとってもらえれば、軽くなるんだ』\n\nミオ『……よく解いたわね。ありがとう』',
  },
  {
    title: 'ホームの夕焼け',
    intro:
      'ミオ『{station}の反対側のホームに、やわらかいゆがみ。危険はなさそう。……でも、中の想いは、三人分あるみたい』\n\nホームの端で、夕焼け色の光がゆれている。\n\n「昔、ここで、友だちと見た景色が好きだった。もう一度、見たいなって思ってるだけなんだ」\n\nリュカ『ただの「また見たい」だ。ただな、景色の記憶がバラバラで、組み立てないと、ほどけねえ』',
    p1: {
      title: '景色のなぞなぞ',
      question:
        '光の記憶の、最初のかけらは、なぞなぞになっている。\n\n『夕方、西の空でしずんでいく。\n赤くて、まるい。\n毎日、同じ時間に、さよならを言ってくれる。』\n\nこたえは、ひらがな3文字。',
      answers: ['ゆうひ', '夕日', '夕陽'],
      hints: ['時間は「夕方」。空にあるもの。', '朝にのぼる「あさひ」の、反対。', '「ゆ」ではじまる3文字。'],
    },
    mid:
      '光が、ひとつ、明るくなった。\n\n「そう、夕日。あの日は、三人で並んで見たんだ」\n\nミオ『三人……。並び順が、思い出せないのね』\n\nリュカ『並び順を当てれば、景色が完成する。条件を、よく読め』',
    p2: {
      title: '並んだ三人',
      question:
        '三人（ア・イ・ウ）が、一列に並んで夕日を見ていた。\n\n①イは、いちばん左ではない\n②ウは、イより左にいる\n③アは、いちばん端ではない\n\n左から順に、並びを答えよ。（カタカナ3文字）',
      answers: ['ウアイ', 'うあい'],
      hints: ['③から、アは真ん中。', 'アが真ん中なら、残りは「ウ」と「イ」。左右どちらかに入る。', '②から、ウは左側。'],
    },
    outro:
      '三人が並んでいる景色が、はっきりと浮かんだ。\n\n{name}は、光の隣で、少しのあいだ、空を見ていた。\n\n光は、ふわりと空にのぼって、見えなくなった。\n\nリュカ『「また見たい」は、満足するまで一緒に眺めれば、消えるんだ』\n\nミオ『……ありがとう。今日も、誰かの大切な景色が、守られたね』',
  },
];

export function pickSubStory(rnd: () => number = Math.random): number {
  return Math.floor(rnd() * SUB_STORIES.length);
}
