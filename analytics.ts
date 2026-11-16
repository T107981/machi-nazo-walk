/**
 * Google Analytics 4 の読み込みとイベント送信。
 * VITE_GA_MEASUREMENT_ID（G-XXXXXXXXXX）が未設定なら何もしません。
 *
 * 送るイベント: game_start / stage_clear / game_clear / hint_used
 * （訪問数は GA4 標準の page_view・ユーザー数で見られます）
 */

type GtagParams = Record<string, string | number | boolean>;

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function initAnalytics(): void {
  if (typeof document === 'undefined') return;
  const id = import.meta.env?.VITE_GA_MEASUREMENT_ID;
  // 形式を確認してから読み込む（想定外の値をスクリプトURLに入れないため）
  if (!id || !/^G-[A-Z0-9]+$/.test(id)) return;
  if (document.getElementById('ga4-script')) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    // gtag.js は配列ではなく arguments オブジェクトを受け取る仕様
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };

  const script = document.createElement('script');
  script.id = 'ga4-script';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  document.head.appendChild(script);

  window.gtag('js', new Date());
  window.gtag('config', id);
}

export function track(name: string, params?: GtagParams): void {
  if (typeof window === 'undefined') return;
  window.gtag?.('event', name, params);
}
