// 입력 하나로 원국 + 분석 + 올해/12월 + 운명의 상대 기운까지 한 번에 계산한다. (시안 calc()의 계산 부분)
import { analyze, december, decWindow, doors, elG, fam, god, GAN_K, JI_K, JI_MAIN, HAP, loveView, pillars, sinsal, type Pillars } from './core';
import { sijin, toKST, toMin, type KST } from './calendar';

export * from './core';
export * from './calendar';

export type Sex = '여자' | '남자';
export type Orient = 'hetero' | 'queer';
export type BirthInput = { y: number; m: number; d: number; time: string | null; sex: Sex; orient: Orient };
/** asOf: 달력 기준 날짜 (없으면 시안 정답지 범위 12/8~24). 화면·2막은 1막을 본 날짜를 넘긴다 */

export function computeChart(input: BirthInput, asOf?: Date) {
  const male = input.sex === '남자', queer = input.orient === 'queer';
  const kst: KST = toKST(input.y, input.m, input.d, input.time);
  const sj = input.time ? sijin(kst.time) : null;
  const tmin = kst.time ? toMin(kst.time) : null;
  const P = pillars(kst.y, kst.m, kst.d, sj ? sj.idx : null, sj ? sj.nextDay : false, tmin);
  const A = analyze(P, male, queer);
  return {
    kst, sijin: sj, P, A,
    love: loveView(P, A, male, queer), // 화면·2막용 연애 판정 (hidden 포함)
    sal: sinsal(P),
    ilju: GAN_K[P.D.g] + JI_K[P.D.j],
    doors: doors(P, male, queer),
    dec: asOf ? december(P, male, queer, decWindow(asOf).from, decWindow(asOf).to) : december(P, male, queer),
    partnerAge: partnerAge(P, input.y, male, queer),
    partnerEl: partnerEl(P, male, queer),
  };
}
export type Chart = ReturnType<typeof computeChart>;

/** 운명의 상대 나이: 연애 기운이 처음 나오는 기둥(연간→연지→월간→월지→일지→시간→시지)으로 본다 */
export function partnerAge(P: Pillars, y: number, male: boolean, queer: boolean): [string, string] {
  const dG = P.D.g, L = queer ? ['관성', '재성'] : [male ? '재성' : '관성'];
  const has = (g: number | null | undefined) => g != null && L.includes(fam(god(dG, g)));
  const at = ([['Y', P.Y.g], ['Y', JI_MAIN[P.Y.j]], ['M', P.M.g], ['M', JI_MAIN[P.M.j]], ['D', JI_MAIN[P.D.j]], ['H', P.H && P.H.g], ['H', P.H && JI_MAIN[P.H.j]]] as const)
    .find(([, g]) => has(g));
  const k = at ? at[0] : (male ? 'H' : 'Y');
  return ({
    Y: [`${y - 5}~${y - 3}년생`, '너보다 3~5살 많아'], M: [`${y - 1}~${y + 1}년생`, '거의 또래, 한두 살 차이'],
    D: [`${y}년생 전후`, '동갑이거나 딱 한 살 차이'], H: [`${y + 2}~${y + 4}년생`, '너보다 2~4살 어려'],
  } as Record<string, [string, string]>)[k];
}

/** 그 사람의 기운(오행): 여성(이성)=관성, 남성(이성)=재성, 동성=일지와 육합하는 글자 */
export function partnerEl(P: Pillars, male: boolean, queer: boolean): number {
  const e = elG(P.D.g);
  if (queer) return elG(JI_MAIN[HAP[P.D.j]]);
  return male ? (e + 2) % 5 : (e + 3) % 5;
}

export { sunSign, SIGNS, type Sign } from './zodiac';
