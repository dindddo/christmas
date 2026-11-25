// 1막 구매 포인트 계산·그리기. 숫자는 전부 엔진 결과에서 나온다(지어낸 숫자 없음).
import { monthFlow, type Chart } from '@/lib/saju';
import { CORE, HEARD, HEARD_LOVE, PARTNER, SAL, TXT } from '@/content/reading';
import { FREQ } from '@/content/freq';
import { FREQX } from '@/content/freq-extra';
import { BLUR_DUMMY, CALENDAR, DEADLINE, V2, VERDICT } from '@/content/act1';
import { chapters } from '@/content/act2';
import { KKUMIM } from '@/content/pricing';
import { bizLines, LEGAL_LINKS } from '@/content/legal';

const fill = (t: string, v: Record<string, string | number>) => Object.entries(v).reduce((s, [k, x]) => s.split(`{${k}}`).join(String(x)), t);

/** 연애 유형 카드 (2026-11-24): 게이지 대신 유형별 상세 4칸 */
export function verdictType(c: Pick<Chart, 'love'>) { return VERDICT.types[c.love] || VERDICT.types.clean; }
export function verdictHtml(c: Chart, nm: string, status: string) {
  const T = verdictType(c), H = VERDICT.heads;
  const together = status === 'partner' || status === 'married', grp = together ? 'together' : status;
  const sec = (h: string, t: string, cls = '') => `<section class="vsec${cls}"><b>${h}</b><p>${t}</p></section>`;
  return `<section class="verdict rv" id="verdict">
    <small class="kicker">${VERDICT.caption} · ${nm}</small>
    <h3>${T.name}</h3>
    <p class="desc">${T.desc}</p>
    ${sec(H.start, T.start)}${sec(H.dating, T.dating)}${sec(H.now, VERDICT.now[status] || VERDICT.now.solo, ' now')}${sec(H.hurt, together ? T.hurtT : T.hurt)}${sec(H.tip, (grp !== 'solo' && T.tips[grp]) || T.tip, ' tip')}
    <p class="fine">${VERDICT.note}</p>
  </section>`;
}

/** 타고난 핵심 (2026-11-25): 1막 화면과 2막 사실 묶음이 반드시 같은 함수를 쓴다.
 *  핵심 특징 = 오행 넘침/없음·연애 판정 중 가장 드문 것(25% 이하). 없으면 신살 조합(2개 이상, 25% 이하), 그것도 없으면 일간. */
export type Core = { kind: 'heavy' | 'miss' | 'love' | 'sal'; i: number; p: number };
export function innate(c: Chart, male: boolean, queer: boolean) {
  const { P, A } = c, dG = P.D.g, T = TXT, E = T.elName as string[];
  const fk = (P.H ? 'H' : 'N') + (queer ? 'q' : male ? 'm' : 'f'), F = FREQ[fk], FX = FREQX[fk];
  const cands: Core[] = [];
  A.el.forEach((n, i) => {
    if (n === 0) cands.push({ p: F['miss' + i], kind: 'miss', i });
    if (n >= (P.H ? 4 : 3)) cands.push({ p: F['heavy' + i], kind: 'heavy', i });
  });
  if (c.love !== 'clean') cands.push({ p: (c.love === 'none' || c.love === 'hidden' ? FX : F)['love_' + c.love], kind: 'love', i: -1 });
  let core: Core | null = cands.filter(x => x.p && x.p <= 25).sort((a, b) => a.p - b.p)[0] || null;
  if (!core && c.sal.length >= 2) {
    // 이 조합을 '포함하는' 사람 비율 (정확히 같은 조합만 세면 과소평가)
    const p = Object.entries(FX).filter(([k]) => k.startsWith('sal:') && c.sal.every(s => k.slice(4).split('+').includes(s))).reduce((a, [, v]) => a + v, 0);
    if (p <= 25) core = { kind: 'sal', i: -1, p };
  }
  const el = core && (core.kind === 'heavy' || core.kind === 'miss') ? core : null;
  const salNames = c.sal.map(s => SAL.items[s].name);
  const fact = !core ? '' : core.kind === 'miss' ? `여덟 글자 중에 ${E[core.i]} 기운이 하나도 없어.`
    : core.kind === 'heavy' ? `${E[core.i]} 기운이 ${A.el[core.i]}개나 몰려 있어.`
    : core.kind === 'sal' ? `${salNames.join(salNames.length === 2 ? '과 ' : ', ')}이 같이 있어.`
    : ({ none: '인연 기운이 겉에도, 땅속 글자에도 잘 안 보여.', hidden: '인연 기운이 겉에는 없고, 깊숙이 숨어 있어.', many: '인연 기운이 여러 겹으로 깔려 있어.', mixed: '끌리는 기운이 두 갈래로 갈라져 있어.', sharp: '좋아하는 마음과 날 선 말이 한 사주에 같이 있어.' } as Record<string, string>)[c.love];
  const h = HEARD[dG];
  const loveH = HEARD_LOVE[c.love] || (A.el[1] === 0 ? HEARD_LOVE.fire0 : A.el[1] >= (P.H ? 4 : 3) ? HEARD_LOVE.fire4 : h[1]);
  const hd = el ? CORE.heard[el.kind as 'heavy' | 'miss'][el.i] : [h[0], h[2]];
  const ls = queer && (c.love === 'none' || c.love === 'hidden') ? c.love + 'Q' : male && ['none', 'hidden', 'mixed'].includes(c.love) ? c.love + 'M' : c.love;
  const bridge = el?.kind === 'heavy' && (c.love === 'none' || c.love === 'hidden') ? CORE.bridge.replace('{기운}', E[el.i])
    : el?.kind === 'miss' && c.love === 'clean' && CORE.bridgeClean[el.i] ? CORE.bridgeClean[el.i] : '';
  return {
    core, fact,
    image: el ? CORE.img[el.kind as 'heavy' | 'miss'][el.i] : T.img[dG] as string,
    mean: el ? (el.kind === 'heavy' ? T.heavy : T.missing)[el.i] as string
      : core?.kind === 'love' ? CORE.loveMean[c.love] : core?.kind === 'sal' ? SAL.items[c.sal[0]].mean : T.trait[dG] as string,
    more: el ? CORE.more[el.kind as 'heavy' | 'miss'][el.i] : '',
    heard: { p: hd[0], l: loveH, inner: hd[1] },
    // 연애 한 줄: 연결 문장 + (핵심이 연애 판정이 아니면) 판정 문장 + 원국 합·충. 연애 상태 장면은 화면이 붙인다
    love: [bridge, core?.kind === 'love' ? '' : T.loveState[ls], A.natal ? T.natal[A.natal] : ''].filter(Boolean).join(' '),
    sal: c.sal.map(s => SAL.items[s]),
  };
}

/** 크리스마스 마감: 진짜 날짜만 쓴다 (KST 기준) */
export function deadline(now = new Date()) {
  const kst = new Date(now.getTime() + 9 * 3600e3);
  const today = Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate());
  const day = 86400e3, start = Date.UTC(2026, 11, 8), end = Date.UTC(2026, 11, 24);
  if (today > end) return DEADLINE.after;
  if (today === end) return DEADLINE.today;
  if (today < start) return fill(DEADLINE.before, { n: Math.round((start - today) / day) });
  return fill(DEADLINE.during, { n: Math.round((end - today) / day) });
}

/** 12/8~12/24 달력: 열리는 날·흔들릴 날은 실제 결과, 나머지는 잠김 */
export function calendarHtml(c: Chart, hideOpen = false) {
  const { dec } = c, open = dec.A && !hideOpen ? dec.best.d : -1, shake = dec.shake?.d ?? -1;
  const lead = dec.days[0].wd; // 12/8 요일
  const cells = [...Array(lead)].map(() => '<i class="pad"></i>').concat(dec.days.map(x => {
    const kind = x.d === open ? 'open' : x.d === shake ? 'shake' : dec.passers.includes(x.d) ? 'pass' : 'lock';
    const mark = kind === 'open' ? '門' : kind === 'shake' ? '!' : kind === 'pass' ? '·' : '';
    return `<div class="day ${kind}${x.d === 24 ? ' eve' : ''}"><b>${x.d}</b><em>${mark}</em></div>`;
  }));
  const L = CALENDAR.legend;
  return `<section class="cal rv"><h4>${CALENDAR.title}</h4>
    <div class="wk">${'일월화수목금토'.split('').map(w => `<span>${w}</span>`).join('')}</div>
    <div class="grid">${cells.join('')}</div>
    <ul class="legend">${open > 0 ? `<li class="open">${L.open}</li>` : ''}${dec.shake ? `<li class="shake">${L.shake}</li>` : ''}<li class="pass">${L.pass}</li><li class="lock">${L.lock}</li></ul>
  </section>`;
}

/** 2막 목차 (고민 항목 포함). 1막은 챕터 제목만 쓴다 */
export function tocParts(c: Chart, together: boolean, ctx: Record<string, string | number>, worry: string) {
  const chs = chapters(together).map(ch => ({ ...ch, items: [...ch.items] }));
  if (worry) chs[3].items.push([`“${worry}”`, '네가 물어본 고민에 대한 노엘의 답']);
  const total = chs.reduce((a, ch) => a + ch.items.length, 0);
  void ctx; // 1막에선 챕터 제목만 보여준다(tocTitlesHtml). 2막 생성은 lib/act2/facts.ts가 같은 목차를 쓴다
  return { chapters: chs, total };
}

/** '열쇠를 꽂으면 받는 것': 챕터 제목 + 실제 결과에서 채운 한 줄 힌트 (+ 고민을 골랐으면 그 답) */
export function tocTitlesHtml(chs: { title: string; hint: string }[], kicker: string, ctx: Record<string, string | number>, worry: string) {
  const rows = chs.map(ch => [ch.title.replace(/<br>/g, ' '), fill(ch.hint, ctx)]);
  if (worry) rows.push([`네가 물어본 “${worry}”`, '그 고민에 대한 노엘의 답']);
  return `<section class="chap-card rv"><header><small>${kicker}</small></header>
    <ol>${rows.map(([t, h], i) => `<li><i>${String(i + 1).padStart(2, '0')}</i><span><b>${t}</b><small class="hint">${h}</small></span></li>`).join('')}</ol>
  </section>`;
}

/** 잠긴 편지 (2026-11-25): 공감 → 끊긴 문장 → 운명의 상대는 실제 결과의 '앞부분만' 보이고 나머지는 흐림.
 *  peek: 항목 이름 → 보여줄 앞부분(실제 값의 첫 마디). 없는 항목은 통째로 흐림. 흐린 부분은 더미 문장(실제 값은 DOM에 없음) */
export function letterHtml(o: { nm: string; status: string; together: boolean; faceImg: string; image: string; worry: string; peek: Record<string, string> }) {
  const L = V2.letter, D = BLUR_DUMMY, rows = o.together ? L.rows.together : L.rows.solo;
  const blur = (t: string) => `<span class="blur" aria-hidden="true">${t}</span>`;
  const blurP = (t: string) => `<p class="blur" aria-hidden="true">${t}</p>`;
  const sub = (t: string) => `<p class="lsub">${t}</p>`;
  const tease = L.fateTease[o.together ? 'together' : o.status] || L.fateTease.solo;
  const dd = (r: string) => `<dd>${o.peek[r] ? `${o.peek[r]} ` : ''}${blur(D.value[r] || '…')}</dd>`;
  return `<article class="paper letter rv" aria-label="노엘의 편지 (잠김)">
    <header><small>${L.kicker}</small><h3>${fill(L.to, { 이름: o.nm })}</h3></header>
    ${L.open.map(t => `<p>${t}</p>`).join('')}
    <p>${L.empathy[o.status] || L.empathy.solo}</p>
    ${o.worry ? `<p>${fill(L.worry, { 고민: o.worry })} ${blur(D.line[1])}</p>` : ''}
    <p>${fill(L.hook, { 이미지: o.image })} ${blur(D.line[0])}</p>
    ${sub(L.rest)}${blurP(D.line[1])}
    ${sub(L.todo)}
    <ol class="ltodo">${D.todo.map(t => `<li>${blur(t)}</li>`).join('')}</ol>
    <div class="lfate"><small>${o.together ? L.fate.together : L.fate.solo}</small>
      <p class="ltease">${tease}</p>
      ${o.together ? '' : `<div class="face"><div class="fimg" style="background-image:url(/img/${o.faceImg}.jpg)"></div></div>`}
      <dl>${rows.filter(r => r !== '얼굴').map(r => `<dt>${r}</dt>${dd(r)}`).join('')}</dl>
    </div>
    ${sub(L.next)}${blurP(D.line[2])}
    <p class="llast">${L.last}</p>${blurP(D.line[3])}
    <p class="sign">${L.sign}</p>
    <div class="lseal"><span class="seal">封</span>${L.seal}</div>
  </article>`;
}

/** 하단 사업자 정보 (전자상거래법 표시 의무 + PG 심사). 타이틀 화면과 1막 끝에 둔다. */
export function bizFooterHtml(extra = '') {
  return `<footer class="biz ${extra}">
    <nav>${LEGAL_LINKS.map(l => `<a href="${l.href}"${l.strong ? ' class="strong"' : ''}>${l.label}</a>`).join('')}</nav>
    ${bizLines().map(t => `<p>${t}</p>`).join('')}
  </footer>`;
}

/** 연말 꾸밈비 카드: 이미 쓰기로 한 예산 옆에, 마지막 한 줄로 놓는다. 금액은 쓰지 않는다. */
export function kkumimHtml(together: boolean) {
  const C = KKUMIM.card;
  return `<section class="kkumim rv"><h4>${C.title}</h4>
    <ul>${C.items.map((t, j) => `<li><i>${String(j + 1).padStart(2, '0')}</i>${t}</li>`).join('')}
      <li class="last"><span class="seal">${C.seal}</span><b>${together ? C.last.together : C.last.solo}</b><small>${C.tag}</small></li></ul>
  </section>`;
}

const WD = '일월화수목금토';
/** 2막 목차 미리보기의 {자리}를 채우는 값. 1막 화면과 2막 생성이 반드시 같은 값을 쓰도록 여기 한 곳에서 계산 */
export function promiseCtx(c: Chart, sign: string, male: boolean, queer: boolean) {
  const { dec } = c, PF = PARTNER[c.partnerEl];
  const flow = monthFlow(c.P, male, queer, 2027);
  const hot = [...flow].sort((a, b) => b.score - a.score || a.mo - b.mo)[0];
  return {
    일: dec.A ? dec.best.d : '?', 요일: dec.A ? WD[dec.best.wd] : '?', 흔들: dec.shake ? dec.shake.d : '?',
    나이: c.partnerAge[0], 자리: `${sign}자리`,
    인상: PF.look.split(',')[0].trim(),
    성격: PF.mind.split(' ').slice(0, 2).join(' '),
    뜨거운달: hot.mo,
  };
}
