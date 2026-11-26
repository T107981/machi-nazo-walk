// story.ts の文章（空行で段落を区切ったもの）を、会話画面用の「1行ずつのセリフ」に変換する

export type Speaker = 'mio' | 'ryuka' | 'unknown' | 'system' | null;

export type Line = {
  speaker: Speaker;
  text: string;
};

const PREFIX: Record<string, Speaker> = {
  ミオ: 'mio',
  リュカ: 'ryuka',
  '？？？': 'unknown',
};

/**
 * 段落ごとに分ける。
 *  ミオ『…』 / リュカ『…』 / ？？？『…』 → その人のセリフ
 *  『…』だけ                              → bracketSpeaker のセリフ
 *  《…》で囲まれた段落                    → システム表示（アイテム取得など）
 *  それ以外                               → 地の文
 */
export function toLines(text: string, bracketSpeaker: Speaker = null): Line[] {
  return text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p !== '')
    .map((p): Line => {
      const talk = p.match(/^(ミオ|リュカ|？？？)?『([\s\S]*)』$/);
      if (talk) {
        const who = talk[1] ? PREFIX[talk[1]] : bracketSpeaker;
        return { speaker: who, text: talk[2] };
      }
      if (/^《[\s\S]*》$/.test(p)) return { speaker: 'system', text: p };
      return { speaker: null, text: p };
    });
}

export function speakerName(speaker: Speaker): string | null {
  if (speaker === 'mio') return 'ミオ';
  if (speaker === 'ryuka') return 'リュカ';
  if (speaker === 'unknown') return '？？？';
  return null;
}
