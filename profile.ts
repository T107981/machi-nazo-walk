// プロフィール（この端末の中だけに保存。サーバーには送らない）
const KEY = 'machi-nazo:profile:v1';
export const ICONS = ['✦', '☾', '❀', '☁', '♪', '⚑'] as const;
export const BIO_MAX = 30;

export type Profile = { icon: string; bio: string };

export function loadProfile(): Profile {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
    if (raw) {
      const v = JSON.parse(raw) as Partial<Profile>;
      return {
        icon: typeof v.icon === 'string' && v.icon ? v.icon : ICONS[0],
        bio: typeof v.bio === 'string' ? v.bio.slice(0, BIO_MAX) : '',
      };
    }
  } catch {
    // 読めなければ初期値
  }
  return { icon: ICONS[0], bio: '' };
}

export function saveProfile(p: Profile): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ icon: p.icon, bio: p.bio.slice(0, BIO_MAX) }));
  } catch {
    // 保存できなくても続けられる
  }
}
