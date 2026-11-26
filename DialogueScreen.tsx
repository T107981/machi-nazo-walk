import { useEffect, useState, type KeyboardEvent } from 'react';
import { speakerName, type Line, type Speaker } from './script';
import ryukaImg from './ryuka.webp';
import { arConfirmed, arPreferred, rememberArConfirmed, useCameraBg } from './useAR';

type Props = {
  lines: Line[];
  /** これより前の会話（ログで見返せる） */
  history?: Line[];
  onDone: () => void;
};

/**
 * 立ち絵と、タップで進む会話画面。
 *  リュカ … 画面の中央に浮かぶ妖精（画像）
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
        <img src={ryukaImg} alt="" />
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
  const [askAr, setAskAr] = useState(false);
  const ar = useCameraBg();
  const { start: arStart } = ar;

  // 前回ARをオンにしていたら、続けてオンにする
  useEffect(() => {
    if (arPreferred() && arConfirmed()) void arStart();
  }, [arStart]);
  const line = lines[index];
  const isLast = index >= lines.length - 1;

  function advance() {
    if (showLog || askAr) return;
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
      {ar.on && (
        <>
          <video ref={ar.videoRef} className="dlg-video" playsInline muted autoPlay />
          <div className="dlg-video-shade" aria-hidden="true" />
        </>
      )}

      <div className="dlg-top">
        <button
          type="button"
          className={`dlg-btn ${ar.on ? 'on' : ''}`}
          aria-pressed={ar.on}
          onClick={(e) => {
            e.stopPropagation();
            if (ar.on) ar.stop();
            else if (arConfirmed()) void ar.start();
            else setAskAr(true);
          }}
        >
          AR {ar.on ? 'ON' : 'OFF'}
        </button>
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
        {isTalk && (
          <div
            className="ar-anchor"
            style={ar.on ? { transform: `translate(${ar.offset.x}px, ${ar.offset.y}px)` } : undefined}
          >
            <Portrait speaker={line.speaker as Exclude<Speaker, null | 'system'>} />
          </div>
        )}
      </div>

      {ar.error && <p className="dlg-toast" role="status">{ar.error}</p>}

      {askAr && (
        <div className="dlg-ask" role="dialog" aria-label="ARを使う前に" onClick={(e) => e.stopPropagation()}>
          <p className="label">ARを使う前に</p>
          <ul className="notes small">
            <li>カメラとスマホの向きのセンサーを使います。映像は、画面に表示するだけで、保存も送信もしません。</li>
            <li>歩きながら使わないでください。人にカメラを向けないでください。</li>
          </ul>
          <div className="actions">
            <button
              type="button"
              className="btn primary"
              onClick={() => {
                rememberArConfirmed();
                setAskAr(false);
                void ar.start();
              }}
            >
              ARをオンにする
            </button>
            <button type="button" className="btn ghost" onClick={() => setAskAr(false)}>
              やめる
            </button>
          </div>
        </div>
      )}

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
