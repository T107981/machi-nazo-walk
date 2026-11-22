import { useState, type KeyboardEvent } from 'react';
import { speakerName, type Line } from './script';

type Props = {
  lines: Line[];
  onDone: () => void;
};

/**
 * 立ち絵（いまは仮のシルエット）と、タップで進む会話画面。
 * 立ち絵の画像ができたら、Portrait の中身を <img> に差し替えるだけで使える。
 */
function Portrait({ speaker }: { speaker: 'mio' | 'unknown' }) {
  return (
    <div className={`portrait ${speaker}`} aria-hidden="true">
      <svg viewBox="0 0 200 260" role="img">
        <circle cx="100" cy="85" r="46" />
        <path d="M20 260 C20 180 60 150 100 150 C140 150 180 180 180 260 Z" />
      </svg>
    </div>
  );
}

export function DialogueScreen({ lines, onDone }: Props) {
  const [index, setIndex] = useState(0);
  const line = lines[index];
  const isLast = index >= lines.length - 1;

  function advance() {
    if (isLast) onDone();
    else setIndex((i) => i + 1);
  }

  function handleKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      advance();
    }
  }

  if (!line) return null;
  const name = speakerName(line.speaker);
  const isTalk = line.speaker === 'mio' || line.speaker === 'unknown';

  return (
    <main
      className="dlg"
      role="button"
      tabIndex={0}
      aria-label="タップで次へ"
      onClick={advance}
      onKeyDown={handleKey}
    >
      <button
        type="button"
        className="dlg-skip"
        onClick={(e) => {
          e.stopPropagation();
          onDone();
        }}
      >
        スキップ
      </button>

      <div className="dlg-stage">
        {isTalk && <Portrait speaker={line.speaker as 'mio' | 'unknown'} />}
      </div>

      <div className={`dlg-box ${line.speaker === 'system' ? 'system' : ''}`}>
        {name && <p className="dlg-name">{name}</p>}
        <p key={index} className={`dlg-text multiline ${line.speaker === null ? 'narr' : ''}`}>
          {line.text}
        </p>
        <p className="dlg-next" aria-hidden="true">
          {isLast ? '▶ つぎへ' : '▼'}
        </p>
      </div>
    </main>
  );
}
