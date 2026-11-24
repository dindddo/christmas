// 태양 별자리(생일 기준). 경계일은 해마다 하루쯤 달라질 수 있어, 1막에서는 흔히 쓰는 기준일로 본다.
// (2막에서 정밀하게 보려면 출생 시각·천체력 기준으로 다시 계산)
export const SIGNS = ['염소', '물병', '물고기', '양', '황소', '쌍둥이', '게', '사자', '처녀', '천칭', '전갈', '사수'] as const;
export type Sign = (typeof SIGNS)[number];
// 각 달에서 다음 별자리로 바뀌는 날 (1월 20일부터 물병 …)
const CUT = [20, 19, 21, 20, 21, 22, 23, 23, 24, 23, 23, 25];

export function sunSign(m: number, d: number): Sign {
  const i = d >= CUT[m - 1] ? m : m - 1; // 0=염소(12/25~1/19)
  return SIGNS[i % 12];
}
