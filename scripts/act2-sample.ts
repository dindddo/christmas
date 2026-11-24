// 2막 생성 시험: npx tsx scripts/act2-sample.ts [--dry]
//  --dry : API를 부르지 않고 프롬프트와 대략적인 길이만 보여준다(무료)
//  기본  : 실제 생성(유료, 약 수백 원) → out/act2-sample.json, out/act2-sample.md 저장 + 시간·비용 출력
// 인증: ANTHROPIC_API_KEY 환경변수 (또는 .env.local)
import fs from 'node:fs';
import path from 'node:path';
import { buildFacts } from '@/lib/act2/facts';
import { chapterPrompt, systemBlocks } from '@/lib/act2/prompt';
import type { SavedInput } from '@/lib/flow/flow';

// .env.local 이 있으면 읽는다 (Next.js 밖에서 실행하므로)
try {
  for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch { /* 없으면 넘어감 */ }

const sample: SavedInput = {
  name: '지수', sex: '여자', y: 1993, m: 8, d: 25, time: '07:20', noTime: false,
  status: 'solo', orient: 'hetero', job: 'office', wk: 'crush', worry: '그 사람 마음이 궁금해',
};

async function main() {
  const dry = process.argv.includes('--dry');
  const f = buildFacts(sample);
  const sys = systemBlocks(f);
  if (dry) {
    console.log('=== 공통 지시문(캐시) ===\n' + sys + '\n');
    for (const ch of f.chapters) console.log(`=== ${ch.no}장 요청 ===\n${chapterPrompt(f, ch.no)}\n`);
    console.log(`공통 지시문 ${sys.length.toLocaleString()}자, 챕터 ${f.chapters.length}개, 항목 ${f.chapters.reduce((a, c) => a + c.items.length, 0)}개`);
    return;
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY가 없습니다. .env.local 에 ANTHROPIC_API_KEY=... 를 넣고 다시 실행하세요.');
    process.exit(1);
  }
  const { generateAct2 } = await import('@/lib/act2/generate');
  console.log('생성 중… (5개 챕터 동시)');
  const r = await generateAct2(sample);
  fs.mkdirSync('out', { recursive: true });
  fs.writeFileSync(path.join('out', 'act2-sample.json'), JSON.stringify(r, null, 2));
  const md = r.chapters.map((c, i) => `# ${i + 1}장. ${c.title}\n\n${c.intro}\n\n${c.items.map((it, j) => `## ${String(j + 1).padStart(2, '0')}. ${it.title}\n\n${it.body}`).join('\n\n')}\n\n— ${c.closing}`).join('\n\n\n');
  fs.writeFileSync(path.join('out', 'act2-sample.md'), md);
  const s = r.stats;
  console.log(`완료: ${(s.ms / 1000).toFixed(0)}초 (챕터별 ${s.perChapterMs.map(m => (m / 1000).toFixed(0) + '초').join(', ')}) · 모델 ${s.models.join(', ')}`);
  console.log(`본문 ${s.chars.toLocaleString()}자 · 토큰 입력 ${s.usage.input} / 캐시쓰기 ${s.usage.cacheWrite} / 캐시읽기 ${s.usage.cacheRead} / 출력 ${s.usage.output}`);
  console.log(`비용 $${s.usd.toFixed(3)} ≈ ${s.krw.toLocaleString()}원`);
  console.log('저장: out/act2-sample.md, out/act2-sample.json');
}
main().catch(e => { console.error(e); process.exit(1); });
