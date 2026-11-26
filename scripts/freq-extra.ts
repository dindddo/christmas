// 1막 '100명 중 몇 명' 문장용 추가 빈도표. 1960~2008 모든 날짜 × (12시진 | 시간 모름)을 엔진으로 계산한다.
// 실행: npx tsx scripts/freq-extra.ts  → content/freq-extra.ts (자동 생성, 직접 고치지 말 것)
// 키: H(시간 앎)/N(모름) + f(여·이성애)/m(남·이성애)/q(동성애)
//   love_none(지장간까지 봐도 연애 기운 없음) · love_hidden(겉엔 없고 지장간에 있음) · sal:<신살 조합>(예: sal:도화+역마)
import { writeFileSync } from 'fs';
import { computeChart } from '../lib/saju/index';

const T = ['00:30', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
const out: Record<string, Record<string, number>> = {};
for (const [who, sex, orient] of [['f', '여자', 'hetero'], ['m', '남자', 'hetero'], ['q', '여자', 'queer']] as const) {
  for (const [h, times] of [['H', T], ['N', [null]]] as const) {
    const cnt: Record<string, number> = {}; let n = 0;
    for (let y = 1960; y <= 2008; y++) for (let m = 1; m <= 12; m++) for (let d = 1; d <= 31; d++) {
      if (new Date(y, m - 1, d).getMonth() !== m - 1) continue;
      for (const t of times) {
        const c = computeChart({ y, m, d, time: t, sex, orient }); n++;
        if (c.love === 'none' || c.love === 'hidden') cnt['love_' + c.love] = (cnt['love_' + c.love] || 0) + 1;
        const k = 'sal:' + c.sal.join('+');
        cnt[k] = (cnt[k] || 0) + 1;
      }
    }
    out[h + who] = Object.fromEntries(Object.entries(cnt).map(([k, v]) => [k, Math.round(v / n * 1000) / 10]));
  }
}
writeFileSync('content/freq-extra.ts', `// 자동 생성: scripts/freq-extra.ts (엔진 전수 계산, 단위 %). 직접 고치지 말 것.
export const FREQX: Record<string, Record<string, number>> = ${JSON.stringify(out)};
`);
console.log(Object.fromEntries(Object.entries(out).map(([k, v]) => [k, { none: v.love_none, hidden: v.love_hidden, noSal: v['sal:'] }])));
