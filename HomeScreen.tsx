import { useState } from 'react';
import type { GameState, Story } from './types';
import { Skyline } from './Skyline';
import { NOTICES, HELP_ITEMS } from './home-data';
import { track } from './analytics';

type Props = {
  story: Story;
  resume: GameState | null;
  /** 最初から（または初めて）物語を始める */
  onStartNew: () => void;
  onResume: () => void;
  onBack: () => void;
};

type View = 'home' | 'notice' | 'cards' | 'supply' | 'help';

/** 補正者の端末のホーム画面 */
export function HomeScreen({ story, resume, onStartNew, onResume, onBack }: Props) {
  const [view, setView] = useState<View>('home');
  const [asked, setAsked] = useState(false);
  const total = story.stages.length;
  const cleared = resume ? resume.stageIndex + (resume.solved ? 1 : 0) : 0;
  const hasCard = resume?.clearedAt != null;

  function open(next: View) {
    track('home_tile', { tile: next });
    setView(next);
  }

  return (
    <main className="screen home">
      <div className="hm-hero">
        <Skyline />
        <div className="hm-status">
          <span className="hm-terminal">ADJUSTER TERMINAL</span>
          <span className="hm-code">ナナシ（仮）</span>
        </div>
      </div>

      {view === 'home' && (
        <>
          <section className="hm-main" aria-label="メインストーリー">
            <p className="hm-tag">MAIN STORY</p>
            <h2 className="hm-ep">
              {story.episode}『{story.title}』
            </h2>
            <ol className="dots" aria-label={`進み具合 ${cleared} / ${total}`}>
              {story.stages.map((s, i) => (
                <li key={s.id} className={i < cleared ? 'done' : i === cleared ? 'current' : ''} />
              ))}
            </ol>
            {resume ? (
              <div className="actions">
                <button type="button" className="btn primary" onClick={onResume}>
                  {resume.clearedAt ? 'クリア画面を見る' : `つづきから（${cleared}/${total}）`}
                </button>
                <button type="button" className="btn ghost" onClick={onStartNew}>
                  はじめから
                </button>
              </div>
            ) : (
              <button type="button" className="btn primary" onClick={onStartNew}>
                通信に応答する
              </button>
            )}
          </section>

          <div className="hm-grid">
            <button type="button" className="hm-tile" onClick={() => open('notice')}>
              <span className="hm-tile-ico">◈</span>
              <span className="hm-tile-name">お知らせ</span>
              <span className="hm-badge">{NOTICES.length}</span>
            </button>
            <button type="button" className="hm-tile" onClick={() => open('cards')}>
              <span className="hm-tile-ico">▣</span>
              <span className="hm-tile-name">キーカード</span>
              <span className="hm-sub">{hasCard ? '1 / ?' : '0 / ?'}</span>
            </button>
            <button type="button" className="hm-tile" onClick={() => open('supply')}>
              <span className="hm-tile-ico">⬡</span>
              <span className="hm-tile-name">補給</span>
              <span className="hm-sub">アイテム回復</span>
            </button>
            <button type="button" className="hm-tile" onClick={() => open('help')}>
              <span className="hm-tile-ico">？</span>
              <span className="hm-tile-name">ヘルプ</span>
              <span className="hm-sub">遊び方・安全</span>
            </button>
          </div>

          <button type="button" className="link" onClick={onBack}>
            ← タイトルへ
          </button>
        </>
      )}

      {view !== 'home' && (
        <section className="card hm-panel">
          <button type="button" className="link" onClick={() => setView('home')}>
            ← ホームへ
          </button>

          {view === 'notice' && (
            <>
              <h2>お知らせ</h2>
              <ul className="hm-list">
                {NOTICES.map((n) => (
                  <li key={n.id}>
                    <p className="muted small">{n.date}</p>
                    <p className="hm-li-title">{n.title}</p>
                    <p className="small">{n.body}</p>
                  </li>
                ))}
              </ul>
            </>
          )}

          {view === 'cards' && (
            <>
              <h2>キーカード</h2>
              <p className="muted small">各話の終わりに残るカードです。集めると、何かが分かるかもしれません。</p>
              <ul className="hm-cards">
                <li className={hasCard ? 'got' : ''}>
                  <span className="hm-card-no">{hasCard ? story.cardNo : 'No.???'}</span>
                  <span className="hm-card-title">{hasCard ? story.card : '？？？'}</span>
                  {hasCard && <span className="muted small">刻印：{story.cardEngraving}</span>}
                </li>
                <li>
                  <span className="hm-card-no">No.002</span>
                  <span className="hm-card-title">？？？</span>
                  <span className="badge">COMING SOON</span>
                </li>
              </ul>
            </>
          )}

          {view === 'supply' && (
            <>
              <h2>補給</h2>
              <p className="muted small">アイテムの回復や、チケットの購入ができる予定の場所です。</p>
              <div className="ticket">
                <div className="ticket-head">
                  <p className="ticket-name">補給パック</p>
                  <p className="points">
                    <span className="muted small">所持</span> 0 pt
                  </p>
                </div>
                <p className="muted small">いまは準備中です。お金はかかりません。</p>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => {
                    setAsked(true);
                    track('supply_interest', { story_id: story.id });
                  }}
                >
                  補給する
                </button>
                {asked && (
                  <p className="feedback" role="status">
                    この機能は準備中です。ご意見ありがとうございます！
                  </p>
                )}
              </div>
            </>
          )}

          {view === 'help' && (
            <>
              <h2>ヘルプ</h2>
              <ul className="hm-list">
                {HELP_ITEMS.map((h) => (
                  <li key={h.q}>
                    <p className="hm-li-title">{h.q}</p>
                    <p className="small">{h.a}</p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}
    </main>
  );
}
