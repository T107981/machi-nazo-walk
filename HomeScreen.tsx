import { useState } from 'react';
import type { GameState, Story } from './types';
import kv from './kv.jpg';
import { NOTICES, HELP_ITEMS } from './home-data';
import { track } from './analytics';

type Props = {
  story: Story;
  resume: GameState | null;
  /** 最初から（または初めて）物語を始める */
  onStartNew: () => void;
  onResume: () => void;
  onBack: () => void;
  /** 登録済みのコードネーム（未登録は null） */
  codename: string | null;
  onEditName: () => void;
  /** 通勤補正モードを開く（第1話クリアで解放） */
  onCommute: () => void;
};

type View = 'home' | 'notice' | 'cards' | 'supply' | 'help';

/** 補正者の端末のホーム画面 */
export function HomeScreen({ story, resume, onStartNew, onResume, onBack, codename, onEditName, onCommute }: Props) {
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
        <img className="hm-kv" src={kv} alt="" />
        <div className="hm-status">
          <span className="hm-terminal">KASANARIA</span>
          <button type="button" className="hm-code" onClick={onEditName} aria-label="コードネームを変更">
            {codename ?? '未登録'}　✎
          </button>
        </div>
      </div>

      {view === 'home' && (
        <>
          <section className="hm-main" aria-label="メインストーリー">
            <p className="hm-tag">MAIN STORY</p>
            <ul className="hm-eps">
              <li className="hm-ep-row">
                <div>
                  <p className="hm-ep-no">{story.episode}</p>
                  <p className="hm-ep">{story.title}</p>
                </div>
                {resume?.clearedAt ? (
                  <button type="button" className="btn secondary hm-ep-btn" onClick={onResume}>
                    クリア済み
                  </button>
                ) : resume ? (
                  <button type="button" className="btn primary hm-ep-btn" onClick={onResume}>
                    つづきから（{cleared}/{total}）
                  </button>
                ) : (
                  <button type="button" className="btn primary hm-ep-btn" onClick={onStartNew}>
                    はじめる
                  </button>
                )}
              </li>
              <li className="hm-ep-row soon">
                <div>
                  <p className="hm-ep-no">第2話</p>
                  <p className="hm-ep">？？？</p>
                </div>
                <span className="badge">COMING SOON</span>
              </li>
            </ul>
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

          <button
            type="button"
            className={`hm-tile hm-wide ${hasCard ? '' : 'locked'}`}
            disabled={!hasCard}
            onClick={() => {
              track('home_tile', { tile: 'commute' });
              onCommute();
            }}
          >
            <span className="hm-tile-ico">⇄</span>
            <span className="hm-tile-name">活動範囲</span>
            <span className="hm-sub">
              {hasCard ? 'いつもの区間で遊べる、短い補正' : '第1話をクリアすると解放されます'}
            </span>
          </button>

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
