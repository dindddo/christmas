// 가격 (2026-11-22 결정): 기본 19,900원. 출시 첫 주(12/3~12/7)에 9,900원과 A/B 테스트한다.
// 판단 기준: 19,900원 결제율이 9,900원의 49% 이상이면 19,900원 확정 (1건당 남는 돈 16,700 vs 8,155원, 다날 수수료 5.5% 가정).
// 테스트가 끝나면 TEST.on = false 로 두고 BASE 만 쓴다.
// 규칙: 정가·할인 표기 금지. 두 가격 모두 같은 문구를 쓰고 숫자만 다르다.
// 결제 연동 시 서버도 이 표를 읽어 금액을 검증한다(브라우저가 보낸 금액을 그대로 믿지 않음).

export const BASE = 19900;
// (2026-11-25) PG 심사 기간(포트원): 가격이 방문자마다 다르면 반려 위험 → A/B 끄고 19,900원 고정. 심사 끝나면 on: true로 되돌려 A/B 재개
export const TEST = {
  on: false,
  arms: { A: 19900, B: 9900 } as Record<string, number>,
};
export const PRICE_CONFIRMED = false;

const KEY = 'price_arm';

/** 이 방문자에게 보이는 가격 칸. 한 번 정해지면 같은 브라우저에서는 계속 같은 가격이 보인다. */
export function priceArm(): string {
  if (!TEST.on || typeof window === 'undefined') return 'A';
  // QA용: ?arm=B 로 강제 지정
  const forced = new URLSearchParams(location.search).get('arm');
  if (forced && forced in TEST.arms) return forced;
  try {
    const saved = localStorage.getItem(KEY);
    if (saved && saved in TEST.arms) return saved;
    const arm = Math.random() < 0.5 ? 'A' : 'B';
    localStorage.setItem(KEY, arm);
    return arm;
  } catch {
    return 'A'; // 저장소가 막힌 브라우저는 기본 가격
  }
}

export const priceAmount = (arm = priceArm()) => (TEST.on ? TEST.arms[arm] ?? BASE : BASE);
export const priceText = (arm?: string) => `${priceAmount(arm).toLocaleString('ko-KR')}원`;

// ---- 가격의 이유: 연말 꾸밈비 (2026-11-22) ----
// 비교 대상은 다른 사주 서비스가 아니라 "이미 쓰기로 한 연말 꾸밈비". 우리 상품을 그 예산의 마지막 한 줄로 놓는다.
// 노엘은 돈 얘기를 하지 않는다(감정 담당). 가격 비교는 UI 카드가 한다. 카드에 금액은 쓰지 않는다(시세 숫자 오류 방지).
export const KKUMIM = {
  // 노엘 대사 (緣 운명의 상대 챕터 직전)
  lines: {
    solo: ['"연말 꾸밈비,<br>생각보다 꽤 쓰는 스타일이다?"', '"근데 꾸미는 건 결국,<br>누가 알아봐 주길 바라서야."', '"…그 사람이 누군지,<br><b>내가 먼저 알려줄게.</b>"'],
    together: ['"연말 꾸밈비,<br>생각보다 꽤 쓰는 스타일이다?"', '"근데 꾸미는 건 결국,<br>그 사람이 알아봐 주길 바라서야."', '"…그날 둘이 어떤 하루일지,<br><b>내가 먼저 보여줄게.</b>"'],
  },
  card: {
    title: '올해 연말 꾸밈비',
    // 이모지 대신 목차 카드와 같은 번호(01~03), 마지막 줄은 바로 뒤 챕터와 같은 緣 도장 (2026-11-22)
    items: ['그날 입을 옷', '네일', '헤어'],
    seal: '緣',
    last: { solo: '알아볼 그 사람, 미리 알아보기', together: '그날 둘의 하루, 미리 보기' },
    tag: '마지막 한 줄',
  },
};
