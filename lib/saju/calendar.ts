// 달력 보정: 출생 시각 → 한국 표준시, 30분 이동 시진, 음력 → 양력. (시안 그대로)
import { LUNAR } from './data';

// 한국은 1961.8.10 전엔 UTC+8:30, 1960·1987·1988년 여름엔 서머타임이었다.
// [이 시각(UTC 분) 전까지, 그때 시계의 UTC 오프셋(분)]
const KR_TZ: [number, number][] = [
  [Date.UTC(1960, 3, 30, 16) / 60000, 510], [Date.UTC(1960, 8, 17, 15) / 60000, 570], [Date.UTC(1961, 7, 9, 16) / 60000, 510],
  [Date.UTC(1987, 4, 9, 17) / 60000, 540], [Date.UTC(1987, 9, 10, 17) / 60000, 600], [Date.UTC(1988, 4, 7, 17) / 60000, 540],
  [Date.UTC(1988, 9, 8, 17) / 60000, 600], [Infinity, 540],
];

export type KST = { y: number; m: number; d: number; time: string; shift: number };
/** 출생 당시 시계 시각을 지금의 한국 표준시(UTC+9) 기준으로 바꾼다. shift: 보정한 분(+30 / -60 …) */
export function toKST(y: number, m: number, d: number, hhmm: string | null | undefined): KST {
  if (!hhmm) return { y, m, d, time: '', shift: 0 };
  const [h, mi] = hhmm.split(':').map(Number), L = Date.UTC(y, m - 1, d, h, mi) / 60000;
  let off = 540;
  for (let i = 0, from = -Infinity; i < KR_TZ.length; from = KR_TZ[i][0], i++) {
    const u = L - KR_TZ[i][1];
    if (u >= from && u < KR_TZ[i][0]) { off = KR_TZ[i][1]; break; }
  }
  const shift = 540 - off, t = new Date((L + shift) * 60000);
  return {
    y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate(),
    time: `${String(t.getUTCHours()).padStart(2, '0')}:${String(t.getUTCMinutes()).padStart(2, '0')}`, shift,
  };
}

export const SIJIN = ['자시', '축시', '인시', '묘시', '진시', '사시', '오시', '미시', '신시', '유시', '술시', '해시'];
/** 30분 이동 시진 (자시 23:30–01:29). 23:30 이후는 다음날 일진 */
export function sijin(hhmm: string | null | undefined) {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(':').map(Number), t = h * 60 + m;
  return { idx: Math.floor((((t - 30 + 60) % 1440) + 1440) % 1440 / 120), nextDay: t >= 23 * 60 + 30 };
}

export const toMin = (hhmm: string) => hhmm.split(':').reduce((h, m) => +h * 60 + +m, 0);

/** 음력 → 양력 (1959~2008 음력년, 윤달 지원). 없는 날짜면 null */
export function lunar2solar(y: number, m: number, d: number, leap: boolean) {
  const r = LUNAR.find(x => x[0] === y);
  if (!r) return null;
  const [, start, lm, bits] = r;
  if (leap && lm !== m) return null;
  const idx = m - 1 + (lm && (m > lm || (m === lm && leap)) ? 1 : 0);
  let day = start;
  for (let i = 0; i < idx; i++) day += 29 + ((bits >> i) & 1);
  if (d > 29 + ((bits >> idx) & 1)) return null;
  const t = new Date((day + d - 1) * 86400000);
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
}
