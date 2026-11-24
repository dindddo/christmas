/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS 1회용 스크립트 */
// prototype/index.html 에서 큰 표(절기·음력·빈도)를 그대로 뽑아 TS 파일로 만든다.
const fs = require('fs');
const h = fs.readFileSync('prototype/index.html', 'utf8');
const grab = re => { const m = h.match(re); if (!m) throw new Error('not found ' + re); return m[1]; };
const J = grab(/const JEOL_T = (\[[^\]]+\]);/);
const L = grab(/const LUNAR = (\[\[.*?\]\]);/);
const F = grab(/const FREQ = (\{.*?\}\});\n/);
fs.writeFileSync('lib/saju/data.ts', `// 자동 생성: scripts/extract.js 가 prototype/index.html 에서 그대로 뽑은 표. 직접 고치지 말 것.

// 절기 시각표 (1959~2009, 소한·입춘·경칩·청명·입하·망종·소서·입추·백로·한로·입동·대설 순, KST 기준 epoch 분)
export const JEOL_T: readonly number[] = ${J};

// 음력 표 (1959~2008): [음력년, 설날 epoch 일수, 윤달(0=없음), 달 길이 비트(1=30일), 달 수]
export const LUNAR: readonly (readonly [number, number, number, number, number])[] = ${L};
`);
fs.writeFileSync('content/freq.ts', `// 1960~2008년 모든 날짜(×12시진)를 엔진으로 계산해 얻은 특징별 비율(%). 자동 생성(scripts/extract.js).
export const FREQ: Record<string, Record<string, number>> = ${F};
`);
console.log('JEOL_T', JSON.parse(J).length, 'LUNAR', JSON.parse(L).length);
