import type { SupabaseClient } from '@supabase/supabase-js';
import type { Mode } from '../types';

/**
 * Supabaseへの保存。環境変数が未設定でも、通信に失敗しても、ゲームは止めない。
 * 保存するのは匿名ID・モード・進行数・ヒント回数・誤答回数のみ。位置情報は送らない。
 */

let clientPromise: Promise<SupabaseClient | null> | null = null;

function getClient(): Promise<SupabaseClient | null> {
  if (!clientPromise) {
    clientPromise = (async () => {
      const url = import.meta.env?.VITE_SUPABASE_URL;
      const key = import.meta.env?.VITE_SUPABASE_ANON_KEY;
      if (!url || !key) return null;
      const { createClient } = await import('@supabase/supabase-js');
      return createClient(url, key);
    })().catch((error) => {
      console.warn('[remote] Supabaseの初期化に失敗しました', error);
      return null;
    });
  }
  return clientPromise;
}

async function ensureAnonymousUser(client: SupabaseClient): Promise<boolean> {
  const { data } = await client.auth.getSession();
  if (data.session) return true;
  const { error } = await client.auth.signInAnonymously();
  if (error) {
    console.warn('[remote] 匿名ログインに失敗しました', error.message);
    return false;
  }
  return true;
}

/** プレイ開始を記録し、行IDを返す。保存できなければ null */
export async function createRemoteSession(
  storyId: string,
  mode: Mode,
): Promise<string | null> {
  try {
    const client = await getClient();
    if (!client) return null;
    if (!(await ensureAnonymousUser(client))) return null;
    const { data, error } = await client
      .from('play_sessions')
      .insert({ story_id: storyId, mode })
      .select('id')
      .single();
    if (error) {
      console.warn('[remote] 開始の記録に失敗しました', error.message);
      return null;
    }
    return (data as { id: string }).id;
  } catch (error) {
    console.warn('[remote] 開始の記録に失敗しました', error);
    return null;
  }
}

export type RemoteProgress = {
  stagesCleared: number;
  hintsUsed: number;
  wrongAnswers: number;
  cleared: boolean;
};

/** 進行状況を上書き保存する（毎回全カウンタを送るので、重複しても安全） */
export async function updateRemoteSession(
  sessionId: string,
  progress: RemoteProgress,
): Promise<void> {
  try {
    const client = await getClient();
    if (!client) return;
    const now = new Date().toISOString();
    const { error } = await client
      .from('play_sessions')
      .update({
        stages_cleared: progress.stagesCleared,
        hints_used: progress.hintsUsed,
        wrong_answers: progress.wrongAnswers,
        updated_at: now,
        ...(progress.cleared ? { cleared_at: now } : {}),
      })
      .eq('id', sessionId);
    if (error) console.warn('[remote] 進行状況の保存に失敗しました', error.message);
  } catch (error) {
    console.warn('[remote] 進行状況の保存に失敗しました', error);
  }
}
