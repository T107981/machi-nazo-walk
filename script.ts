// story.ts の文章（空行で段落を区切ったもの）を、会話画面用の「1行ずつのセリフ」に変換する

export type Speaker = 'mio' | 'unknown' | 'system' | null;

export type Line = {
  speaker: Speaker;
  text: string;
};

/**
 * 段落ごとに分ける。
 *  『…』で囲まれた段落 → bracketSpeaker のセリフ
 *  《…》で囲まれた段落 → システム表示（アイテム取得など）
 *  それ以外           → 地の文
 */
export function toLines(text: string, bracketSpeaker: Speaker): Line[] {
  return text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p !== '')
    .map((p): Line => {
      const talk = p.match(/^『([\s\S]*)』$/);
      if (talk) return { speaker: bracketSpeaker, text: talk[1] };
      if (/^《[\s\S]*》$/.test(p)) return { speaker: 'system', text: p };
      return { speaker: null, text: p };
    });
}

export function speakerName(speaker: Speaker): string | null {
  if (speaker === 'mio') return 'ミオ';
  if (speaker === 'unknown') return '？？？';
  return null;
}
