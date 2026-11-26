// 2막 미리보기
//  - 개발: /act2?f=<out 파일> (scripts/act2-sample.ts 결과). 파일이 없으면 검토용 예시 원고
//  - 운영: /act2?review=1 일 때만 검토용 예시 원고(data/act2-mock.json, 가상 인물·손글씨, AI 결과 아님). 그 외엔 404
//  결제 연동 후에는 결제한 사람의 생성 결과를 같은 컴포넌트로 그린다.
import fs from 'node:fs';
import path from 'node:path';
import { notFound } from 'next/navigation';
import Act2App from '@/components/Act2App';
import { seedOf } from '@/lib/act2/facts';
import type { Act2Result } from '@/lib/act2/generate';
import type { Act2View } from '@/lib/act2/render';
import mock from '@/data/act2-mock.json';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };

const MOCK_NOTE = '검토용 예시 원고예요 (가상 인물 · 손으로 쓴 예시, 실제 AI 결과 아님)';

export default async function Act2Preview({ searchParams }: { searchParams: Promise<{ f?: string; review?: string }> }) {
  const q = await searchParams, prod = process.env.NODE_ENV === 'production';
  if (prod && q.review === undefined) notFound();
  const m = mock as unknown as Omit<Act2View, 'seed'>;
  let view: Act2View = { ...m, seed: seedOf(m.input) }, note = MOCK_NOTE;
  if (!prod && q.f) {
    const file = path.join(process.cwd(), 'out', `${q.f.replace(/[^\w-]/g, '')}.json`);
    if (fs.existsSync(file)) {
      const r = JSON.parse(fs.readFileSync(file, 'utf8')) as Act2Result;
      view = { input: r.input, seed: seedOf(r.input), image: r.facts.shown.image, letter: r.letter, chapters: r.chapters };
      note = (r.stats as { mock?: boolean }).mock ? MOCK_NOTE : '';
    }
  }
  return <Act2App view={view} note={note} />;
}
