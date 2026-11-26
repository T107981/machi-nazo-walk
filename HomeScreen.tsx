import { useState } from 'react';
import type { GameState, Story } from './types';
import homeImg from './home.jpg';
import { NOTICES, HELP_ITEMS } from './home-data';
import { track } from './analytics';
import { BIO_MAX, ICONS, loadProfile, saveProfile } from './profile';

type Props = {
  story: Story;
  resume: GameState | null;
  onStartNew: () => void;
  onResume: () => void;
  onBack: () => void;
  codename: string | null;
  onEditName: () => void;
  onCommute: () => void;
  onDaily: () => void;
  onBigRift: () => void;
  onAR: () => void;
  dev: boolean;
  onDevClear: () => void;
  onDevWipe: () => void;
};

type View =
  | 'home' | 'notice' | 'cards' | 'shop' | 'help' | 'settings' | 'profile'
  | 'main' | 'sub' | 'multi' | 'friend' | 'items' | 'rift' | 'dev';

// ホーム画像（941×1672）の上に置くボタンの位置。[x, y, 幅, 高さ]（画像のピクセル）
type Box = [number, number, number, number];
const W = 941;
const H = 1672;
const BOX: Record<string, Box> = {
  profile: [40, 32, 194, 210],
  settings: [662, 54, 116, 72],
  notice: [787, 54, 116, 72],
  shop: [662, 136, 116, 72],
  help: [787, 136, 116, 72],
  main: [383, 947, 322, 322],
  sub: [556, 876, 152, 152],
  multi: [638, 948, 154, 150],
  area: [670, 1050, 224, 224],
  repair: [548, 1172, 224, 224],
  rift: [64, 1140, 252, 252],
  cards: [38, 1460, 207, 168],
  items: [257, 1460, 207, 168],
  friend: [477, 1460, 207, 168],
  ryuka: [695, 1460, 207, 168],
};
const DIAMOND = new Set(['main', 'sub', 'multi', 'area', 'repair']);
const ROUND = new Set(['profile', 'rift']);

function style(k: string): React.CSSProperties {
  const [x, y, w, h] = BOX[k];
  return {
    left: `${(x / W) * 100}%`,
    top: `${(y / H) * 100}%`,
    width: `${(w / W) * 100}%`,
    height: `${(h / H) * 100}%`,
  };
}

/** 補正者の端末のホーム。一枚絵の上に、ボタンを重ねています */
export function HomeScreen({ story, resume, onStartNew, onResume, onBack, codename, onEditName, onCommute, onDaily, onBigRift, onAR, dev, onDevClear, onDevWipe }: Props) {
  const [view, setView] = useState<View>('home');
  const [asked, setAsked] = useState(false);
  const [profile, setProfile] = useState(loadProfile);
  const total = story.stages.length;
  const cleared = resume ? resume.stageIndex + (resume.solved ? 1 : 0) : 0;
  const hasCard = resume?.clearedAt != null;

  function open(next: View) {
    track('home_tile', { tile: next });
    setView(next);
  }
  function go(k: string, label: string, onClick: () => void, locked = false) {
    const cls = `hh ${DIAMOND.has(k) ? 'dia' : ''} ${ROUND.has(k) ? 'rnd' : ''} ${locked ? 'locked' : ''}`;
    return (
      <button key={k} type="button" className={cls} style={style(k)} aria-label={label} aria-disabled={locked} onClick={onClick}>
        {locked && <span className="hh-lock">解放前</span>}
      </button>
    );
  }
  function updateProfile(next: typeof profile) {
    setProfile(next);
    saveProfile(next);
  }

  const mainTag = resume?.clearedAt ? 'クリア済み' : resume ? `つづきから ${cleared}/${total}` : 'NEW';

  return (
    <main className="home2" aria-label="ホーム">
      <div className="home2-bg" style={{ backgroundImage: `url(${homeImg})` }} aria-hidden="true" />
      <div className="home2-stage" style={{ backgroundImage: `url(${homeImg})` }}>
        {go('profile', 'プロフィール', () => open('profile'))}
        <span className="hh-prof" style={style('profile')} aria-hidden="true">
          <span className="hh-prof-ico">{profile.icon}</span>
          <span className="hh-prof-name">{codename ?? '未登録'}</span>
        </span>
        {go('settings', '設定', () => open('settings'))}
        {go('notice', 'お知らせ', () => open('notice'))}
        {go('shop', 'ショップ', () => open('shop'))}
        {go('help', 'ヘルプ', () => open('help'))}
        {go('main', 'メインストーリー', () => open('main'))}
        <span className="hh-tag" style={{ ...style('main'), pointerEvents: 'none' }} aria-hidden="true">{mainTag}</span>
        {go('sub', 'サブストーリー', () => open('sub'))}
        {go('multi', 'マルチプレイ', () => open('multi'))}
        {go('area', '活動エリア', onCommute, !hasCard)}
        {go('repair', '修理屋', onDaily, !hasCard)}
        {go('rift', 'ゆがみ', () => open('rift'))}
        {go('cards', 'キーカード', () => open('cards'))}
        {go('items', 'アイテム', () => open('items'))}
        {go('friend', 'フレンド', () => open('friend'))}
        {go('ryuka', 'リュカ（AR）', () => { track('home_tile', { tile: 'ar' }); onAR(); })}
        {dev && (
          <button type="button" className="hh-dev" onClick={() => open('dev')}>DEV</button>
        )}
      </div>

      {view !== 'home' && (
        <div className="hm-sheet" role="dialog" aria-modal="true" onClick={() => setView('home')}>
          <section className="card hm-panel" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="link" onClick={() => setView('home')}>
              ← ホームへ
            </button>

            {view === 'main' && (
              <>
                <h2>メインストーリー</h2>
                <ul className="hm-eps">
                  <li className="hm-ep-row">
                    <div>
                      <p className="hm-ep-no">{story.episode}</p>
                      <p className="hm-ep">{story.title}</p>
                    </div>
                    {resume?.clearedAt ? (
                      <button type="button" className="btn secondary hm-ep-btn" onClick={onResume}>クリア済み</button>
                    ) : resume ? (
                      <button type="button" className="btn primary hm-ep-btn" onClick={onResume}>つづきから（{cleared}/{total}）</button>
                    ) : (
                      <button type="button" className="btn primary hm-ep-btn" onClick={onStartNew}>はじめる</button>
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
              </>
            )}

            {view === 'sub' && (
              <>
                <h2>サブストーリー</h2>
                <p className="muted small">「活動エリア」で途中下車すると読める、助けた人の想いの物語を、ここで読み返せるようにする予定です。</p>
                <span className="badge">準備中</span>
              </>
            )}

            {view === 'multi' && (
              <>
                <h2>マルチプレイ</h2>
                <p className="small">2人でないと解けない謎に挑みます。いまは準備中です。</p>
                <p className="muted small">片方にしか見えない「窓の型」と、もう片方にしか見えない「読む順番」を、声や文字で伝え合って解く、という形を考えています。</p>
                <span className="badge">準備中</span>
              </>
            )}

            {view === 'friend' && (
              <>
                <h2>フレンド</h2>
                <p className="small">フレンドの登録は、準備中です。</p>
                <p className="muted small">名前やメールアドレスは使わず、合言葉（招待コード）だけでつながる形を予定しています。</p>
                <span className="badge">準備中</span>
              </>
            )}

            {view === 'items' && (
              <>
                <h2>アイテム</h2>
                {hasCard ? (
                  <ul className="hm-cards">
                    {story.stages.filter((s) => s.item).map((s) => (
                      <li key={s.item!.id} className="got">
                        <span className="hm-card-title">{s.item!.name}</span>
                        <span className="muted small">{s.item!.note}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted small">第1話で手に入るアイテムが、ここに並びます。</p>
                )}
              </>
            )}

            {view === 'rift' && (
              <>
                <h2>ゆがみ</h2>
                <p className="muted small">「いま検知されているゆがみ」の地図は、準備中です。決まった場所へ行って挑む「大きなゆがみ」は、いまも試せます。</p>
                <div className="actions">
                  <button
                    type="button"
                    className="btn primary"
                    disabled={!hasCard}
                    onClick={() => { track('home_tile', { tile: 'bigrift' }); onBigRift(); }}
                  >
                    {hasCard ? '大きなゆがみに挑む' : '第1話クリアで解放'}
                  </button>
                </div>
              </>
            )}

            {view === 'profile' && (
              <>
                <h2>プロフィール</h2>
                <p className="muted small">この端末の中だけに保存され、外には送られません。</p>
                <p className="label">コードネーム</p>
                <div className="actions">
                  <button type="button" className="btn secondary" onClick={onEditName}>
                    {codename ?? '未登録'}　✎ 変更する
                  </button>
                </div>
                <p className="label">アイコン</p>
                <div className="hm-icons">
                  {ICONS.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      className={`hm-icon ${profile.icon === ic ? 'on' : ''}`}
                      aria-pressed={profile.icon === ic}
                      onClick={() => updateProfile({ ...profile, icon: ic })}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
                <label className="label" htmlFor="bio">ひとこと（{BIO_MAX}文字まで）</label>
                <input
                  id="bio"
                  className="input"
                  value={profile.bio}
                  maxLength={BIO_MAX}
                  placeholder="例：帰り道が好き"
                  onChange={(e) => updateProfile({ ...profile, bio: e.target.value })}
                />
                <p className="muted small">本名・連絡先・住所など、個人が分かることは書かないでください。</p>
              </>
            )}

            {view === 'settings' && (
              <>
                <h2>設定</h2>
                <ul className="hm-list">
                  <li>
                    <p className="hm-li-title">ARの自動オン</p>
                    <p className="small">会話中のARは、前回オンにしていると自動でオンになります。</p>
                    <button
                      type="button"
                      className="btn secondary"
                      onClick={() => {
                        try { localStorage.removeItem('machi-nazo:ar-pref'); } catch { /* 何もしない */ }
                        setAsked(true);
                      }}
                    >
                      自動オンを解除する
                    </button>
                    {asked && <p className="feedback" role="status">解除しました。</p>}
                  </li>
                  <li>
                    <p className="hm-li-title">タイトルへ</p>
                    <button type="button" className="btn ghost" onClick={onBack}>タイトルへ戻る</button>
                  </li>
                </ul>
              </>
            )}

            {view === 'dev' && (
              <>
                <h2>DEV 開発モード</h2>
                <p className="muted small">?dev=0 で解除</p>
                <div className="actions">
                  <button type="button" className="btn secondary" onClick={() => { onDevClear(); setView('home'); }}>第1話をクリア済みにする</button>
                  <button type="button" className="btn ghost" onClick={onDevWipe}>保存データをすべて消す</button>
                </div>
              </>
            )}

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

          {view === 'shop' && (
            <>
              <h2>ショップ</h2>
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
        </div>
      )}
    </main>
  );
}
