// 日常謎：カサナリアで汚れてしまった、誰かの大切なものを、その場で直す短い謎（仮の内容）

export type DailyItem = {
  id: string;
  name: string;
  owner: string;
  /** くすんだ品物の説明（物語） */
  story: string;
  question: string;
  answers: string[];
  hints: [string, string, string];
  /** 直ったときに、持ち主の想いが分かる文章 */
  restored: string;
};

export const DAILY_ITEMS: DailyItem[] = [
  {
    id: 'd1',
    name: 'くすんだ置き手紙',
    owner: '仕事で帰りが遅い、お母さん',
    story:
      'テーブルの上に置かれた、一枚のメモ。ゆがみのせいで、大事な一語だけが黒くにごって、読めなくなっている。',
    question:
      '『おかえり。机の上に □□□□□ を置いてあるから、あたためて食べてね。\nごはんを、ふわふわの黄色い卵で包んで、赤いソースで「がんばれ」って書いておいたよ。』\n\n□に入る、ひらがな5文字の料理を答えよ。',
    answers: ['おむらいす', 'オムライス'],
    hints: [
      '手がかりは「ごはん」「ふわふわの黄色い卵」「赤いソース」。',
      'ごはんを卵で包んだ料理。赤いソースは、ケチャップ。',
      '「お」ではじまる、洋食の定番。',
    ],
    restored:
      'メモの文字が、あたたかい色に戻った。\n\n「がんばれ」の文字は、ケチャップで書かれていた。言葉にするのが苦手なお母さんの、精一杯の応援だった。',
  },
  {
    id: 'd2',
    name: 'にごった傘',
    owner: '雨の日に、傘を貸してくれた同僚',
    story:
      '持ち手が少し曲がった、一本の傘。広げようとしても、ゆがみにからまって、開かない。傘の柄に、貼り紙がついている。',
    question:
      '『返しそびれてごめん。あの日の雨は、強かった。\n駅から家まで、あなたが貸してくれたこの傘のおかげで、肩がぬれなかった。\nお礼の言葉は、なんて言えばいいか分からなくて、ずっと言えないまま。』\n\nこの貼り紙を書いた人が、言えなかった一言を、ひらがな5文字で答えよ。',
    answers: ['ありがとう', '有難う'],
    hints: [
      '貼り紙の最後の行に、答えがかくれている。',
      '「お礼の言葉」。人に感謝するときに言う、いちばん身近な言葉。',
      '「あ」ではじまり、「う」でおわる。',
    ],
    restored:
      '傘が、ぱっと開いた。\n\n返せなかったのは、傘ではなくて、お礼の言葉のほうだった。にごりがとけて、傘は、雨上がりの空の色になった。',
  },
  {
    id: 'd3',
    name: '止まった腕時計',
    owner: '毎日、孫を迎えにいっていた、おじいちゃん',
    story:
      '文字盤がくもって、針が止まっている腕時計。裏ぶたに、おじいちゃんの字で、小さなメモが刻まれている。',
    question:
      '『孫の小学校の、下校のチャイムは 15時15分。\n早めに着いて、校門で待つのが日課。いつも、チャイムの 10分前 に着いた。』\n\nおじいちゃんが校門に着く時刻は、何時何分？\n（15時5分 なら「1505」と、数字4けたで答える）',
    answers: ['1505', '15:05', '15時5分', '15時05分', '3時5分'],
    hints: [
      'チャイムは 15時15分。そこから 10分 さかのぼる。',
      '15時15分の10分前は、15時5分。',
      '数字4けたで「1505」。',
    ],
    restored:
      '針が、かちり、と動いた。\n\n時計が止まっていたのは、あの時刻に、いちばん大切な待ち時間があったから。止まった針は、ゆっくりと、いまの時間に重なった。',
  },
];

const KEY = 'machi-nazo:daily:v1';

export function loadDailyDone(): string[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as unknown;
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function saveDailyDone(ids: string[]): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    // 保存できなくても続けられる
  }
}
