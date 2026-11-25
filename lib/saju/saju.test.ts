// data/saju-test-vectors.json (시안 엔진으로 뽑은 정답지 40건)과 완전히 같아야 한다.
import { describe, expect, it } from 'vitest';
import vectors from '../../data/saju-test-vectors.json';
import { computeChart, GAN_K, JI_K, lunar2solar, type Pillar } from './index';

const pk = (p: Pillar | null) => (p ? GAN_K[p.g] + JI_K[p.j] : null);

describe('saju engine == prototype test vectors', () => {
  type Vector = (typeof vectors)[number] & { input: { time: string | null; sex: "여자" | "남자"; orient: "hetero" | "queer" } };
  for (const v of vectors as Vector[]) {
    const { solar, time, sex, orient } = v.input;
    it(`${solar} ${time ?? '시간모름'} ${sex} ${orient}`, () => {
      const [y, m, d] = solar.split('-').map(Number);
      const c = computeChart({ y, m, d, time, sex, orient });
      expect(c.kst).toEqual(v.kst);
      expect({ year: pk(c.P.Y), month: pk(c.P.M), day: pk(c.P.D), hour: pk(c.P.H) }).toEqual(v.pillars);
      expect(c.ilju).toBe(v.ilju);
      expect(c.A.el).toEqual(v.elements);
      expect(c.A.loveState).toBe(v.loveState);
      expect(c.A.gyeok).toBe(v.gyeok);
      expect(Math.round(c.A.ratio * 1000) / 1000).toBeCloseTo(v.ratio, 3);
      expect(c.doors).toEqual(v.doors);
      expect(c.dec.A).toBe(v.december.A);
      expect(c.dec.best).toEqual(v.december.best);
      expect(c.dec.shake).toEqual(v.december.shake);
      expect(c.partnerAge).toEqual(v.partnerAge);
    });
  }
});

describe('lunar2solar', () => {
  it('설날·윤달·없는 날짜', () => {
    expect(lunar2solar(1989, 1, 1, false)).toEqual({ y: 1989, m: 2, d: 6 });
    expect(lunar2solar(1990, 5, 1, true)).not.toBeNull(); // 1990 윤5월
    expect(lunar2solar(1990, 4, 1, true)).toBeNull(); // 윤4월 없음
    expect(lunar2solar(2020, 1, 1, false)).toBeNull(); // 표 범위 밖
  });
});

import { sunSign } from './zodiac';
describe('sunSign', () => {
  it('경계일', () => {
    expect(sunSign(1, 19)).toBe('염소'); expect(sunSign(1, 20)).toBe('물병');
    expect(sunSign(3, 20)).toBe('물고기'); expect(sunSign(3, 21)).toBe('양');
    expect(sunSign(8, 25)).toBe('처녀'); expect(sunSign(12, 24)).toBe('사수'); expect(sunSign(12, 25)).toBe('염소');
  });
});

import { monthPillar } from './core';
describe('monthPillar', () => {
  it('2026년 월주 표(시안 MONTHS_2026)와 같다', () => {
    const T = [[1, 5, 1], [2, 6, 2], [3, 7, 3], [4, 8, 4], [5, 9, 5], [6, 0, 6], [7, 1, 7], [8, 2, 8], [9, 3, 9], [10, 4, 10], [11, 5, 11]];
    for (const [mo, g, j] of T) expect(monthPillar(2026, mo)).toEqual({ g, j });
    expect(monthPillar(2026, 12)).toEqual({ g: 6, j: 0 }); // 2026-12 경자
  });
});

// (2026-11-25) 화면·2막용 판정: 지장간 연애 기운(hidden), 원국 신살, 12월 strong
describe('loveView · sinsal · december.strong', () => {
  it('1989-03-18 13:00 여자: 丑 속 癸水 → hidden, 연지 巳 기준 도화 午·화개 丑, best 5점 → strong', () => {
    const c = computeChart({ y: 1989, m: 3, d: 18, time: '13:00', sex: '여자', orient: 'hetero' });
    expect(c.A.loveState).toBe('none'); // 시안 정답지 값은 그대로
    expect(c.love).toBe('hidden');
    expect(c.sal).toEqual(['도화', '화개']);
    expect(c.dec.best.s).toBe(5);
    expect(c.dec.strong).toBe(true);
  });
  it('남자는 재성(금)을 보므로 같은 사주라도 판정이 다를 수 있다', () => {
    const c = computeChart({ y: 1989, m: 3, d: 18, time: '13:00', sex: '남자', orient: 'hetero' });
    expect(c.love).toBe('hidden'); // 巳 속 庚金
  });
  it('strong은 best 점수 5 이상과 같다', () => {
    for (const [y, m, d] of [[1990, 1, 1], [1995, 7, 2], [2001, 11, 30]]) {
      const c = computeChart({ y, m, d, time: '09:00', sex: '여자', orient: 'hetero' });
      expect(c.dec.strong).toBe(c.dec.best.s >= 5);
    }
  });
});
