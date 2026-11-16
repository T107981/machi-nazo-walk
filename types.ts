export type Mode = 'geo' | 'demo';

export type Spot = {
  /** 画面に表示する場所の名前 */
  name: string;
  /** 場所の説明（実際の街に合わせて書き換える） */
  description: string;
  /** 緯度。null の間は「場所の確認なし」で進めます */
  lat: number | null;
  /** 経度。null の間は「場所の確認なし」で進めます */
  lng: number | null;
  /** 到着とみなす半径（メートル） */
  radiusM: number;
};

export type Stage = {
  id: string;
  title: string;
  /** 物語の導入文 */
  intro: string;
  spot: Spot;
  /** 謎の本文 */
  question: string;
  /** 見せる順番のヒント（最大3つ程度） */
  hints: string[];
  /** 正解として受け付ける表記（ひらがな・漢字など複数可） */
  answers: string[];
  /** 正解したあとに表示する文章（次の手がかり） */
  reveal: string;
  /** 正解で手に入る「灯りの欠片」。最終ステージは null */
  piece: string | null;
};

export type Story = {
  id: string;
  title: string;
  lead: string;
  stages: Stage[];
  /** 最終ステージで見せる、並べ替え前の欠片 */
  scrambledPieces: string[];
};

export type GameState = {
  storyId: string;
  /** Supabase側の行ID。未接続・失敗時は null */
  sessionId: string | null;
  mode: Mode;
  stageIndex: number;
  arrived: boolean;
  solved: boolean;
  hintsShown: number;
  hintsTotal: number;
  wrongTotal: number;
  startedAt: string;
  clearedAt: string | null;
};
