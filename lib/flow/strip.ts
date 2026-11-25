// 세로 웹툰 렌더러: 콘티(Beat[]) → 끊김 없이 이어지는 한 줄짜리 스크롤 화면.
// - 컷 사이 검은 틈 없음. 장면 색(bg)이 스크롤을 따라 다음 장면 색으로 녹아든다.
// - 컷 위아래는 배경으로 페이드, 말풍선은 컷 경계를 넘어 다음 장면으로 걸칠 수 있다.
// - 움직임은 시간 재생이 아니라 스크롤 위치에 묶는다(패럴랙스).
import { FEATHER } from '@/content/prologue';

export type Item = {
  k: 'say' | 'think' | 'off' | 'cap' | 'sfx';
  text: string;
  x: 'l' | 'r' | 'c';
  y: number; // 컷 높이 기준 %
  big?: boolean;
  size?: number; // sfx 글자 크기(px)
};
export type Fx = { snow?: number; glow?: number[]; fe?: number[][]; shake?: number };
export type Beat =
  | { t: 'space'; h: number; bg?: string }
  | { t: 'cap'; text: string; voice: 'noel' | 'narrator' | 'say'; align?: 'l' | 'c' | 'r'; size?: 'l'; small?: string; bg?: string }
  // vid: public/vid/{vid}.mp4. img를 포스터로 깔고, 컷이 화면에 들어오면 1번 재생 → 마지막 프레임에서 멈춤(loop면 반복).
  //      재생 실패·모션 줄이기·저전력 모드면 img만 보인다.
  | { t: 'panel'; img?: string; vid?: string; loop?: boolean; fill?: string; ratio: number; focus?: string; zoom?: number; tight?: boolean; flash?: boolean; scene?: 'light-feather'; enter?: 'zoom' | 'left' | 'right' | 'blur' | 'iris' | 'pop'; fx?: Fx; items?: Item[]; bg?: string }
  | { t: 'html'; html: string; bg?: string; id?: string }
  // 탭해서 넘기는 장면: 버튼(행동 지문)을 눌러야 뒤 장면이 열린다
  | { t: 'tap'; label: string; beats: Beat[]; bg?: string };

// 웹툰 말풍선은 따옴표·괄호를 쓰지 않는다 (모양이 말/속마음을 구분한다). 문구 원본은 그대로 두고 그릴 때만 뺀다.
const bare = (t: string) => t.replace(/^\s*["“(]+/, '').replace(/["”)]+\s*$/, '');

/** 글자 하나하나를 span으로 감싸 CSS로 타이핑 연출 (태그·<br>은 보존) */
function typed(html: string) {
  let i = 0;
  // 어절 단위로 묶어서(줄바꿈은 어절 사이에서만), 안의 글자는 하나씩 나타나게
  return html.split(/(<[^>]+>)/).map(part => part.startsWith('<') ? part
    : part.split(/( +)/).map(w => /^ +$/.test(w) || !w ? w
      : `<span class="w">${[...w].map(ch => `<span class="ch" style="--i:${i++}">${ch}</span>`).join('')}</span>`).join('')).join('');
}
// 그림 대신 그래픽으로 그리는 장면 (AI 이미지 대체)
const SCENES: Record<string, string> = {
  // P3: 어둠 속 빛 한 줄기 + 떨어지는 깃털. 날개는 보이지 않는다(프롤로그 규칙)
  'light-feather': `<span class="beam"></span><span class="floorglow"></span>
    <span class="mote" style="left:30%;top:30%"></span><span class="mote" style="left:62%;top:44%;animation-delay:1s"></span>
    <span class="mote" style="left:48%;top:18%;animation-delay:2s"></span><span class="mote" style="left:40%;top:62%;animation-delay:.5s"></span>
    <span class="mote" style="left:70%;top:24%;animation-delay:1.6s"></span>
    <span class="bigfeather">${FEATHER}</span>`,
};
const ENTRANCES = ['zoom', 'left', 'blur', 'right', 'iris'] as const;
let entr = 0;

// 효과음 글자(툭·반짝·끼익…)는 빼기로 함(2026-11-22 피드백). 다시 쓰려면 true
export const SFX_TEXT = false;

function item(it: Item) {
  if (it.k === 'sfx' && !SFX_TEXT) return '';
  const pos = `top:${it.y}%`;
  const side = `x-${it.x}`;
  if (it.k === 'sfx') return `<span class="sfx rv ${side}" style="${pos};${it.size ? `font-size:${it.size}px` : ''}">${it.text}</span>`;
  if (it.k === 'cap') return `<p class="incap rv ${side}${it.big ? ' big' : ''}" style="${pos}">${it.text}</p>`;
  return `<p class="bub ${it.k} rv ${side}${it.big ? ' big' : ''}" style="${pos}">${bare(it.text)}</p>`;
}

export function renderStrip(beats: Beat[], start = '#0b0a10'): string {
  let cur = start;
  return beats.map((b): string => {
    const from = cur; if (b.bg) cur = b.bg;
    const ground = from === cur ? `background:${cur}` : `background:linear-gradient(${from}, ${cur})`;
    if (b.t === 'space') return `<div class="gap" style="height:${b.h}px;${ground}"></div>`;
    if (b.t === 'cap') {
      const dir = b.voice === 'say' && /^\s*\(/.test(b.text); // 괄호로 시작 = 지문(표정·행동)
      const cls = dir ? `voice dir a-${b.align || 'l'}` : `voice ${b.voice} a-${b.align || 'l'}${b.size === 'l' ? ' big' : ''}`;
      const raw = b.voice === 'say' && !dir ? bare(b.text) : b.text;
      const typing = !dir && (b.size === 'l' || b.voice === 'narrator');
      const text = typing ? typed(raw) : raw;
      return `<div class="gap" style="${ground}"><p class="${cls} rv${typing ? ' typing' : ''}">${b.small ? `<small>${b.small}</small>` : ''}${text}</p></div>`;
    }
    if (b.t === 'tap') {
      return `<div class="gap tapgap" style="${ground}"><button class="act rv" type="button" data-tap>${b.label}</button>
        <div class="tapbox" hidden>${renderStrip(b.beats, cur)}</div></div>`;
    }
    if (b.t === 'html') return `<div class="gap html"${b.id ? ` id="${b.id}"` : ''} style="${ground}">${b.html}</div>`;
    const fx = b.fx || {};
    const focus = b.focus || '50% 40%';
    const art = b.scene ? `<div class="art scene ${b.scene}">${SCENES[b.scene]}</div>` : b.img
      ? `<div class="art"><img src="/img/${b.img}.jpg" alt="" loading="lazy" style="object-position:${focus};transform-origin:${focus};--z:${b.zoom || 1}">${b.vid
        // Safari 음소거 자동재생: muted/playsinline 속성을 src보다 먼저. src는 화면 근처에 오면 넣는다(data-src)
        ? `<video class="cutvid" muted playsinline webkit-playsinline preload="none"${b.loop ? ' loop' : ''} data-src="/vid/${b.vid}.mp4" style="object-position:${focus};transform-origin:${focus};--z:${b.zoom || 1}"></video>` : ''}</div>`
      : `<div class="art" style="background:${b.fill || cur}"></div>`;
    const enter = b.enter || (b.tight ? 'pop' : ENTRANCES[entr++ % ENTRANCES.length]);
    return `<figure class="cut${b.tight ? ' tight' : ''}${fx.shake ? ' shake' : ''}${b.flash ? ' flash' : ''}" data-enter="${enter}" style="--r:${b.ratio};${ground}">
      ${art}
      ${b.flash ? '<span class="speed"></span><span class="flashfx"></span>' : ''}
      ${fx.glow ? `<span class="glow" style="left:${fx.glow[0]}%;top:${fx.glow[1]}%"></span>` : ''}
      ${fx.snow ? `<span class="snow"></span>${fx.snow > 1 ? '<span class="snow s2"></span>' : ''}` : ''}
      ${(fx.fe || []).map(([x, y, d, dl]) => `<span class="feather" style="left:${x}%;top:${y}%;--fy:${d}px;--fd:${dl}s">${FEATHER}</span>`).join('')}
      ${(b.items || []).map(item).join('')}
    </figure>`;
  }).join('');
}

/** 스크롤 연출 붙이기: 글·말풍선 떠오르기 + 컷 패럴랙스. 정리 함수를 돌려준다 */
export type StripHooks = { onTap?: () => void; onReveal?: (el: Element) => void };
export function attachStrip(scroller: HTMLElement, hooks: StripHooks = {}) {
  const { onTap, onReveal } = hooks;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // 영상 컷: 화면 근처(아래 600px)에 오면 받기 시작, 컷이 보이면 재생. 재생되면 .on으로 포스터 위에 페이드인
  const playVid = (cut: Element) => {
    const v = cut.querySelector<HTMLVideoElement>('video.cutvid');
    if (!v || reduce) return;
    if (!v.src) v.src = v.dataset.src!;
    v.muted = true;
    v.play().then(() => v.classList.add('on')).catch(() => { /* 자동재생 막힘 → 정지 컷 유지 */ });
  };
  const pre = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const v = e.target.querySelector<HTMLVideoElement>('video.cutvid');
    if (v && !v.src && !reduce) { v.preload = 'auto'; v.src = v.dataset.src!; }
    pre.unobserve(e.target);
  }), { root: scroller, rootMargin: '0px 0px 600px 0px' });
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); onReveal?.(e.target); playVid(e.target); }
  }), { root: scroller, threshold: .35, rootMargin: '0px 0px -8% 0px' });
  scroller.querySelectorAll('.rv, .cut').forEach(el => io.observe(el));
  scroller.querySelectorAll('.cut').forEach(el => { if (el.querySelector('video.cutvid')) pre.observe(el); });

  const cuts = [...scroller.querySelectorAll<HTMLElement>('.cut')];
  let raf = 0;
  const tick = () => {
    raf = 0;
    const vh = scroller.clientHeight, top = scroller.getBoundingClientRect().top;
    for (const c of cuts) {
      const r = c.getBoundingClientRect(), mid = r.top - top + r.height / 2;
      if (r.bottom < top - 200 || r.top > top + vh + 200) continue;
      c.style.setProperty('--p', Math.max(-1, Math.min(1, (mid - vh / 2) / vh)).toFixed(3));
    }
  };
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(tick); };
  if (!reduce) { scroller.addEventListener('scroll', onScroll, { passive: true }); tick(); }
  const taps = (e: Event) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-tap]');
    if (!btn) return;
    const box = btn.nextElementSibling as HTMLElement;
    btn.classList.add('used'); btn.setAttribute('disabled', '');
    box.hidden = false; onTap?.();
    requestAnimationFrame(() => { tick(); box.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); });
  };
  scroller.addEventListener('click', taps);
  return () => { scroller.removeEventListener('click', taps); io.disconnect(); pre.disconnect();
    scroller.querySelectorAll<HTMLVideoElement>('video.cutvid').forEach(v => v.pause()); scroller.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
}
