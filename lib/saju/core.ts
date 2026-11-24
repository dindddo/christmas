// 운명의 문 사주 엔진 — prototype/index.html 의 SAJU 모듈을 그대로 옮긴 순수 TS (브라우저/서버 공용).
// 로직을 바꾸면 data/saju-test-vectors.json 테스트가 깨진다. 바꾸기 전에 기획과 합의할 것.
import { JEOL_T } from './data';

export type Pillar = { g: number; j: number };
export type Pillars = { Y: Pillar; M: Pillar; D: Pillar; H: Pillar | null };
export type God = '비견' | '겁재' | '식신' | '상관' | '편재' | '정재' | '편관' | '정관' | '편인' | '정인';
export type Fam = '비겁' | '식상' | '재성' | '관성' | '인성';
export type DoorType = 'knock' | 'half' | 'slam' | 'key' | 'wrong' | 'off';
export type LoveState = 'none' | 'clean' | 'mixed' | 'many' | 'sharp';
export type Strength = '신강' | '신약' | '중화';

export const GAN = '甲乙丙丁戊己庚辛壬癸';
export const GAN_K = '갑을병정무기경신임계';
export const JI = '子丑寅卯辰巳午未申酉戌亥';
export const JI_K = '자축인묘진사오미신유술해';
export const JI_MAIN = [9, 5, 0, 1, 4, 2, 3, 5, 6, 7, 4, 8]; // 지지 본기 천간
export const elG = (s: number) => Math.floor(s / 2); // 0목 1화 2토 3금 4수

function jdn(y: number, m: number, d: number) {
  const a = Math.floor((14 - m) / 12), yy = y + 4800 - a, mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
}
const p60 = (i: number): Pillar => ({ g: i % 10, j: i % 12 });
export function dayP(y: number, m: number, d: number): Pillar {
  return p60(((jdn(y, m, d) + 49) % 60 + 60) % 60);
}

/** 해당 시각 직전 절기. k: 0소한 1입춘 … 11대설, since: 절입 후 경과 일수 */
export function jeolAt(y: number, m: number, d: number, tmin: number | null) {
  const t = Date.UTC(y, m - 1, d) / 60000 + (tmin == null ? 720 : tmin);
  let i = JEOL_T.length - 1;
  while (i > 0 && JEOL_T[i] > t) i--;
  return { i, k: i % 12, since: Math.floor((t - JEOL_T[i]) / 1440), t };
}

export function pillars(y: number, m: number, d: number, hourIdx: number | null, nextDay: boolean, tmin: number | null): Pillars {
  const J = jeolAt(y, m, d, tmin), ipchun = JEOL_T[(y - 1959) * 12 + 1];
  const beforeIpchun = J.t < ipchun;
  const yi = ((y - (beforeIpchun ? 1 : 0) - 4) % 60 + 60) % 60, Y = p60(yi);
  const mb = (J.k + 1) % 12; // 소한→축, 입춘→인 … 대설→자
  const firstStem = (Y.g % 5) * 2 + 2; // 인월 천간
  const M = { g: (firstStem + ((mb - 2 + 12) % 12)) % 10, j: mb };
  const D = nextDay ? dayP(y, m, d + 1) : dayP(y, m, d); // 23:30 이후 자시는 다음 날 일진
  const H = hourIdx == null ? null : { g: ((D.g % 5) * 2 + hourIdx) % 10, j: hourIdx };
  return { Y, M, D, H };
}

const GODS: [God, God][] = [['비견', '겁재'], ['식신', '상관'], ['편재', '정재'], ['편관', '정관'], ['편인', '정인']];
export function god(dayG: number, s: number): God {
  const k = (elG(s) - elG(dayG) + 5) % 5, same = (s % 2) === (dayG % 2);
  return GODS[k][same ? 0 : 1];
}
const FAM: Record<God, Fam> = { 비견: '비겁', 겁재: '비겁', 식신: '식상', 상관: '식상', 편재: '재성', 정재: '재성', 편관: '관성', 정관: '관성', 편인: '인성', 정인: '인성' };
export const fam = (g: God): Fam => FAM[g];

export const HAP = [1, 0, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2]; // 육합 짝
const WON = [7, 6, 9, 8, 11, 10, 1, 0, 3, 2, 5, 4]; // 원진 짝
const DOHWA = (j: number) => [9, 6, 3, 0][[0, 3, 2, 1, 0, 3, 2, 1, 0, 3, 2, 1][j]]; // 신자진→유, 사유축→오, 인오술→묘, 해묘미→자
const HONG = [6, 6, 2, 7, 4, 4, 10, 9, 0, 8]; // 일간별 홍염 지지
// 2026 각 달 월주 (1월=기축 … 11월=기해)
const MONTHS_2026: { mo: number; g: number; j: number }[] = ([[1, 5, 1], [2, 6, 2], [3, 7, 3], [4, 8, 4], [5, 9, 5], [6, 0, 6], [7, 1, 7], [8, 2, 8], [9, 3, 9], [10, 4, 10], [11, 5, 11]] as const)
  .map(([mo, g, j]) => ({ mo, g, j }));

/** 연애 기운: 여성=관성, 남성=재성, 동성=둘 다 */
export function loveSet(male: boolean, queer: boolean): Fam[] {
  return queer ? ['관성', '재성'] : [male ? '재성' : '관성'];
}

export type Door = { mo: number; score: number; type: DoorType };
/** 2026년 월별 신호 점수 → '너의 올해' 장면 (가장 큰 장면이 맨 앞, 나머지는 월 순) */
export function doors(P: Pillars, male: boolean, queer: boolean): Door[] {
  const L = loveSet(male, queer), dG = P.D.g, dJ = P.D.j;
  const yearLove = L.includes(fam(god(dG, 2))) || L.includes(fam(god(dG, JI_MAIN[6]))); // 2026 병오가 연애 기운인가
  const dh = new Set([DOHWA(P.Y.j), DOHWA(dJ)]), A = analyze(P, male, queer), boost = A.loveState === 'none' ? 1 : 0;
  const PR: Record<DoorType, number> = { half: 6, slam: 5, knock: 4, key: 3, wrong: 2, off: 1 };
  const res = MONTHS_2026.map(({ mo, g, j }) => {
    const sig: [number, DoorType][] = [];
    const gg = god(dG, g), jg = god(dG, JI_MAIN[j]);
    if (L.includes(fam(gg))) sig.push([(gg.startsWith('정') ? 4 : 3) + boost, 'knock']);
    if (L.includes(fam(jg))) sig.push([2 + boost, 'knock']);
    if (HAP[dJ] === j) sig.push([4, 'half']);
    if ((dJ + 6) % 12 === j) sig.push([4, 'slam']);
    if (WON[dJ] === j) sig.push([2, 'off']);
    if (dh.has(j)) sig.push([DOHWA(P.Y.j) === j && DOHWA(dJ) === j ? 4 : 3, 'key']);
    if (HONG[dG] === j) sig.push([2, 'key']);
    if (gg === (male ? '겁재' : '상관')) sig.push([2 + (yearLove ? 1 : 0), 'wrong']);
    const score = sig.reduce((a, b) => a + b[0], 0);
    const top = sig.sort((a, b) => b[0] - a[0] || PR[b[1]] - PR[a[1]])[0];
    return { mo, score, type: (top ? top[1] : null) as DoorType };
  }).filter((x): x is Door => x.score > 0);
  const byScore = [...res].sort((a, b) => b.score - a.score || b.mo - a.mo);
  const pick: Door[] = [];
  for (const c of byScore) {
    if (!pick.length) { pick.push(c); continue; }
    if (pick.length >= 3 || c.score < 3) continue;
    if (pick.some(p => p.type === c.type || Math.abs(p.mo - c.mo) < 2)) continue;
    pick.push(c);
  }
  if (pick.length && pick[0].score < 3) pick.length = 0;
  const [first, ...rest] = pick;
  return first ? [first, ...rest.sort((a, b) => a.mo - b.mo)] : [];
}

export type Analysis = {
  el: number[]; ratio: number; strength: Strength; gyeok: God; loveState: LoveState;
  natal: 'clash' | 'hap' | null; missing: number[]; heavy: number; famN: Record<Fam, number>; yearGood: boolean;
};
/** 원국 전체 읽기: 오행 분포, 신강·신약, 월령(격), 연애 기운 상태, 원국 안 일지 합·충 */
export function analyze(P: Pillars, male: boolean, queer: boolean): Analysis {
  const dG = P.D.g, L = loveSet(male, queer);
  const nL = (f: Record<Fam, number>) => L.reduce((a, k) => a + f[k], 0);
  const pos: [string, number, number][] = [['연간', P.Y.g, 1], ['월간', P.M.g, 1], ['연지', JI_MAIN[P.Y.j], 1], ['월지', JI_MAIN[P.M.j], 3], ['일지', JI_MAIN[P.D.j], 2]];
  if (P.H) pos.push(['시간', P.H.g, 1], ['시지', JI_MAIN[P.H.j], 1]);
  const el = [0, 0, 0, 0, 0]; el[elG(dG)]++;
  pos.forEach(([, s]) => el[elG(s)]++);
  const famW: Record<Fam, number> = { 비겁: 0, 식상: 0, 재성: 0, 관성: 0, 인성: 0 }, famN = { ...famW };
  const gods: God[] = [];
  let tot = 0;
  pos.forEach(([, s, w]) => { const g = god(dG, s), f = fam(g); famW[f] += w; famN[f]++; tot += w; gods.push(g); });
  const ratio = (famW.비겁 + famW.인성) / tot;
  const strength: Strength = ratio >= .5 ? '신강' : ratio <= .35 ? '신약' : '중화';
  const gyeok = god(dG, JI_MAIN[P.M.j]);
  const lg = gods.filter(g => L.includes(fam(g)));
  const loveState: LoveState = nL(famN) === 0 ? 'none' : nL(famN) >= 3 ? 'many'
    : (lg.some(g => g.startsWith('정')) && lg.some(g => g.startsWith('편'))) ? 'mixed'
    : (!male && famN.식상 >= 3) ? 'sharp' : 'clean';
  const dJ = P.D.j, others = [P.Y.j, P.M.j, P.H?.j].filter((x): x is number => x != null);
  const natal = others.some(j => (dJ + 6) % 12 === j) ? 'clash' : others.some(j => HAP[dJ] === j) ? 'hap' : null;
  const n = P.H ? 8 : 6, missing = el.map((c, i) => c === 0 ? i : -1).filter(i => i >= 0);
  const heavy = el.findIndex(c => c >= (n === 8 ? 4 : 3));
  // 2026 병오(화)가 이 사주에 반가운 기운인가: 신강이면 식재관, 신약이면 인비
  const fireFam = fam(god(dG, 2));
  const helps: Fam[] = strength === '신약' ? ['인성', '비겁'] : strength === '신강' ? ['식상', '재성', '관성'] : ['식상', '재성', '관성', '인성', '비겁'];
  return { el, ratio, strength, gyeok, loveState, natal, missing, heavy, famN, yearGood: helps.includes(fireFam) && el[1] < 3 };
}

export type DecDay = { d: number; s: number; wd: number; X: Pillar; clash: boolean };
export type December = { A: boolean; best: DecDay; shake: DecDay | null; passers: number[]; days: DecDay[] };
/** 2026-12-08 ~ 12-24 일진 점수 → 결과 A(문 열림)/B, best day, shake day */
export function december(P: Pillars, male: boolean, queer: boolean): December {
  const L = loveSet(male, queer), dG = P.D.g, dJ = P.D.j, dh = new Set([DOHWA(P.Y.j), DOHWA(dJ)]);
  const days: DecDay[] = [];
  for (let d = 8; d <= 24; d++) {
    const X = dayP(2026, 12, d), gg = god(dG, X.g);
    let s = 0;
    if (queer ? (gg === '정관' || gg === '정재') : gg === (male ? '정재' : '정관')) s += 3;
    if (HAP[dJ] === X.j) s += 3;
    if (dh.has(X.j)) s += 2;
    if (s === 0 && (L.includes(fam(gg)) || L.includes(fam(god(dG, JI_MAIN[X.j]))))) s += 1;
    const wd = new Date(Date.UTC(2026, 11, d)).getUTCDay(); // 시안은 로컬 Date. 서버(UTC)에서도 같게 UTC로 계산
    days.push({ d, s, wd, X, clash: (dJ + 6) % 12 === X.j });
  }
  const weekend = (x: DecDay) => (x.wd === 5 || x.wd === 6 ? 1 : 0);
  const best = [...days].sort((a, b) => b.s - a.s || (weekend(b) - weekend(a)) || b.d - a.d)[0];
  return { A: best.s >= 3, best, shake: days.find(x => x.clash && x.d !== best.d) || null, passers: days.filter(x => x.s === 1).map(x => x.d), days };
}

/** 그 해 각 달 20일 무렵(절기 이후)의 월주. 절기 표(1959~2009) 밖의 연도용 산술 계산.
 *  월지: 1월=축 … 11월=해, 12월=자 / 월간: 그 달이 속한 사주년의 연간으로 정한다(1월은 입춘 전이라 전년). */
export function monthPillar(year: number, mo: number): Pillar {
  const j = mo % 12, cycleYear = mo === 1 ? year - 1 : year;
  const yg = ((cycleYear - 4) % 10 + 10) % 10, firstStem = (yg % 5) * 2 + 2;
  return { g: (firstStem + ((j - 2 + 12) % 12)) % 10, j };
}

/** 임의 연도의 월별 인연 신호 (2막 '2027년 흐름'용). 점수 규칙은 doors()와 같고, 고르기 없이 12달을 모두 돌려준다.
 *  doors()는 시안 정답지와 맞춰야 해서 건드리지 않고 따로 둔다. */
export function monthFlow(P: Pillars, male: boolean, queer: boolean, year: number): Door[] {
  const L = loveSet(male, queer), dG = P.D.g, dJ = P.D.j;
  const dh = new Set([DOHWA(P.Y.j), DOHWA(dJ)]), A = analyze(P, male, queer), boost = A.loveState === 'none' ? 1 : 0;
  const PR: Record<DoorType, number> = { half: 6, slam: 5, knock: 4, key: 3, wrong: 2, off: 1 };
  return Array.from({ length: 12 }, (_, i) => {
    const mo = i + 1, { g, j } = monthPillar(year, mo);
    const sig: [number, DoorType][] = [];
    const gg = god(dG, g), jg = god(dG, JI_MAIN[j]);
    if (L.includes(fam(gg))) sig.push([(gg.startsWith('정') ? 4 : 3) + boost, 'knock']);
    if (L.includes(fam(jg))) sig.push([2 + boost, 'knock']);
    if (HAP[dJ] === j) sig.push([4, 'half']);
    if ((dJ + 6) % 12 === j) sig.push([4, 'slam']);
    if (WON[dJ] === j) sig.push([2, 'off']);
    if (dh.has(j)) sig.push([DOHWA(P.Y.j) === j && DOHWA(dJ) === j ? 4 : 3, 'key']);
    if (HONG[dG] === j) sig.push([2, 'key']);
    const score = sig.reduce((a, b) => a + b[0], 0);
    const top = sig.sort((a, b) => b[0] - a[0] || PR[b[1]] - PR[a[1]])[0];
    return { mo, score, type: (top ? top[1] : 'off') as DoorType };
  });
}
