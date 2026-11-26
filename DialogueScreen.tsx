import { useState, type KeyboardEvent } from 'react';
import { speakerName, type Line, type Speaker } from './script';

type Props = {
  lines: Line[];
  /** これより前の会話（ログで見返せる） */
  history?: Line[];
  onDone: () => void;
};

/**
 * 立ち絵（いまは仮のシルエット）と、タップで進む会話画面。
 * 立ち絵の画像ができたら、Portrait の中身を <img> に差し替えるだけで使える。
 *  リュカ … 画面の中央に浮かぶ妖精
 *  ミオ   … 通信窓（右上の小さな丸い窓）
 */
function Portrait({ speaker }: { speaker: Exclude<Speaker, null | 'system'> }) {
  if (speaker === 'mio') {
    return (
      <div className="comm" aria-hidden="true">
        <svg viewBox="0 0 100 100">
          <circle cx="50" cy="38" r="17" />
          <path d="M14 100 C14 70 32 58 50 58 C68 58 86 70 86 100 Z" />
        </svg>
        <span className="comm-label">通信</span>
      </div>
    );
  }
  if (speaker === 'ryuka') {
    return (
      <div className="portrait ryuka" aria-hidden="true">
        <svg viewBox="0 0 200 200">
          <ellipse cx="56" cy="70" rx="26" ry="40" transform="rotate(-25 56 70)" />
          <ellipse cx="144" cy="70" rx="26" ry="40" transform="rotate(25 144 70)" />
          <circle cx="100" cy="116" r="54" />
        </svg>
      </div>
    );
  }
  return (
    <div className="portrait unknown" aria-hidden="true">
      <svg viewBox="0 0 200 260">
        <circle cx="100" cy="85" r="46" />
        <path d="M20 260 C20 180 60 150 100 150 C140 150 180 180 180 260 Z" />
      </svg>
    </div>
  );
}

export function DialogueScreen({ lines, history = [], onDone }: Props) {
  const [index, setIndex] = useState(0);
  const [showLog, setShowLog] = useState(false);
  const line = lines[index];
  const isLast = index >= lines.length - 1;

  function advance() {
    if (showLog) return;
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
  const isTalk = line.speaker === 'mio' || line.speaker === 'ryuka' || line.speaker === 'unknown';
  // ここまでに読んだ会話（前の場面 + いまの場面の、いまの1つ前まで）
  const past = [...history, ...lines.slice(0, index)];

  return (
    <main
      className="dlg"
      role="button"
      tabIndex={0}
      aria-label="タップで次へ"
      onClick={advance}
      onKeyDown={handleKey}
    >
      <div className="dlg-top">
        <button
          type="button"
          className="dlg-btn"
          onClick={(e) => {
            e.stopPropagation();
            setShowLog(true);
          }}
        >
          ログ
        </button>
        <button
          type="button"
          className="dlg-btn"
          onClick={(e) => {
            e.stopPropagation();
            onDone();
          }}
        >
          スキップ
        </button>
      </div>

      <div className="dlg-stage">
        {isTalk && <Portrait speaker={line.speaker as Exclude<Speaker, null | 'system'>} />}
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

      {showLog && (
        <div
          className="dlg-log"
          role="dialog"
          aria-label="会話ログ"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="dlg-log-head">
            <p className="label">これまでの会話</p>
            <button type="button" className="dlg-btn" onClick={() => setShowLog(false)}>
              閉じる
            </button>
          </div>
          <ul className="dlg-log-list" ref={(el) => el?.scrollTo({ top: el.scrollHeight })}>
            {past.length === 0 && <li className="muted small">まだ会話はありません。</li>}
            {past.map((l, i) => (
              <li key={i} className={l.speaker === null ? 'narr' : ''}>
                {speakerName(l.speaker) && <span className="log-name">{speakerName(l.speaker)}</span>}
                <span className="multiline">{l.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
