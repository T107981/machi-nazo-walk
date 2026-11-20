export type Mode = 'anywhere';

/** 謎を解くと手に入る持ち物。あとの謎で使う */
export type Item = {
  id: string;
  name: string;
  /** 一行の説明 */
  note: string;
  /** 持ち物の中身（窓板の図、読む順番など）。改行はそのまま表示される */
  body: string;
};

export type Stage = {
  id: string;
  title: string;
  /** 場面の文章（物語）。空行で段落を分ける */
  scene: string;
  /** 目安の場所（どこでも解けるので、あくまで目安） */
  place: string;
  /** 謎の本文。改行はそのまま表示される */
  question: string;
  /** この謎で使う持ち物のid */
  uses: string[];
  /** 見せる順番のヒント */
  hints: string[];
  /** 正解として受け付ける表記 */
  answers: string[];
  /** 正解したあとの文章 */
  reveal: string;
  /** 正解で手に入る「ことばの欠片」。最終ステージは null */
  piece: string | null;
  /** 正解で手に入る持ち物 */
  item: Item | null;
};

export type Story = {
  id: string;
  title: string;
  episode: string;
  lead: string;
  stages: Stage[];
  /** クリア画面の文章（空行で段落を分ける） */
  epilogue: string;
  /** 現場に残されたカード */
  card: string;
  /** カードの通し番号（例：No.001） */
  cardNo: string;
  /** カード裏の刻印。今は意味がわからない（ずっと先の謎のキー） */
  cardEngraving: string;
  /** 次回予告 */
  next: string;
};

export type GameState = {
  storyId: string;
  /** Supabase側の行ID。未接続・失敗時は null */
  sessionId: string | null;
  mode: Mode;
  stageIndex: number;
  solved: boolean;
  hintsShown: number;
  hintsTotal: number;
  wrongTotal: number;
  startedAt: string;
  clearedAt: string | null;
};
