-- ============================================================
-- 街歩き謎解き MVP: ゲーム進行を保存する最小限のテーブル
-- 実行場所: Supabase ダッシュボード → SQL Editor → New query に貼り付けて Run
--
-- 保存するもの : 匿名ID・モード・クリアしたステージ数・ヒント回数・誤答回数・時刻
-- 保存しないもの: 氏名・メール・位置情報（緯度経度）
-- ============================================================

create table if not exists public.play_sessions (
  id             uuid primary key default gen_random_uuid(),
  -- 匿名ログインで発行されるユーザーID。サーバー側で自動的に入ります
  user_id        uuid not null default auth.uid()
                   references auth.users (id) on delete cascade,
  story_id       text not null,
  mode           text not null check (mode in ('geo', 'demo')),
  stages_cleared int  not null default 0 check (stages_cleared >= 0),
  hints_used     int  not null default 0 check (hints_used >= 0),
  wrong_answers  int  not null default 0 check (wrong_answers >= 0),
  started_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  cleared_at     timestamptz
);

create index if not exists play_sessions_user_id_idx
  on public.play_sessions (user_id);

-- 行レベルセキュリティ: 自分の行しか読み書きできないようにする
alter table public.play_sessions enable row level security;

drop policy if exists "own sessions select" on public.play_sessions;
create policy "own sessions select" on public.play_sessions
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "own sessions insert" on public.play_sessions;
create policy "own sessions insert" on public.play_sessions
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "own sessions update" on public.play_sessions;
create policy "own sessions update" on public.play_sessions
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- 注: Supabaseの「匿名ログイン」のユーザーも authenticated ロールとして扱われます。
--     そのため、ダッシュボードで Anonymous Sign-Ins を ON にする必要があります（READMEを参照）。

-- ------------------------------------------------------------
-- 参考: 需要の確認に使う集計クエリ（SQL Editorで実行。RLSの影響を受けません）
-- ------------------------------------------------------------
-- select
--   count(*)                                             as starts,
--   count(*) filter (where cleared_at is not null)       as clears,
--   round(100.0 * count(*) filter (where cleared_at is not null)
--         / nullif(count(*), 0), 1)                      as clear_rate_pct,
--   round(avg(hints_used), 2)                            as avg_hints,
--   round(avg(wrong_answers), 2)                         as avg_wrong
-- from public.play_sessions;
--
-- -- どのステージで離脱しているか
-- select stages_cleared, count(*) from public.play_sessions
-- where cleared_at is null group by stages_cleared order by stages_cleared;
