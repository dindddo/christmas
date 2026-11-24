// CLAUDE.md 절대 규칙 중 자동으로 검사할 수 있는 것들
import { describe, expect, it } from 'vitest';
import { PROLOGUE as C } from './prologue';
import { ACT1, SHAKE } from './act1';
import * as reading from './reading';
import { LOADING, LOADING_SUB, QUESTIONS } from './chat';
import { KKUMIM } from './pricing';
import { NOEL_CHAT, EVE } from './act2';

const all = (x: unknown): string => JSON.stringify(x);

describe('문구 절대 규칙', () => {
  it('프롤로그(P1~P7, B1~B4)에 "천사"가 없다', () => {
    expect(all(C)).not.toContain('천사');
  });
  it('채팅 질문에도 정체가 미리 드러나지 않는다', () => {
    expect(all(QUESTIONS)).not.toContain('천사');
  });
  it('가짜 이용자 수·후기·할인 표기가 없다', () => {
    const txt = all([ACT1, reading]);
    expect(txt).not.toMatch(/명이 (봤|이용|열었)|후기|정가|할인|%\s*OFF/);
  });
  it('가격 문구(꾸밈비 카드)에 할인·정가·금액 비교가 없다', () => {
    expect(all(KKUMIM)).not.toMatch(/정가|할인|%\s*OFF|\d+,?\d*원/);
  });
  it('노엘 대사에 확인형 말투("~했지?")가 없다', () => {
    const txt = all([QUESTIONS, LOADING, SHAKE, ACT1, KKUMIM, NOEL_CHAT, EVE]);
    expect(txt).not.toMatch(/(했|었|였|갔|왔|봤|겠)지\?/);
  });
  it('마침표로 끝나는 확인형·과거 습관 단정("~적 있지.", "~있잖아.")도 없다', () => {
    const txt = all([QUESTIONS, LOADING, SHAKE, ACT1, KKUMIM, NOEL_CHAT, EVE, reading]);
    expect(txt).not.toMatch(/적 있(지|잖아)[.?]|날도 있었지[.?]/);
  });
  it('화면에 나가는 문구에 임시 표시가 없다', () => {
    const txt = all([C, QUESTIONS, LOADING, LOADING_SUB, ACT1, KKUMIM, reading]);
    expect(txt).not.toMatch(/자리\)|TODO|TBD|\(임시/);
  });
  it('가격 카드에 이모지를 쓰지 않는다(한자 도장·번호로 통일)', () => {
    expect(all(KKUMIM)).not.toMatch(/\p{Extended_Pictographic}/u);
  });
});
