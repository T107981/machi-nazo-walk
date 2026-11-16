/** カタカナをひらがなに変換する（「ー」や記号はそのまま） */
function katakanaToHiragana(text: string): string {
  return text.replace(/[ァ-ヶ]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60),
  );
}

/**
 * 回答の表記ゆれをそろえる。
 * 全角/半角・大文字小文字・空白・区切り記号・カタカナ/ひらがなの違いを無視する。
 */
export function normalizeAnswer(input: string): string {
  const unified = input.normalize('NFKC').toLowerCase();
  const compact = unified.replace(/[\s・、。,.!?「」『』()\-~〜]/g, '');
  return katakanaToHiragana(compact);
}

/** 入力が、正解候補のどれかと一致するか */
export function isCorrect(input: string, answers: string[]): boolean {
  const normalized = normalizeAnswer(input);
  if (normalized === '') return false;
  return answers.some((answer) => normalizeAnswer(answer) === normalized);
}
