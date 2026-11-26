// 2막 화면 (2026-11-25 v2): 노엘의 편지 전문 → 편지에 다 못 쓴 이야기 다섯 장 → 추신.
// 브라우저 코드. 생성 결과(Act2Result)는 서버에서 받아 넘긴다. 날짜·표·그래프 값은 엔진에서 다시 계산해 그린다(AI가 쓴 숫자를 쓰지 않음).
import { computeChart, monthFlow } from '@/lib/saju';
import { PARTNER, TXT } from '@/content/reading';
import { V2 } from '@/content/act1';
import { ACT2, chapters, groupOf } from '@/content/act2';
import { calendarHtml } from '@/lib/flow/teaser';
import { attachStrip, renderStrip, type Beat } from '@/lib/flow/strip';
import type { SavedInput } from '@/lib/flow/flow';
import type { Act2Chapter, Act2Letter } from './generate';

/** image: 1막 '타고난 너' 제목 이미지 (facts.shown.image) */
export type Act2View = { input: SavedInput; seed: number; image: string; letter: Act2Letter; chapters: Act2Chapter[] };

const WD = '일월화수목금토';
const GLYPH: Record<string, string> = { year: '年', answer: '問', fate: '緣', days: '日', next: '來' };
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const paras = (t: string) => esc(t).split(/\n{2,}/).map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
const fill = (t: string, v: Record<string, string | number>) => Object.entries(v).reduce((a, [k, x]) => a.split(`{${k}}`).join(String(x)), t);

export function act2Beats(v: Act2View) {
  const s = v.input, male = s.sex === '남자', queer = s.orient === 'queer';
  const c = computeChart({ y: s.y, m: s.m, d: s.d, time: s.noTime ? null : s.time, sex: s.sex as '여자' | '남자', orient: (s.orient || 'hetero') as 'hetero' | 'queer' }, s.asOf ? new Date(s.asOf) : new Date());
  const g = groupOf(s.status), together = g === 'together';
  const PF = PARTNER[c.partnerEl];
  const where = (together ? TXT.whereP : (TXT.where[s.job as keyof typeof TXT.where] || TXT.where.rest))[v.seed % 4];
  const best = c.dec.strong ? `12월 ${c.dec.best.d}일 (${WD[c.dec.best.wd]})` : '올해 남은 날엔 없어. 내년에 와';
  const chs = chapters(s.status, c.dec.strong, s.worry);
  const nm = esc(s.name), L = V2.letter, W = v.letter;
  const more = (key: string) => `<a class="lmore" href="#ch-${key}">${ACT2.more} →</a>`;

  // ---- 편지 전문: 1막에서 흐렸던 자리를 그대로 채운다 ----
  const rows: [string, string][] = together
    ? [['그날', best], ['장소', where], ['그 사람의 속마음', PF.mind], ['그날 네가 해야 할 말', '편지 아래 3장에']]
    : [['인상', PF.look], ['나이', `${c.partnerAge[0]} · ${c.partnerAge[1]}`], ['성격', PF.mind], ['만나는 곳', where], ['인연 운이 가장 강한 날', best]];
  const face = male === queer ? 'fm' : 'ff'; // 1막 flow.ts와 같은 규칙 (여자·이성애 → 남자 얼굴)
  const letter = `<article class="paper letter open" aria-label="노엘의 편지" data-mark="노엘의 편지">
    <header><small>${L.kicker}</small><h3>${fill(L.to, { 이름: nm })}</h3></header>
    ${L.open.map(t => `<p>${t}</p>`).join('')}
    <p>${L.empathy[s.status] || L.empathy.solo} ${esc(W.opening)}</p>
    ${s.worry && W.worry ? `<p>${fill(L.worry, { 고민: esc(s.worry) })} ${esc(W.worry)} ${more('answer')}</p>` : ''}
    <p>${fill(L.hook, { 이미지: esc(v.image) })} ${esc(W.why)} ${more('year')}</p>
    <p class="lsub">${L.rest}</p><p>${esc(W.rest)} ${more('days')}</p>
    <p class="lsub">${L.todo}</p>
    <ol class="ltodo">${W.todo.slice(0, 3).map(t => `<li>${esc(t)}</li>`).join('')}</ol>
    <div class="lfate"><small>${together ? L.fate.together : L.fate.solo}</small>
      <p class="ltease">${esc(W.fate)}</p>
      ${together ? '' : `<div class="face soft"><div class="fimg" style="background-image:url(/img/${face}.jpg)"></div><b>그림은 분위기 참고용이야</b></div>`}
      <dl>${rows.map(([k, x]) => `<dt>${k}</dt><dd>${esc(x)}</dd>`).join('')}</dl>
      ${more('fate')}
    </div>
    <p class="lsub">${L.next}</p><p>${esc(W.next)} ${more('next')}</p>
    <p class="llast">${L.last}</p><p>${esc(W.last)}</p>
    <p class="sign">${L.sign}</p>
  </article>`;

  // ---- 장별 그림: 엔진 값으로 직접 ----
  const flow = monthFlow(c.P, male, queer, 2027);
  const max = Math.max(1, ...flow.map(m => m.score));
  const hot = [...flow].sort((a, b) => b.score - a.score || a.mo - b.mo)[0].mo;
  const flowHtml = `<section class="paper flow27"><header><small>${ACT2.flowCap}</small></header>
    <div class="bars">${flow.map(m => `<div class="${m.mo === hot ? 'hot' : ''}${m.score && ['slam', 'off', 'wrong'].includes(m.type) ? ' care' : ''}"><span style="--h:${Math.round(m.score / max * 100)}%"></span><b>${m.mo}</b></div>`).join('')}</div>
    <p class="fine">${ACT2.flowLegend} · <i class="k hot"></i>가장 뜨거운 달 · <i class="k care"></i>조심하면 좋은 달</p></section>`;
  const fateTable = `<section class="paper fate-t"><dl>${rows.map(([k, x]) => `<dt>${k}</dt><dd>${esc(x)}</dd>`).join('')}</dl></section>`;

  const say = (text: string, align: 'l' | 'c' | 'r' = 'c', size?: 'l'): Beat => ({ t: 'cap', voice: 'say', text, align, size });
  const chapterBeats = (ch: Act2Chapter, i: number): Beat[] => {
    const key = chs[i]?.key || '';
    const visual = key === 'days' ? calendarHtml(c, false) : key === 'next' ? flowHtml : key === 'fate' ? fateTable : '';
    return [
      { t: 'space', h: 40 },
      { t: 'html', html: `<div class="chapter rv" id="ch-${key}" data-mark="${i + 1}장 · ${esc(ch.title.replace(/<br>/g, ' '))}"><b>${GLYPH[key] || '章'}</b><span>${String(i + 1).padStart(2, '0')} · ${esc(ch.title.replace(/<br>/g, ' '))}</span></div>` },
      say(esc(ch.intro), i % 2 ? 'r' : 'l'),
      { t: 'html', html: `<section class="sum rv"><small>${ACT2.summary}</small><p>${esc(ch.summary)}</p></section>` },
      ...(visual ? [{ t: 'html', html: visual } as Beat] : []),
      { t: 'html', html: `<article class="paper items rv">${ch.items.map((it, j) => `<section class="item"><h4><i>${String(j + 1).padStart(2, '0')}</i>${esc(it.title)}</h4>${paras(it.body)}</section>`).join('')}</article>` },
      say(esc(ch.closing), 'c'),
      ...(chs[i]?.after ? [say(chs[i].after, i % 2 ? 'l' : 'r', 'l')] : []),
    ];
  };

  const beats: Beat[] = [
    { t: 'space', h: 40, bg: '#07070b' },
    { t: 'panel', img: 'lock_w', ratio: 1, focus: '50% 45%', flash: true, items: [] },
    say(ACT2.open[1], 'l'), say(ACT2.open[2], 'r', 'l'),
    { t: 'html', html: letter, bg: '#1c1016' },
    { t: 'space', h: 60, bg: '#0b0a10' },
    { t: 'html', html: `<div class="chapter rv" data-mark="${ACT2.appendix}"><b>頁</b><span>${ACT2.appendix}</span></div>` },
    say(ACT2.appendixLead, 'c'),
    ...v.chapters.flatMap(chapterBeats),
    { t: 'space', h: 60, bg: '#0c0b10' },
    { t: 'html', html: '<div class="psmark" data-mark="추신"></div>' },
    { t: 'panel', img: 'last_w', ratio: 9 / 14, focus: '45% 35%', items: [] },
    say(ACT2.ps[0], 'l'), say(ACT2.ps[1], 'r'), say(ACT2.ps[2], 'c', 'l'),
    { t: 'space', h: 120 },
  ];
  return beats;
}

/** 2막 화면을 root에 붙인다. review: 맨 위 ◀ ▶ 구간 이동 + 예시 원고 표시. 돌려주는 함수로 정리 */
export function mountAct2(root: HTMLElement, v: Act2View, opts: { review?: boolean; note?: string } = {}) {
  const t = document.createElement('div'); t.className = 'toon strip act2'; t.id = 'toon';
  t.innerHTML = (opts.note ? `<p class="mocknote">${esc(opts.note)}</p>` : '') + renderStrip(act2Beats(v), '#07070b');
  root.appendChild(t);
  const topOf = (el: Element) => el.getBoundingClientRect().top - t.getBoundingClientRect().top + t.scrollTop;
  const go = (el: Element | null) => { if (el) t.scrollTo({ top: topOf(el) - 64, behavior: 'smooth' }); };
  // '자세히 →' 는 같은 스크롤 안에서 부드럽게 이동
  t.addEventListener('click', e => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a.lmore');
    if (!a) return;
    e.preventDefault();
    go(t.querySelector(a.getAttribute('href')!));
  });
  let nav: HTMLElement | null = null;
  if (opts.review) {
    // 검토용 구간 이동 (1막 ?review=1 과 같은 모양): 편지 → 편지에 다 못 쓴 이야기 → 1~5장 → 추신
    const marks = [...t.querySelectorAll<HTMLElement>('[data-mark]')];
    nav = document.createElement('div'); nav.className = 'revnav top';
    nav.innerHTML = '<button type="button" data-d="-1" aria-label="이전 구간">◀</button><span></span><button type="button" data-d="1" aria-label="다음 구간">▶</button>';
    root.appendChild(nav);
    const lab = nav.querySelector('span')!;
    const cur = () => { let i = -1; marks.forEach((el, k) => { if (topOf(el) <= t.scrollTop + 120) i = k; }); return i; };
    const show = () => { const i = cur(); lab.textContent = i < 0 ? `시작 · ${marks.length}구간` : `${i + 1}/${marks.length} ${marks[i].dataset.mark}`; };
    nav.addEventListener('click', e => {
      const d = Number((e.target as HTMLElement).closest<HTMLElement>('[data-d]')?.dataset.d || 0); if (!d) return;
      const i = cur() + d;
      if (i < 0) t.scrollTo({ top: 0, behavior: 'smooth' }); else go(marks[Math.min(marks.length - 1, i)]);
    });
    t.addEventListener('scroll', show, { passive: true }); show();
  }
  const off = attachStrip(t);
  return () => { off(); nav?.remove(); t.remove(); };
}
