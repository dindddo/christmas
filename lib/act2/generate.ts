// 2막 본문 생성 (서버 전용 — 브라우저 코드에서 import 하지 말 것. API 키가 노출된다)
// 편지 1 + 5개 챕터를 동시에 따로 생성 → 빠르고, 하나가 실패해도 그것만 다시 만든다. 화면은 편지가 오면 먼저 보여줄 수 있다.
import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import { buildFacts, type Facts } from './facts';
import { chapterPrompt, letterPrompt, systemBlocks } from './prompt';
import type { SavedInput } from '@/lib/flow/flow';

export const MODEL = 'claude-opus-5-5';
// 가격 (USD / 100만 토큰) — Claude Opus 5.5. 생각(thinking) 토큰은 출력에 포함되어 과금된다.
const PRICE = { input: 4, output: 20, cacheWrite: 5, cacheRead: 0.2 };
export const KRW_PER_USD = 1450; // 비용 환산용 가정 환율

const ChapterSchema = z.object({
  title: z.string(),
  summary: z.string(),
  intro: z.string(),
  items: z.array(z.object({ title: z.string(), body: z.string() })),
  closing: z.string(),
});
export type Act2Chapter = z.infer<typeof ChapterSchema>;
const LetterSchema = z.object({
  opening: z.string(), worry: z.string(), why: z.string(), rest: z.string(),
  todo: z.array(z.string()), fate: z.string(), next: z.string(), last: z.string(),
});
export type Act2Letter = z.infer<typeof LetterSchema>;

export type Usage = { input: number; output: number; cacheWrite: number; cacheRead: number };
export const costUSD = (u: Usage) =>
  (u.input * PRICE.input + u.output * PRICE.output + u.cacheWrite * PRICE.cacheWrite + u.cacheRead * PRICE.cacheRead) / 1e6;

async function call<T>(client: Anthropic, f: Facts, label: string, prompt: string, schema: z.ZodType<T>) {
  const started = Date.now();
  const res = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    // 글쓰기 품질이 중요하지만 추론이 무거운 일은 아니라 medium(이 모델 기본값)을 명시
    output_config: { effort: 'medium', format: betaZodOutputFormat(schema) },
    // 드물게 안전 분류기가 거절하면 서버가 다른 모델로 이어서 생성 (기본 권장 설정)
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: [{ type: 'text', text: systemBlocks(f), cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: prompt }],
  });
  if (res.stop_reason === 'refusal') throw new Error(`${label} 생성 거절: ${res.stop_details?.category ?? 'unknown'}`);
  if (res.stop_reason === 'max_tokens') throw new Error(`${label}이 최대 길이에서 잘림`);
  const out = res.parsed_output as T | null;
  if (!out) throw new Error(`${label} JSON 해석 실패`);
  const u = res.usage;
  const usage: Usage = { input: u.input_tokens, output: u.output_tokens, cacheWrite: u.cache_creation_input_tokens ?? 0, cacheRead: u.cache_read_input_tokens ?? 0 };
  return { out, usage, ms: Date.now() - started, model: res.model };
}
const retry = <T>(label: string, fn: () => Promise<T>) => fn().catch(e => {
  console.warn(`[act2] ${label} 재시도:`, e instanceof Error ? e.message : e);
  return fn();
});

/** 한 사람의 2막 전체 생성: 편지 + 다섯 장. 실패한 것은 한 번 더 시도한다 */
export async function generateAct2(input: SavedInput, client = new Anthropic()) {
  const f = buildFacts(input);
  const started = Date.now();
  const [letter, ...parts] = await Promise.all([
    retry('편지', () => call(client, f, '편지', letterPrompt(f), LetterSchema)),
    ...f.chapters.map(ch => retry(`${ch.no}장`, () => call(client, f, `${ch.no}장`, chapterPrompt(f, ch.no), ChapterSchema))),
  ]) as [Awaited<ReturnType<typeof call<Act2Letter>>>, ...Awaited<ReturnType<typeof call<Act2Chapter>>>[]];
  const all = [letter, ...parts];
  const usage = all.reduce<Usage>((a, p) => ({
    input: a.input + p.usage.input, output: a.output + p.usage.output,
    cacheWrite: a.cacheWrite + p.usage.cacheWrite, cacheRead: a.cacheRead + p.usage.cacheRead,
  }), { input: 0, output: 0, cacheWrite: 0, cacheRead: 0 });
  const L = letter.out;
  const letterChars = [L.opening, L.worry, L.why, L.rest, ...L.todo, L.fate, L.next, L.last].join('').length;
  const chars = letterChars + parts.reduce((a, p) => a + p.out.items.reduce((b, it) => b + it.body.length, 0) + p.out.intro.length + p.out.closing.length + p.out.summary.length, 0);
  return {
    input,
    facts: f,
    letter: L,
    chapters: parts.map(p => p.out),
    stats: {
      ms: Date.now() - started,
      perPartMs: all.map(p => p.ms),
      models: [...new Set(all.map(p => p.model))],
      letterChars,
      chars,
      usage,
      usd: costUSD(usage),
      krw: Math.round(costUSD(usage) * KRW_PER_USD),
    },
  };
}
export type Act2Result = Awaited<ReturnType<typeof generateAct2>>;
