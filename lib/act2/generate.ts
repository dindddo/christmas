// 2막 본문 생성 (서버 전용 — 브라우저 코드에서 import 하지 말 것. API 키가 노출된다)
// 5개 챕터를 동시에 따로 생성 → 빠르고, 한 챕터가 실패해도 그 챕터만 다시 만든다.
import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import { buildFacts, type Facts } from './facts';
import { chapterPrompt, systemBlocks } from './prompt';
import type { SavedInput } from '@/lib/flow/flow';

export const MODEL = 'claude-opus-5-5';
// 가격 (USD / 100만 토큰) — Claude Opus 5.5. 생각(thinking) 토큰은 출력에 포함되어 과금된다.
const PRICE = { input: 4, output: 20, cacheWrite: 5, cacheRead: 0.2 };
export const KRW_PER_USD = 1450; // 비용 환산용 가정 환율

const ChapterSchema = z.object({
  title: z.string(),
  intro: z.string(),
  items: z.array(z.object({ title: z.string(), body: z.string() })),
  closing: z.string(),
});
export type Act2Chapter = z.infer<typeof ChapterSchema>;

export type Usage = { input: number; output: number; cacheWrite: number; cacheRead: number };
export const costUSD = (u: Usage) =>
  (u.input * PRICE.input + u.output * PRICE.output + u.cacheWrite * PRICE.cacheWrite + u.cacheRead * PRICE.cacheRead) / 1e6;

async function generateChapter(client: Anthropic, f: Facts, no: number) {
  const started = Date.now();
  const res = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    // 글쓰기 품질이 중요하지만 추론이 무거운 일은 아니라 medium(이 모델 기본값)을 명시
    output_config: { effort: 'medium', format: betaZodOutputFormat(ChapterSchema) },
    // 드물게 안전 분류기가 거절하면 서버가 다른 모델로 이어서 생성 (기본 권장 설정)
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: [{ type: 'text', text: systemBlocks(f), cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: chapterPrompt(f, no) }],
  });
  if (res.stop_reason === 'refusal') throw new Error(`${no}장 생성 거절: ${res.stop_details?.category ?? 'unknown'}`);
  if (res.stop_reason === 'max_tokens') throw new Error(`${no}장이 최대 길이에서 잘림`);
  const ch = res.parsed_output;
  if (!ch) throw new Error(`${no}장 JSON 해석 실패`);
  const u = res.usage;
  const usage: Usage = { input: u.input_tokens, output: u.output_tokens, cacheWrite: u.cache_creation_input_tokens ?? 0, cacheRead: u.cache_read_input_tokens ?? 0 };
  return { no, chapter: ch, usage, ms: Date.now() - started, model: res.model };
}

/** 한 사람의 2막 전체 생성. 실패한 챕터는 한 번 더 시도한다 */
export async function generateAct2(input: SavedInput, client = new Anthropic()) {
  const f = buildFacts(input);
  const started = Date.now();
  const tryOnce = (no: number) => generateChapter(client, f, no).catch(async e => {
    console.warn(`[act2] ${no}장 재시도:`, e instanceof Error ? e.message : e);
    return generateChapter(client, f, no);
  });
  const parts = await Promise.all(f.chapters.map(ch => tryOnce(ch.no)));
  const usage = parts.reduce<Usage>((a, p) => ({
    input: a.input + p.usage.input, output: a.output + p.usage.output,
    cacheWrite: a.cacheWrite + p.usage.cacheWrite, cacheRead: a.cacheRead + p.usage.cacheRead,
  }), { input: 0, output: 0, cacheWrite: 0, cacheRead: 0 });
  const chars = parts.reduce((a, p) => a + p.chapter.items.reduce((b, it) => b + it.body.length, 0) + p.chapter.intro.length + p.chapter.closing.length, 0);
  return {
    facts: f,
    chapters: parts.map(p => p.chapter),
    stats: {
      ms: Date.now() - started,
      perChapterMs: parts.map(p => p.ms),
      models: [...new Set(parts.map(p => p.model))],
      chars,
      usage,
      usd: costUSD(usage),
      krw: Math.round(costUSD(usage) * KRW_PER_USD),
    },
  };
}
