// 2막 미리보기 (개발 전용): out/<f>.json (scripts/act2-sample.ts 결과)을 2막 화면으로 그린다.
// 운영에서는 결제 후 생성 결과를 받아 같은 컴포넌트로 그릴 예정. 지금은 404.
import fs from 'node:fs';
import path from 'node:path';
import { notFound } from 'next/navigation';
import Act2App from '@/components/Act2App';
import { seedOf } from '@/lib/act2/facts';
import type { Act2Result } from '@/lib/act2/generate';

export const dynamic = 'force-dynamic';

export default async function Act2Preview({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  if (process.env.NODE_ENV === 'production') notFound();
  const f = ((await searchParams).f || 'act2-sample').replace(/[^\w-]/g, '');
  const file = path.join(process.cwd(), 'out', `${f}.json`);
  if (!fs.existsSync(file)) return <p style={{ padding: 24 }}>out/{f}.json 이 없어요. npx tsx scripts/act2-sample.ts 로 먼저 생성하세요.</p>;
  const r = JSON.parse(fs.readFileSync(file, 'utf8')) as Act2Result;
  return <Act2App view={{ input: r.input, seed: seedOf(r.input), image: r.facts.shown.image, letter: r.letter, chapters: r.chapters }} />;
}
