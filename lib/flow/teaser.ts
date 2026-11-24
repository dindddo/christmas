// 1막 구매 포인트 계산·그리기. 숫자는 전부 엔진 결과에서 나온다(지어낸 숫자 없음).
import { monthFlow, type Chart } from '@/lib/saju';
import { PARTNER } from '@/content/reading';
import { BLUR_DUMMY, CALENDAR, DEADLINE, V2, VERDICT } from '@/content/act1';
import { chapters } from '@/content/act2';
import { KKUMIM } from '@/content/pricing';
import { bizLines, LEGAL_LINKS } from '@/content/legal';

const fill = (t: string, v: Record<string, string | number>) => Object.entries(v).reduce((s, [k, x]) => s.split(`{${k}}`).join(String(x)), t);

/** 올해 문 앞을 그냥 지나친 지수(재미용): 올해 장면 신호 세기 + 12월 스쳐가는 날 수 + 연애 기운이 숨은 정도 */
export function passIndex(c: Pick<Chart, 'doors' | 'dec' | 'A'>): number {
  const s = c.doors.reduce((a, d) => a + d.score, 0);
  const v = 38 + Math.min(s, 18) * 1.9 + Math.min(c.dec.passers.length, 10) * 1.7 + (c.A.loveState === 'none' ? 9 : c.A.loveState === 'many' ? 5 : 0);
  return Math.max(31, Math.min(97, Math.round(v)));
}
export const passLevel = (v: number) => (v < 50 ? 0 : v < 63 ? 1 : v < 76 ? 2 : v < 88 ? 3 : 4);

export function verdictHtml(c: Chart, nm: string) {
  const T = VERDICT.types[c.A.loveState] || VERDICT.types.clean, v = passIndex(c), lv = passLevel(v);
  return `<section class="verdict rv" id="verdict">
    <small class="kicker">${VERDICT.caption} · ${nm}</small>
    <h3>${T.name}</h3>
    <p class="desc">${T.desc}</p>
    <p class="point">→ ${T.point}</p>
    <div class="gauge" style="--v:${v}">
      <div class="g-head"><span>${VERDICT.gaugeTitle}</span><b>${v}<i>%</i></b></div>
      <div class="g-bar"><span></span></div>
      <ol class="g-steps">${VERDICT.levels.map((l, i) => `<li class="${i === lv ? 'on' : ''}">${l}</li>`).join('')}</ol>
      <p class="g-line">${VERDICT.levelLine[lv]}</p>
    </div>
    <p class="fine">${VERDICT.note}</p>
    <button class="btn ghost" id="vshare" type="button">${VERDICT.share}</button>
  </section>`;
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

/** v2 목차: 챕터 제목만 */
export function tocTitlesHtml(chs: { title: string }[], kicker: string) {
  return `<section class="chap-card rv"><header><small>${kicker}</small></header>
    <ol>${chs.map((ch, i) => `<li><i>${String(i + 1).padStart(2, '0')}</i><span><b>${ch.title.replace(/<br>/g, ' ')}</b></span></li>`).join('')}</ol>
  </section>`;
}

/** v2 잠긴 편지: 첫 인사만 보이고, 나머지 문장과 운명의 상대 값은 더미 문장을 흐린다 */
export function letterHtml(nm: string, together: boolean, faceImg: string) {
  const L = V2.letter, D = BLUR_DUMMY, rows = together ? L.rows.together : L.rows.solo;
  const blurP = (t: string) => `<p class="blur" aria-hidden="true">${t}</p>`;
  return `<article class="paper letter rv" aria-label="노엘의 편지 (잠김)">
    <header><small>${L.kicker}</small><h3>${fill(L.to, { 이름: nm })}</h3></header>
    ${L.open.map(t => `<p>${t}</p>`).join('')}
    ${blurP(D.line[0])}${blurP(D.line[1])}
    <div class="lfate"><small>${together ? L.fate.together : L.fate.solo}</small>
      ${together ? '' : `<div class="face"><div class="fimg" style="background-image:url(/img/${faceImg}.jpg)"></div></div>`}
      <dl>${rows.filter(r => r !== '얼굴').map((r, i) => `<dt>${r}</dt><dd class="blur" aria-hidden="true">${D.value[(i + 1) % D.value.length]}</dd>`).join('')}</dl>
    </div>
    ${blurP(D.line[2])}
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
