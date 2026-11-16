import type { Spot } from '../types';

export type LatLng = { lat: number; lng: number };

export type GeoFailure = 'unsupported' | 'denied' | 'unavailable' | 'timeout';

export type GeoResult =
  | { ok: true; position: LatLng; accuracyM: number }
  | { ok: false; reason: GeoFailure };

const EARTH_RADIUS_M = 6371000;

/** 2地点間の距離（メートル）。ハーバーサイン公式 */
export function distanceM(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** その場所に座標が設定されているか */
export function hasCoords(spot: Spot): spot is Spot & { lat: number; lng: number } {
  return spot.lat !== null && spot.lng !== null;
}

/**
 * 到着判定。GPSの誤差を考慮し、精度の悪さ（最大50m分）だけ半径にゆとりをもたせる。
 */
export function isArrived(
  spot: Spot & { lat: number; lng: number },
  current: LatLng,
  accuracyM: number,
): { arrived: boolean; distanceM: number } {
  const d = distanceM({ lat: spot.lat, lng: spot.lng }, current);
  const slack = Math.min(Math.max(accuracyM, 0), 50);
  return { arrived: d <= spot.radiusM + slack, distanceM: d };
}

/** 現在地を1回だけ取得する。失敗時は理由を返す（例外は投げない） */
export function getCurrentPosition(): Promise<GeoResult> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      resolve({ ok: false, reason: 'unsupported' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          ok: true,
          position: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          accuracyM: pos.coords.accuracy,
        }),
      (err) => {
        const reason: GeoFailure =
          err.code === 1 ? 'denied' : err.code === 3 ? 'timeout' : 'unavailable';
        resolve({ ok: false, reason });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
  });
}

export function geoFailureMessage(reason: GeoFailure): string {
  switch (reason) {
    case 'unsupported':
      return 'この端末・ブラウザでは位置情報が使えません。';
    case 'denied':
      return '位置情報の利用が許可されていません。ブラウザの設定で許可するか、下のボタンで位置情報なしで進めてください。';
    case 'timeout':
      return '位置情報の取得に時間がかかっています。電波の良い場所でもう一度試すか、位置情報なしで進めてください。';
    default:
      return '現在地を取得できませんでした。もう一度試すか、位置情報なしで進めてください。';
  }
}
