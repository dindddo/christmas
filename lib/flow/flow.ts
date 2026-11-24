/* eslint-disable @typescript-eslint/no-explicit-any */
// 화면 흐름: 타이틀 → 프롤로그(세로 웹툰) → 채팅 입력 → 로딩 → 1막(세로 웹툰) → 결제 CTA
// prototype/index.html 의 STEPS 를 연출 그대로 옮겼다. 문구는 content/, 계산은 lib/saju/.
import { computeChart, sunSign, elG, fam, god, GAN, GAN_K, JI, JI_K, JI_MAIN, jeolAt, lunar2solar, sijin, toMin, type Pillar } from '@/lib/saju';
import { PROLOGUE } from '@/content/prologue';
import { attachStrip, renderStrip, type Beat } from '@/lib/flow/strip';
import { JOBS, LOADING, LOADING_SUB, QUESTIONS, STATUS, TITLE, WORRIES, type Choice } from '@/content/chat';
import { ACT1, DEADLINE, SHAKE, V2, VERDICT } from '@/content/act1';
import { bizFooterHtml, calendarHtml, deadline, kkumimHtml, letterHtml, passIndex, promiseCtx, tocParts, tocTitlesHtml, verdictHtml } from '@/lib/flow/teaser';
import { BGM_ENABLED, sound } from '@/lib/flow/sound';
import { FREQ } from '@/content/freq';
import {
  GAN_COLOR, HEARD, HEARD_LOVE, JEOL_NAME, JI_ANIMAL, SIJIN_IMG, TXT, WORK_LINE, WORK_PLACE, WORRY,
} from '@/content/reading';
import { KKUMIM, priceAmount, priceArm, priceText } from '@/content/pricing';
import { PAY_NOTICE } from '@/content/legal';
import { track } from '@/lib/track';

export type FlowOptions = { dev: boolean; onPay?: (s: SavedInput) => void };
export type SavedInput = {
  name: string; sex: string; y: number; m: number; d: number; time: string; noTime: boolean;
  status: string; orient: string; job: string; wk: string; worry: string;
};

// 운영 빌드에서는 상수 false → 테스트 기본값·건너뛰기 버튼 코드가 번들에서 통째로 빠진다
const DEV_BUILD = process.env.NODE_ENV !== 'production';
// 채팅 질문별 노엘 컷: 질문이 진행될수록 가까워진다 (2026-11-22, 기존 생성 컷 검수 후 배치)
// 0 인사·1 이름·2 성별·3 생년월일·4 연애 상태·5 취향·6 직업·7 고민
// (2026-11-22 v3) 중복이던 6·7번에 새 컷(chat7 미소 바스트, chat8 보타이 만지기)을 넣어 8단계 모두 다른 거리로
// 대화 배경: 질문 순서대로(인사·이름·성별·생일·옆사람·취향·일·고민). 1인칭, 질문마다 카메라가 다가감
// (2026-11-24) 글로시 실사풍(실사 70% + 일러스트 30%, 한국 미형 노엘)으로 교체. 원본 public/img/v3/gl_chat_N.png
// 이전 반실사판은 v3/chat_v3_N.png, 더 예전 컷은 chat1~8.jpg로 남겨 둠
const CHAT_BG = ['chatv1', 'chatv2', 'chatv3', 'chatv4', 'chatv5', 'chatv6', 'chatv7', 'chatv8'];
const ENTER_IMG = '/img/enter.jpg'; // 들어가는 순간: 문 너머 원탁의 노엘 (원본 public/img/v3/enter_start.png)
const BG_KEYS = ['s0', 'box', 'book', 'loading', 'closed', 'last', 'resA', 'resB', 'lock', ...new Set(CHAT_BG)];
const WD = '일월화수목금토';

export function mountFlow(root: HTMLElement, opts: FlowOptions) {
  const dev = DEV_BUILD && opts.dev;
  const DEFAULTS = DEV_BUILD && dev
    ? { sex: '남자', name: '태준', y: 1989, m: 3, d: 18, time: '13:00' } // 테스트용 기본값: 개발 모드에서만
    : { sex: '', name: '', y: 0, m: 0, d: 0, time: '' };
  const fresh = () => ({ cal: 'solar', leap: false, lb: null as any, wk: '', orient: '', job: '', worry: '', R: null as any, fast: false, noTime: false, status: '', step: 0, pro: false, adj: null as any, ...DEFAULTS });
  let S: any = fresh();
  let alive = true;
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  root.innerHTML = `
    <div class="bg" id="bg"></div>
    <canvas class="dust" id="dust" aria-hidden="true"></canvas>
    <div class="shade"></div>
    ${dev ? '<span class="tag">개발 모드 · 실제 계산</span>' : ''}
    <button class="restart" id="restart" type="button">처음으로</button>
    <div class="sndwrap" id="sndwrap"></div>
    <div class="logo rofan" id="logo">
      <small><b>✦</b>크리스마스에<b>✦</b></small>
      <div class="ttl"><em aria-hidden="true">Fated Door</em><span class="ko">운명의 문을<br>열어 버렸다</span><b class="spk s1" aria-hidden="true">✦</b><b class="spk s2" aria-hidden="true">✦</b><b class="spk s3" aria-hidden="true">✦</b></div>
      <i class="orn" aria-hidden="true"><svg viewBox="0 0 220 24"><path d="M6 12h78M136 12h78" stroke="url(#og)" stroke-width="1"/><path d="M84 12c8-9 16-9 20 0-4 9-12 9-20 0zM136 12c-8-9-16-9-20 0 4 9 12 9 20 0z" fill="none" stroke="url(#og)" stroke-width="1"/><path d="M110 4l5 8-5 8-5-8z" fill="url(#og)"/><circle cx="6" cy="12" r="1.6" fill="#e9d3b0"/><circle cx="214" cy="12" r="1.6" fill="#e9d3b0"/><defs><linearGradient id="og" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="220" y2="0"><stop offset="0" stop-color="#e9d3b0" stop-opacity=".55"/><stop offset=".5" stop-color="#fff3dc"/><stop offset="1" stop-color="#e9d3b0" stop-opacity=".55"/></linearGradient></defs></svg></i>
    </div>
    <section class="panel" id="panel" aria-live="polite"></section>`;
  const $ = (id: string) => root.querySelector<HTMLElement>('#' + id)!;
  const bg = $('bg'), panel = $('panel'), logo = $('logo');

  const imgs: Record<string, HTMLImageElement> = {};
  BG_KEYS.forEach(k => { const im = new Image(); im.src = `/img/${k}.jpg`; im.alt = ''; bg.appendChild(im); imgs[k] = im; });
  // 배경 위에 겹치는 영상(키 → 경로). 이미지 위에 겹쳐 두고 재생되면 페이드인, 실패하면 정지 이미지 유지.
  // 움직임 줄이기 설정이면 영상 대신 정지 이미지만 쓴다.
  // (2026-11-23) 타이틀 반복 영상(s0_loop.mp4)은 퀄리티 문제로 뺌 → 영상은 '들어가는 순간' 1개만 쓴다
  const BG_VIDEOS: Record<string, string> = {};
  const vids: Record<string, HTMLVideoElement> = {};
  const reduceMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduceMotion) Object.entries(BG_VIDEOS).forEach(([k, src]) => {
    // Safari는 src보다 muted/playsinline 속성이 먼저 있어야 음소거 자동재생을 허용한다 → 속성을 먼저 달고 src는 마지막에
    const v = document.createElement('video');
    v.className = 'bgvid';
    ['muted', 'playsinline', 'webkit-playsinline', 'loop', 'autoplay'].forEach(a => v.setAttribute(a, ''));
    v.muted = true; v.defaultMuted = true; v.playsInline = true; v.loop = true; v.preload = 'auto';
    v.addEventListener('playing', () => { if (curBg === k) v.classList.add('on'); });
    v.src = src;
    bg.appendChild(v); vids[k] = v;
  });
  // 자동재생이 막힌 브라우저: 첫 터치·클릭·스크롤 때 다시 시도
  const retryPlay = () => { if (curBg && vids[curBg]?.paused) vids[curBg].play().catch(() => {}); };
  ['pointerdown', 'touchstart', 'wheel', 'keydown'].forEach(ev => root.addEventListener(ev, retryPlay, { passive: true }));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) retryPlay(); });
  let curBg: string | null = null;
  function setBg(k: string) {
    if (curBg === k) return;
    Object.values(imgs).forEach(i => i.classList.remove('on'));
    Object.values(vids).forEach(v => { v.classList.remove('on'); v.pause(); });
    void imgs[k].offsetWidth; imgs[k].classList.add('on'); curBg = k;
    // (2026-11-23) 대화 컷 CSS 효과(.bg.live: 숨쉬기·촛불·금빛 먼지)는 "효과 별로" 피드백으로 끔. 다시 켜려면 아래 주석 해제
    // bg.classList.toggle('live', k.startsWith('chat'));
    vids[k]?.play().catch(() => { /* 자동재생 막히면 정지 이미지 유지 */ });
  }

  // ---- 소리: lib/flow/sound.ts (배경음·효과음 합성) ----
  // 페이지 넘김 '탁탁' 잡음은 쓰지 않는다(피드백). 종소리 계열만 남김
  const sfx = (kind: string) => { if (kind === 'chime' || kind === 'key') sound.play(kind); };
  const soundUi = () => {
    const p = sound.prefs;
    const on = (BGM_ENABLED && p.bgm) || p.sfx;
    return `<button class="snd" id="snd" type="button" aria-expanded="false" aria-label="소리 설정">${on ? '♪' : '♪̸'}</button>
      <div class="sndpop" id="sndpop" hidden>
        ${BGM_ENABLED ? `<label><input type="checkbox" data-snd="bgm" ${p.bgm ? 'checked' : ''}> 배경음</label>` : ''}
        <label><input type="checkbox" data-snd="sfx" ${p.sfx ? 'checked' : ''}> 효과음</label>
      </div>`;
  };
  // ---- 노엘 대사 타자기 ----
  let typing: ReturnType<typeof setInterval> | undefined;
  function type(el: HTMLElement, text: string, speed = 45): Promise<void> {
    clearInterval(typing);
    if (reduce) { el.textContent = text; return Promise.resolve(); }
    el.textContent = ''; let i = 0;
    return new Promise(res => { typing = setInterval(() => { el.textContent = text.slice(0, ++i); if (i >= text.length) { clearInterval(typing); res(); } }, speed); });
  }
  function wait(ms: number) { return new Promise<void>(r => { const t = setTimeout(() => { timers.delete(t); r(); }, reduce ? 0 : ms); timers.add(t); }); }
  const ln = () => $('ln');
  const on = (id: string, fn: () => void) => $(id).addEventListener('click', fn);
  const esc = (s: any) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
  const fill = (t: string, v: Record<string, string | number>) => Object.entries(v).reduce((s, [k, x]) => s.split(`{${k}}`).join(String(x)), t);
  const isTogether = () => ['partner', 'married'].includes(S.status);

  function next(n: number, sound = 'flip') { if (!alive) return; sfx(sound); S.step = n; STEPS[n](); }

  // ---- 계산: 입력 → 사주 → 1막 문구 ----
  function calc() {
    const male = S.sex === '남자', queer = S.orient === 'queer', T = TXT;
    const c = computeChart({ y: +S.y, m: +S.m, d: +S.d, time: S.noTime ? null : S.time, sex: S.sex, orient: S.orient || 'hetero' });
    const { P, A } = c, dG = P.D.g;
    S.adj = c.kst;
    const yr = [...T.year[elG(dG)]]; if (male && T.yearM[elG(dG)]) yr[0] = T.yearM[elG(dG)];
    const ls = queer && A.loveState === 'none' ? 'noneQ' : male && (A.loveState === 'none' || A.loveState === 'mixed') ? A.loveState + 'M' : A.loveState;
    const elLine = A.missing.length ? `넌 ${T.elName[A.missing[0]]} 기운이 비어 있어. ${T.missing[A.missing[0]]}`
      : A.heavy >= 0 ? `넌 ${T.elName[A.heavy]} 기운이 넘쳐. ${T.heavy[A.heavy]}` : '';
    const h = HEARD[dG];
    const loveH = HEARD_LOVE[A.loveState] || (A.el[1] === 0 ? HEARD_LOVE.fire0 : A.el[1] >= (P.H ? 4 : 3) ? HEARD_LOVE.fire4 : h[1]);
    S.R = {
      ...c,
      image: `${T.season(P.M.j)} ${T.img[dG]}`,
      gyeok: A.famN[fam(A.gyeok)] >= 2 ? T.gyeok[A.gyeok] : '',
      strength: (A.ratio >= .55 || A.ratio <= .3) ? T.strength[A.strength] : '',
      elLine,
      love: [T.loveState[ls], A.natal ? T.natal[A.natal] : '', T.scene[S.status] || ''].filter(Boolean).join(' '),
      heard: { p: h[0], l: loveH, inner: h[2] },
      workLine: S.job ? `${WORK_PLACE[S.job]} ${WORK_LINE[fam(god(dG, 2))]}` : '',
      yearLine: `${yr[0]} ${T.yearTone[A.yearGood ? 1 : 0]}`, reframe: yr[1], wuLine: T.wu[[7, 0, 1].find(j => j === P.D.j) as number] || '',
    };
  }
  // 입력에서 나온 고정 난수 (같은 입력이면 같은 문장)
  function seed() { const s = `${S.sex}|${S.name}|${S.y}${S.m}${S.d}|${S.time}|${S.status}|${S.orient}|${S.job}`; let x = 2166136261; for (const c of s) { x ^= c.charCodeAt(0); x = Math.imul(x, 16777619); } return x >>> 0; }

  // ---- 문패 앞 도입: 사실(날짜·요일·절기·시진)로 믿음을 주고, 드문 특징으로 "특이한 팔자"를 짚는다 ----
  function introLines() {
    const R = S.R, P = R.P, A = R.A, y = +S.y, m = +S.m, d = +S.d;
    const wd = WD[new Date(y, m - 1, d).getDay()];
    const K = S.adj, JA = jeolAt(K.y, K.m, K.d, K.time ? toMin(K.time) : null), ji = JA.k, since = JA.since;
    const gwa = (w: string) => ((w.charCodeAt(w.length - 1) - 0xAC00) % 28 ? '과' : '와');
    const season = since <= 2 ? `${JEOL_NAME[ji]} 지나고 얼마 안 돼서` : `${JEOL_NAME[ji]}${gwa(JEOL_NAME[ji])} ${JEOL_NAME[(ji + 1) % 12]} 사이`;
    const sj = S.noTime ? null : sijin(K.time);
    const born = sj ? `${season}, ${SIJIN_IMG[sj.idx]}에 태어났어.` : `${season} 태어났어.`.replace('사이 태어났어', '사이에 태어났어');
    const key = (P.H ? 'H' : 'N') + (S.orient === 'queer' ? 'q' : S.sex === '남자' ? 'm' : 'f'), F = FREQ[key], E = TXT.elName;
    const cands: [number, string][] = [];
    A.el.forEach((c: number, i: number) => {
      if (c === 0) cands.push([F['miss' + i], `여덟 글자 중에 ${E[i]} 기운이 하나도 없어.`]);
      if (c >= (P.H ? 4 : 3)) cands.push([F['heavy' + i], `${E[i]} 기운이 ${c}개나 몰려 있어.`]);
    });
    if (A.loveState === 'none') cands.push([F.love_none, '인연 기운이 겉으로 하나도 안 드러나 있어.']);
    if (A.loveState === 'many') cands.push([F.love_many, '인연 기운이 여러 겹으로 깔려 있어.']);
    if (A.loveState === 'mixed') cands.push([F.love_mixed, '끌리는 기운이 두 갈래로 갈라져 있어.']);
    if (A.loveState === 'sharp') cands.push([F.love_sharp, '좋아하는 마음과 날 선 말이 한 사주에 같이 있어.']);
    const r = cands.filter(c => c[0] && c[0] <= 25).sort((a, b) => a[0] - b[0])[0];
    const rare = r ? [r[1], `100명 중에 ${Math.max(1, Math.round(r[0]))}명 정도만 이래.`] : [`${R.ilju} 일주는 60명 중 1명이야.`, '그중에서도 이 계절에 태어난 사람은 더 드물고.'];
    const tz = !K.shift ? '' : K.shift < 0 ? `그해 여름은 서머타임이었으니까, ${K.shift === -60 ? '한 시간' : '30분'} 당겨서 봤어.` : '그땐 시계가 지금이랑 30분 달랐으니까, 그것까지 맞춰서 봤어.';
    return { tz, date: `${y}년 ${m}월 ${d}일, ${wd}요일.`, born, year: `사주로 치면 ${GAN_COLOR[P.Y.g]} ${JI_ANIMAL[P.Y.j]}의 해.`, rare };
  }


  function saved(): SavedInput {
    return { name: S.name, sex: S.sex, y: +S.y, m: +S.m, d: +S.d, time: S.time, noTime: S.noTime, status: S.status, orient: S.orient, job: S.job, wk: S.wk, worry: S.worry };
  }

  const cleanups: (() => void)[] = [];
  // 웹툰 장면이 화면에 들어오는 순간의 소리·흔들림
  const reveal = (el: Element) => {
    const c = el.classList;
    // 효과음 글자의 쿵 소리·흔들림, 말풍선 톡 소리는 뺌(피드백: 툭툭 거림)
    if (c.contains('cut') && c.contains('flash')) { sound.play('whoosh'); sound.play('sparkle'); }
    else if (c.contains('verdict')) sound.play('heart');
  };

  const STEPS: Record<number, () => void> = {
    // 0. 타이틀
    0() {
      setBg('s0'); logo.style.opacity = '1';
      panel.innerHTML = `<p class="tagline fade">${TITLE.tagline}</p>
        <button class="btn fade" id="go" type="button">${TITLE.start}</button>
        ${bizFooterHtml('mini fade')}`;
      on('go', () => { sound.unlock(); logo.style.opacity = '0'; track('start'); next(30, 'chime'); });
    },
    // 1. 프롤로그 P1~P7 + 만남 B1~B4 (세로 웹툰 오버레이)
    30() {
      panel.innerHTML = ''; S.pro = true;
      const o = document.createElement('div'); o.className = 'toon strip'; o.id = 'pro';
      o.innerHTML = renderStrip(PROLOGUE, '#05070f')
        + `<div class="gap end" style="background:#120c0c"><button class="btn" id="pgo" type="button">${TITLE.approach}</button></div>`;
      const skip = document.createElement('button');
      skip.className = 'pskip'; skip.id = 'pskip'; skip.type = 'button'; skip.textContent = TITLE.skip;
      root.append(o, skip);
      const detach = attachStrip(o, { onReveal: reveal });
      cleanups.push(detach);
      // 들어가는 순간 (2026-11-23, A안): AI 영상은 화질이 뭉개져서 뺌 → 4K 정지 이미지 2장 연출.
      // 문 너머 원탁의 노엘(enter.jpg)로 천천히 다가감 → 금빛으로 하얗게 번짐 → 대화 1번 배경(CHAT_BG[0])이 드러남. 탭하면 건너뜀.
      const pre = new Image(); pre.src = ENTER_IMG; // 프롤로그 보는 동안 미리 받아 둔다
      const end = () => { detach(); o.remove(); skip.remove(); setBg(CHAT_BG[0]); next(20); };
      const enter = () => {
        detach(); skip.remove(); setBg(CHAT_BG[0]);
        const seq = document.createElement('div');
        seq.className = 'enter-seq';
        seq.innerHTML = `<img src="${ENTER_IMG}" alt=""><i class="flood"></i>`;
        root.append(seq);
        let done = false;
        const timers: number[] = [];
        const finish = () => {
          if (done) return; done = true; timers.forEach(clearTimeout);
          o.remove(); seq.classList.add('reveal'); next(20);
          setTimeout(() => seq.remove(), 1200);
        };
        cleanups.push(() => { timers.forEach(clearTimeout); seq.remove(); });
        seq.addEventListener('click', finish);
        requestAnimationFrame(() => { seq.classList.add('on'); o.style.opacity = '0'; });
        timers.push(window.setTimeout(() => seq.classList.add('glow'), 2600)); // 빛이 번지기 시작
        timers.push(window.setTimeout(finish, 3500));
      };
      o.querySelector('#pgo')!.addEventListener('click', () => { track('prologue_done'); enter(); });
      skip.addEventListener('click', () => { S.pro = false; track('prologue_skip'); end(); });
    },
    // 2. 채팅형 정보 입력
    20() {
      setBg(CHAT_BG[0]); panel.classList.add('tall');
      // 노엘 대사는 말풍선 없는 글자, 내 답만 말풍선 (2026-11-22 확정)
      panel.innerHTML = `<div class="chat plain" id="chat"></div><div id="ask"></div>`;
      runChat();
    },
    // 3. 로딩 (변신 직전)
    6() {
      setBg('loading');
      panel.innerHTML = `<div class="fade"><div class="speaker">노엘</div><p class="line" id="ln"></p></div>
        <div class="box fade"><div class="key">빛 <b></b> ${esc(S.name)}</div><p class="sub">${LOADING_SUB}</p></div>`;
      (async () => {
        for (const [t, w] of LOADING) {
          if (S.step !== 6 || !alive) return;
          await type(ln(), t, 45); await wait(w);
        }
        if (S.step === 6) next(7);
      })();
    },
    // 4. 1막 (세로 웹툰 스크롤) + 결제 CTA
    7() {
      calc(); logo.style.opacity = '0'; panel.innerHTML = ''; setBg('book');
      try { sessionStorage.setItem('door:input', JSON.stringify(saved())); } catch { /* 저장 못 해도 진행 */ }
      track('act1_view', { result: S.R.dec.A ? 'A' : 'B', status: S.status });
      const R = S.R, P = R.P, dG = P.D.g, nm = esc(S.name), IN = introLines();
      const k = seed() % 2;
      const together = isTogether();
      const pk = (p: Pillar | null) => p ? GAN_K[p.g] + JI_K[p.j] : '';
      const face = (S.sex === '남자') === (S.orient === 'queer') ? 'fm' : 'ff';

      // ---- 종이 카드들 (노엘이 펼쳐 보여주는 책장) ----
      const cell = (p: Pillar | null, label: string, isGan: boolean) => {
        if (!p) return `<div class="cell empty"><i>${isGan ? '시' : '시간 모름'}</i><b>${isGan ? '?' : '·'}</b></div>`;
        const ch = isGan ? GAN[p.g] : JI[p.j], e = elG(isGan ? p.g : JI_MAIN[p.j]);
        return `<div class="cell e${e}">${isGan ? `<i>${label}</i>` : ''}<b>${ch}</b>${isGan ? '' : `<i>${label}</i>`}</div>`;
      };
      const cols: [string, Pillar | null][] = [['시', P.H], ['일', P.D], ['월', P.M], ['연', P.Y]];
      const plate = `<article class="paper rv" aria-label="${nm}의 문패">
          <header><small>${nm}의 문패</small><h3>${R.ilju} 일주</h3></header>
          <p class="lead">넌 <mark>${R.image}</mark> 같아.</p>
          <div class="heard"><small>좋아했던 사람한테 이런 말, 들어봤을 거야</small><q>${R.heard.p}</q><q>${R.heard.l}</q></div>
          <p class="inner">${R.heard.inner}</p>
          <p><b>연애할 땐,</b> ${R.love}</p>
          <p>${R.yearLine}${R.workLine ? ' ' + R.workLine : ''}${R.wuLine ? ' ' + R.wuLine : ''}</p><p>${R.reframe}</p>
          <div class="chart" aria-label="여덟 글자">
            ${cols.map(([kk, p]) => cell(p, kk === '일' ? '나' : p ? god(dG, p.g) : kk, true)).join('')}
            ${cols.map(([, p]) => cell(p, p ? god(dG, JI_MAIN[p.j]) : '', false)).join('')}
          </div>
          <div class="els" aria-label="오행 분포">${R.A.el.map((c: number, i: number) => `<div class="e${i}"><span style="--n:${c}"></span><b>${TXT.elName[i]}</b><i>${c}</i></div>`).join('')}</div>
          ${R.elLine ? `<p>${R.elLine}</p>` : ''}
          ${R.gyeok || R.strength ? `<p>${[R.gyeok, R.strength].filter(Boolean).join(' ')}</p>` : ''}
          <p class="sign">${ACT1.plateWhy}</p>
        </article>`;
      const story = (() => {
        const ds = R.doors, top = ds[0];
        const title = top ? TXT.story[top.type].title : '조용했던 해';
        const chaps = ds.length ? [...ds].sort((x: any, y: any) => x.mo - y.mo).map((d: any) => {
          const T = TXT.story[d.type], line = (together ? T.s : T.l[k]).replace(/^\{월\}쯤?, /, '');
          return `<li class="${d === top ? 'hl' : ''}"><b>${d.mo}월</b><p>${d === top ? '<em>올해 가장 컸던 장면</em>' : ''}${esc(line)}</p></li>`;
        }).join('') : `<li class="hl"><b>1년</b><p>${ACT1.yearQuiet}</p></li>`;
        return `<article class="paper rv" aria-label="${nm}의 올해"><header><small>${nm}의 2026</small><h3>${title}</h3></header>
          <p class="lead">${ACT1.yearLead}</p><ol class="months">${chaps}</ol><p class="sign">${together ? ACT1.yearEndTogether : ACT1.yearEnd}</p></article>`;
      })();
      const chapter = (h: string, t: string, bg?: string): Beat => ({ t: 'html', bg, html: `<div class="chapter rv"><b>${h}</b><span>${t}</span></div>` });
      const say = (text: string, align: 'l' | 'c' | 'r' = 'c', size?: 'l', small?: string): Beat => ({ t: 'cap', voice: 'say', text, align, size, small });
      const buy = (src: string, label: string): Beat => ({ t: 'html', html: `<button class="btn buy rv" type="button" data-buy="${src}">${label}<i>→</i></button>` });

      // 구매 포인트 재료 (전부 엔진 결과에서)
      const sign = sunSign(+S.m, +S.d);
      const pass = passIndex(R);
      const ctx = promiseCtx(R, sign, S.sex === '남자', S.orient === 'queer');
      const worryShort = S.worry ? (S.worry.length > 24 ? S.worry.slice(0, 24) + '…' : S.worry) : '';
      const TOC = tocParts(R, together, ctx, worryShort);
      // '너'(여성 뒷모습)가 나오는 컷은 여성 이용자에게만. 그 외에는 노엘 단독 컷으로 대체
      const you = S.sex === '여자';

      // ---- 1막 콘티 (2026-11-24 v2 확정): 알아봐 줄게 → 올해 수고했어 → 남은 날들 → 노엘의 편지 ----
      // 결제 버튼 2곳 + 하단 바. 흔들리는 노엘은 문패·눈맞춤/열쇠 두 번만.
      const beats: Beat[] = [
        // ① 알아봐 줄게

        { t: 'space', h: 40, bg: '#07070b' },
        { t: 'panel', img: 'angel', ratio: 9 / 15, focus: '50% 30%', bg: '#14121c', flash: true, items: [
          { k: 'sfx', text: ACT1.reveal.sfxBig, x: 'l', y: 6, size: 80 },
          { k: 'sfx', text: ACT1.reveal.sfxSmall, x: 'r', y: 38, size: 40 },
          { k: 'say', text: ACT1.reveal.who, x: 'l', y: 62 },
          { k: 'say', text: ACT1.reveal.gift, x: 'r', y: 84 }] },
        { t: 'panel', img: 'book_w', ratio: 1, focus: '50% 36%', items: [
          { k: 'say', text: ACT1.book[0], x: 'l', y: 8 }, { k: 'say', text: fill(ACT1.book[1], { 이름: nm }), x: 'r', y: 90 }] },
        { t: 'space', h: 40 },
        say(`${IN.date}<br>${IN.born}`, 'l'),
        ...(IN.tz ? [say(IN.tz, 'r')] : []),
        { t: 'html', html: `<p class="pillar-line rv">${pk(P.Y)}년 ${pk(P.M)}월 ${pk(P.D)}일${P.H ? ` ${pk(P.H)}시` : ''}</p>` },
        say(ACT1.wow[0], 'l'), say(ACT1.wow[1], 'r', 'l'),
        say(`${IN.rare[0]}<br><b>${IN.rare[1]}</b>`, 'c'),
        say(ACT1.oneLine[0], 'l'), say(ACT1.oneLine[1], 'r', 'l'),
        { t: 'html', html: verdictHtml(R, nm), bg: '#160f16' },
        { t: 'space', h: 40 },
        { t: 'html', html: plate, bg: '#1a1622' },
        say(SHAKE.plate[0], 'l'),
        { t: 'panel', img: 'noel_flustered', ratio: 4 / 5, focus: '50% 30%', enter: 'blur', items: [] },
        say(SHAKE.plate[1], 'r', 'l'), say(SHAKE.plate[2], 'l'),
        // ② 올해 수고했어
        { t: 'space', h: 40 },
        chapter('年', '너의 올해', '#11131f'),
        { t: 'panel', img: 'closed', ratio: 1, focus: '50% 50%', items: [
          { k: 'say', text: ACT1.yearPanel[0], x: 'r', y: 12 }, { k: 'say', text: ACT1.yearPanel[1], x: 'l', y: 82 }] },
        { t: 'html', html: story },
        say(V2.yearComfort[0], 'l'), say(V2.yearComfort[1], 'r'), say(fill(V2.yearComfort[2], { 이름: nm }), 'c', 'l'),
        // ③ 남은 날들 (문 열리는 날은 잠김)
        { t: 'space', h: 60, bg: '#0c0b10' },
        chapter('日', V2.restTitle, '#1a0f12'),
        { t: 'panel', img: 'last_w', ratio: 9 / 14, focus: '45% 35%', items: [{ k: 'say', text: V2.restHead[0], x: 'l', y: 74 }] },
        say(V2.restHead[1], 'c', 'l'),
        { t: 'html', html: calendarHtml(R, true) },
        say(V2.calCaption, 'r'),
        buy('rest', V2.buyRest),
        // ④ 노엘의 편지
        { t: 'space', h: 60, bg: '#0b0a10' },
        chapter('信', V2.letterTitle, '#1c1016'),
        say(V2.tocHead, 'c'),
        { t: 'html', html: tocTitlesHtml(TOC.chapters, V2.tocKicker) },
        { t: 'space', h: 30 },
        ...(together ? KKUMIM.lines.together : KKUMIM.lines.solo).map((x, k) => say(x, k === 2 ? 'c' : k ? 'r' : 'l', k === 2 ? 'l' : undefined)),
        { t: 'html', html: kkumimHtml(together) },
        { t: 'space', h: 40 },
        say(V2.letterHead[0], 'l'), say(V2.letterHead[1], 'r', 'l'),
        { t: 'html', html: letterHtml(nm, together, face) },
        say(SHAKE.eyes, 'c'),
        you
          ? { t: 'panel', img: 'two_chin_f', ratio: 9 / 13, focus: '55% 25%', enter: 'blur', items: [] }
          : { t: 'panel', img: 'chatv8', ratio: 16 / 10, focus: '50% 27%', zoom: 1.05, enter: 'blur', items: [] },
        { t: 'tap', label: SHAKE.keyTap, beats: [
          { t: 'panel', img: 'lock_w', ratio: 1, focus: '50% 45%', flash: true, items: [] },
          say(SHAKE.keyLines[0], 'c', 'l'),
          ...(you ? [{ t: 'panel', img: 'two_near_f', ratio: 4 / 5, focus: '55% 28%', enter: 'iris', items: [] } as Beat] : []),
          say(SHAKE.keyLines[1], 'r'),
          buy('key', V2.buyKey),
          { t: 'html', html: `<p class="pay-notice rv">${PAY_NOTICE}</p>` },
          { t: 'html', html: `<button class="btn ghost rv" id="share" type="button">${ACT1.shareButton}</button><p class="note" id="nt" role="status"></p>` },
        ] },
        { t: 'space', h: 40 },
        { t: 'html', html: bizFooterHtml() },
        { t: 'space', h: 140 },
      ];
      const t = document.createElement('div'); t.className = 'toon strip'; t.id = 'toon';
      // [구매 포인트 12] 하단 고정 결제 바: 판결 이후 계속 보인다. 진짜 마감(크리스마스)만 표시
      t.innerHTML = renderStrip(beats, '#07070b')
        + `<div class="ctabar" id="cta"><div class="bar"><span class="ava" style="background-image:url(/img/s0.jpg)"></span>
            <div class="dl"><b>${deadline()}</b><small>${DEADLINE.sub}</small></div>
            <button class="btn" id="pay" type="button" data-buy="bar">${fill(DEADLINE.button, { 가격: priceText() })}</button></div></div>`;
      root.appendChild(t);
      cleanups.push(attachStrip(t, { onTap: () => sound.play('door'), onReveal: reveal }));
      const cta = t.querySelector<HTMLElement>('#cta')!, anchor = t.querySelector<HTMLElement>('#verdict')!;
      let ctaSeen = false;
      t.addEventListener('scroll', () => {
        const show = t.scrollTop + t.clientHeight * .5 > anchor.offsetTop + anchor.offsetHeight;
        cta.classList.toggle('on', show);
        if (show && !ctaSeen) { ctaSeen = true; track('cta_view', { value: priceAmount(), price_arm: priceArm() }); }
      }, { passive: true });
      const toast = (msg: string) => {
        let el = root.querySelector<HTMLElement>('.toast');
        if (!el) { el = document.createElement('p'); el.className = 'toast'; el.setAttribute('role', 'status'); root.appendChild(el); }
        el.textContent = msg; el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
      };
      t.addEventListener('click', e => {
        const b = (e.target as HTMLElement).closest<HTMLElement>('[data-buy]');
        if (!b) return;
        sound.play('key');
        track('pay_click', { value: priceAmount(), currency: 'KRW', source: b.dataset.buy, price_arm: priceArm() });
        if (opts.onPay) return opts.onPay(saved());
        toast(ACT1.payPending);
      });
      const share = async (msg: string) => {
        track('share_click');
        const url = location.origin;
        try {
          if (navigator.share) { await navigator.share({ text: msg, url }); return; }
          await navigator.clipboard.writeText(`${msg} ${url}`); toast('공유 문구를 복사했어요.');
        } catch { toast(`공유 문구: ${msg} ${url}`); }
      };
      t.querySelector('#share')!.addEventListener('click', () => share(ACT1.shareText));
      // 판결 공유: 지수만 담는다 (성적 지향·고민 같은 민감정보는 공유 문구에 넣지 않음)
      t.querySelector('#vshare')!.addEventListener('click', () => share(fill(VERDICT.shareText, { 지수: pass })));
    },
  };

  // ---- 말하듯이 입력받기: 노엘이 묻고, 유저가 답하면 말풍선으로 쌓인다. 이전 답을 누르거나 '이전'으로 되돌아갈 수 있다 ----
  const Q = QUESTIONS;
  // 받침 유무로 조사 고르기 (지수야 / 민정이야, 지수야 / 민정아)
  const hasBatchim = (w: string) => { const c = w.charCodeAt(w.length - 1); return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 > 0; };
  const nameVars = () => ({ 이름: S.name, 이야: hasBatchim(S.name) ? '이야' : '야', 이름아: S.name + (hasBatchim(S.name) ? '아' : '야') });
  const F = (lines: string[], extra: Record<string, string | number> = {}) => lines.map(t => fill(t, { ...nameVars(), ...extra }));
  const unq = (t: string) => t.replace(/^\s*"|"\s*$/g, '');
  const chips = (list: [string, string][], cur: string, colCls = '') =>
    `<div class="chips ${colCls}">${list.map(([k, t]) => `<button type="button" class="chip" data-v="${k}" aria-pressed="${cur === k}">${t}</button>`).join('')}</div>`;
  const dayPart = (h: number) => h < 5 ? '새벽' : h < 9 ? '아침' : h < 12 ? '오전' : h < 14 ? '낮' : h < 18 ? '오후' : h < 21 ? '저녁' : '밤';
  const seasonOf = (m: number) => [12, 1, 2].includes(m) ? '겨울' : m <= 5 ? '봄' : m <= 8 ? '여름' : '가을';

  type Line = { who: 'g' | 'me'; t: string; emoji?: string };
  const QS: any[] = [
    { say: () => S.pro ? Q.hello : Q.helloSkipped,
      html: () => `<button type="button" class="btn" data-v="go" data-show="${Q.helloAnswer}">${Q.helloButton}</button>`,
      apply: () => {} },
    { say: () => Q.name,
      html: () => `<label class="say-in"><span>${Q.namePrefix}</span><input id="nm" maxlength="12" autocomplete="given-name" placeholder="${Q.namePlaceholder}" value="${esc(S.name)}"></label><button class="btn" type="submit">${Q.nameButton}</button>`,
      parse: (f: HTMLElement) => { const name = f.querySelector<HTMLInputElement>('#nm')!.value.trim(); return name ? { name } : Q.nameError; },
      apply: (r: any) => { S.name = r.name; },
      echo: () => F([Q.nameEcho])[0],
      emoji: () => '❤️',
      react: () => F(Q.nameReact),
      choices: () => Q.nameChoices },
    { say: () => F(Q.sex),
      html: () => `<div class="chips">${['여자', '남자'].map(o => `<button type="button" class="chip" data-v="${o}" aria-pressed="${S.sex === o}">${o}</button>`).join('')}</div>`,
      apply: (r: any) => { S.sex = r.v; },
      echo: (r: any) => Q.sexEcho[r.v],
      react: () => Q.sexReact },
    { say: () => F(Q.birth),
      html: () => {
        const yy: number[] = []; for (let y = 2008; y >= 1960; y--) yy.push(y);
        const sel = (id: string, label: string, arr: number[], cur: any) => `<select id="${id}" aria-label="${label}"><option value="">${label}</option>${arr.map(v => `<option value="${v}" ${cur == v ? 'selected' : ''}>${v}</option>`).join('')}</select>`;
        const cal = S.cal || 'solar', B = cal === 'lunar' ? S.lb || {} : { y: S.y, m: S.m, d: S.d };
        return `<span class="say-lead">${Q.birthPrefix}</span>
        <div class="chips">${[['solar', '양력'], ['lunar', '음력']].map(([k, t]) => `<button type="button" class="chip" data-cal="${k}" aria-pressed="${cal === k}">${t}</button>`).join('')}</div>
        <div class="row">${sel('yy', '년', yy, B.y)}${sel('mm', '월', [...Array(12)].map((_, i) => i + 1), B.m)}${sel('dd', '일', [...Array(31)].map((_, i) => i + 1), B.d)}</div>
        <label class="check" id="lpw" ${cal === 'lunar' ? '' : 'hidden'}><input type="checkbox" id="lp" ${S.leap ? 'checked' : ''}> 윤달이야</label>
        <label class="cap" for="tm">태어난 시각</label>
        <input id="tm" type="time" value="${S.time || '12:00'}" ${S.noTime ? 'disabled' : ''}>
        <label class="check"><input type="checkbox" id="nt" ${S.noTime ? 'checked' : ''}> 시간은 몰라</label>
        <button class="btn" type="submit">${Q.birthButton}</button>
        ${DEV_BUILD && dev ? '<button type="button" class="btn ghost" id="skipall">[개발] 나머지 질문 건너뛰고 바로 보기</button>' : ''}`;
      },
      init: (f: HTMLFormElement) => {
        f.querySelectorAll<HTMLElement>('[data-cal]').forEach(c => c.addEventListener('click', () => {
          f.querySelectorAll('[data-cal]').forEach(x => x.setAttribute('aria-pressed', String(x === c)));
          f.querySelector<HTMLElement>('#lpw')!.hidden = c.dataset.cal !== 'lunar';
        }));
        f.querySelector('#nt')!.addEventListener('change', e => { f.querySelector<HTMLInputElement>('#tm')!.disabled = (e.target as HTMLInputElement).checked; });
        f.querySelector('#skipall')?.addEventListener('click', () => { S.fast = true; f.requestSubmit(); });
      },
      parse: (f: HTMLElement) => {
        const cal = f.querySelector<HTMLElement>('[data-cal][aria-pressed="true"]')!.dataset.cal;
        const v = (id: string) => +f.querySelector<HTMLSelectElement>('#' + id)!.value;
        const y = v('yy'), m = v('mm'), d = v('dd');
        if (!y || !m || !d) return '태어난 년, 월, 일을 모두 골라줘.';
        const leap = cal === 'lunar' && f.querySelector<HTMLInputElement>('#lp')!.checked;
        let sol;
        if (cal === 'lunar') { sol = lunar2solar(y, m, d, leap); if (!sol) return leap ? `음력 ${y}년에는 윤${m}월이 없거나, 그 달에 ${d}일이 없어.` : `음력 ${y}년 ${m}월에는 ${d}일이 없어.`; }
        else { const t = new Date(y, m - 1, d); if (t.getMonth() !== m - 1) return `${m}월에는 ${d}일이 없어.`; sol = { y, m, d }; }
        const nt = f.querySelector<HTMLInputElement>('#nt')!.checked, tv = f.querySelector<HTMLInputElement>('#tm')!.value;
        if (!nt && !tv) return '시각을 고르거나 "시간은 몰라"를 체크해 줘.';
        return { cal, leap, lb: { y, m, d }, sol, nt, tv };
      },
      apply: (r: any) => { Object.assign(S, { cal: r.cal, leap: r.leap, lb: r.lb, y: r.sol.y, m: r.sol.m, d: r.sol.d, noTime: r.nt, time: r.nt ? '' : r.tv }); },
      echo: (r: any) => {
        const date = r.cal === 'lunar' ? `음력 ${r.lb.y}년 ${r.leap ? '윤' : ''}${r.lb.m}월 ${r.lb.d}일` : `${r.lb.y}년 ${r.lb.m}월 ${r.lb.d}일`;
        if (r.nt) return fill(Q.birthEchoNoTime, { 날짜: date });
        const [h, mi] = r.tv.split(':').map(Number);
        return fill(Q.birthEcho, { 날짜: date, 시간: `${dayPart(h)} ${h % 12 || 12}시${mi ? ` ${mi}분` : ''}` });
      },
      react: () => {
        const season = Q.seasons[seasonOf(+S.m)];
        if (S.noTime) return F(Q.birthReactNoTime, { 계절: season });
        const sj = sijin(S.time);
        return F(Q.birthReact, { 계절: season, 때: sj ? SIJIN_IMG[sj.idx] : '' });
      } },
    { say: () => Q.status, html: () => chips(STATUS, S.status, 'col'), apply: (r: any) => { S.status = r.v; },
      echo: (r: any) => r.show + '.',
      react: (r: any) => [...(Q.statusReact[r.v] || []), ...Q.statusTail] },
    { say: () => Q.orient, html: () => chips(Q.orientOptions, S.orient, 'col'), apply: (r: any) => { S.orient = r.v; },
      echo: (r: any) => r.show + '.', react: () => Q.orientReact },
    { say: () => Q.job, html: () => chips(JOBS, S.job), apply: (r: any) => { S.job = r.v; },
      echo: (r: any) => r.show + '.', react: () => Q.jobReact },
    { say: () => Q.worry,
      html: () => `<div class="chips col">${WORRIES.map(([k, t]) => `<button type="button" class="chip" data-v="${k}" data-show="${t}" aria-pressed="${S.wk === k}">${t}</button>`).join('')}</div>`,
      apply: (r: any) => { S.wk = r.v; S.worry = r.v === 'none' ? '' : r.show; },
      echo: (r: any) => r.show + '.',
      react: (r: any) => r.v === 'none' ? Q.worryNone : [unq(WORRY[r.v]?.after || '') || '그 얘기, 문 너머에서 같이 보자.'] },
  ];

  let chatRun = 0;
  const ANS: { show: string; emoji?: string; after: Line[] }[] = [];
  const hearts = new Set<string>(); // 하트 누른 노엘 대사 (다시 그려도 유지)
  let heartHinted = false;
  try { heartHinted = localStorage.getItem('door:hearthint') === '1'; } catch { /* 무시 */ }
  function runChat() { ANS.length = 0; hearts.clear(); goQ(0); }
  function goQ(i: number) {
    const my = ++chatRun; clearInterval(typing);
    const chat = $('chat'), ask = $('ask');
    // 질문이 진행될수록 배경(노엘)이 천천히 다가온다
    bg.style.setProperty('--push', String(1 + i * .035));
    setBg(CHAT_BG[i] || CHAT_BG[CHAT_BG.length - 1]);
    const down = () => { panel.scrollTop = panel.scrollHeight; };
    const isDir = (t: string) => /^\s*\(/.test(t);
    const bubble = (t: string) => { const p = document.createElement('p'); p.className = 'msg g' + (isDir(t) ? ' dir' : '') + (hearts.has(t) ? ' hearted' : ''); p.textContent = t; chat.append(p); return p; };
    const meBubble = (j: number, t: string, emoji?: string) => {
      const p = document.createElement('button'); p.type = 'button'; p.className = 'msg me'; p.textContent = t; p.title = '눌러서 고치기';
      if (emoji) p.dataset.emoji = emoji;
      p.addEventListener('click', () => { if (j >= 0) goQ(j); }); chat.append(p); return p;
    };
    const say = async (t: string) => {
      if (isDir(t)) { const p = bubble(t); p.classList.add('rise'); down(); await wait(650); return; }
      const dots = document.createElement('p'); dots.className = 'msg g dots'; dots.innerHTML = '<i></i><i></i><i></i>'; chat.append(dots); down();
      await wait(Math.min(900, 300 + t.length * 18));
      dots.remove(); const p = bubble(''); down(); await type(p, t, 28); down();
    };
    const sayAll = async (lines: string[]) => { for (const t of lines) { await say(t); if (my !== chatRun || !alive) return false; await wait(160); } return true; };
    const react = async (el: HTMLElement, emoji: string) => { await wait(500); el.dataset.emoji = emoji; el.classList.add('reacted'); sound.play('pop'); };
    // 지난 대화는 남기지 않는다: 질문 하나씩, 장면이 넘어가듯 (레퍼런스 방식)
    ask.innerHTML = '';
    ANS.length = i;
    (async () => {
      if (chat.children.length) { chat.classList.add('leaving'); await wait(380); if (my !== chatRun) return; }
      chat.innerHTML = ''; chat.classList.remove('leaving');
      if (!(await sayAll(([] as string[]).concat(QS[i].say())))) return;
      if (i === 2 && !heartHinted) {
        heartHinted = true; try { localStorage.setItem('door:hearthint', '1'); } catch { /* 무시 */ }
        const h = document.createElement('p'); h.className = 'msg hint'; h.textContent = Q.heartHint; chat.append(h); down();
      }
      const q = QS[i];
      ask.innerHTML = `<form class="box fade" id="af">${q.html()}<p class="err" id="er"></p>${i > 0 ? '<div class="backrow"><button type="button" class="back" id="bk">← 이전 질문으로</button></div>' : ''}</form>`; down();
      const f = $('af') as HTMLFormElement; q.init?.(f);
      const done = async (r: any) => {
        if (my !== chatRun) return;
        q.apply(r); ask.innerHTML = '';
        const show = q.echo ? q.echo(r) : r.show;
        const after: Line[] = [];
        ANS[i] = { show, after };
        const me = meBubble(i, show); down();
        track('chat_answer', { step: i });
        const em = q.emoji?.(r); if (em) { ANS[i].emoji = em; react(me, em); }
        await wait(350);
        const rs: string[] = q.react ? q.react(r) : [];
        if (!(await sayAll(rs))) return; after.push(...rs.map(t => ({ who: 'g' as const, t })));
        // 감정 선택지 (결과에는 영향 없음)
        const cs: Choice[] | undefined = q.choices?.(r);
        if (cs && !S.fast) {
          ask.innerHTML = `<div class="box fade choices">${cs.map((c, k) => `<button type="button" class="chip" data-c="${k}">${c.label}</button>`).join('')}</div>`; down();
          const k: number = await new Promise(res => ask.querySelectorAll<HTMLElement>('[data-c]').forEach(b => b.addEventListener('click', () => res(+b.dataset.c!))));
          if (my !== chatRun) return;
          ask.innerHTML = '';
          const c = cs[k], cb = meBubble(i, c.label); down();
          after.push({ who: 'me', t: c.label, emoji: c.react });
          if (c.react) react(cb, c.react);
          await wait(400);
          const rep = F(c.reply);
          if (!(await sayAll(rep))) return; after.push(...rep.map(t => ({ who: 'g' as const, t })));
        }
        if (S.fast) { S.fast = false; Object.assign(S, { status: S.status || 'solo', orient: S.orient || 'hetero', job: S.job || 'office', wk: S.wk || 'none' }); if (S.wk === 'none') S.worry = ''; }
        else if (i + 1 < QS.length) { await wait(300); return goQ(i + 1); }
        track('input_complete');
        if (!(await sayAll(Q.done))) return;
        await wait(500); panel.classList.remove('tall'); bg.style.setProperty('--push', '1'); next(6, 'chime');
      };
      f.addEventListener('submit', e => { e.preventDefault(); const r = q.parse(f); if (typeof r === 'string') $('er').textContent = r; else done(r); });
      f.querySelectorAll<HTMLElement>('[data-v]').forEach(b => b.addEventListener('click', () => done({ v: b.dataset.v, show: b.dataset.show || b.textContent })));
      root.querySelector('#bk')?.addEventListener('click', () => goQ(i - 1));
    })();
  }
  // 노엘 말풍선 두 번 탭 → 하트 (마음 표현)
  let lastTap = { el: null as Element | null, t: 0 };
  panel.addEventListener('pointerup', e => {
    const el = (e.target as HTMLElement).closest('.msg.g:not(.dir):not(.dots)');
    if (!el) return;
    const now = performance.now();
    if (lastTap.el === el && now - lastTap.t < 350) {
      el.classList.toggle('hearted');
      const t = el.textContent || '';
      if (el.classList.contains('hearted')) { hearts.add(t); sound.play('pop'); track('heart'); } else hearts.delete(t);
      lastTap = { el: null, t: 0 };
    } else lastTap = { el, t: now };
  });

  $('restart').addEventListener('click', () => {
    S = fresh(); chatRun++;
    panel.classList.remove('tall'); root.querySelector('#toon')?.remove(); root.querySelector("#pro")?.remove(); root.querySelector("#pskip")?.remove();
    next(0);
  });

  // ---- 떠다니는 금빛 먼지 ----
  let raf = 0;
  const onResize = () => size();
  const c = $('dust') as HTMLCanvasElement, x = c.getContext('2d')!;
  let W = 0, H = 0;
  function size() { const r = c.getBoundingClientRect(); W = c.width = r.width * devicePixelRatio; H = c.height = r.height * devicePixelRatio; }
  size(); addEventListener('resize', onResize);
  const DP = Array.from({ length: 46 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.6 + .4, v: Math.random() * .00035 + .0001, a: Math.random() * Math.PI * 2 }));
  (function f() {
    x.clearRect(0, 0, W, H);
    for (const p of DP) {
      p.y -= p.v; p.a += .01; if (p.y < -0.02) { p.y = 1.02; p.x = Math.random(); }
      const al = .35 + .35 * Math.sin(p.a);
      x.beginPath(); x.arc((p.x + Math.sin(p.a) * .01) * W, p.y * H, p.r * devicePixelRatio, 0, 7);
      x.fillStyle = `rgba(240,210,147,${al})`; x.fill();
    }
    if (!reduce && alive) raf = requestAnimationFrame(f);
  })();

  const sndwrap = $('sndwrap');
  const drawSound = () => { const open = !($('sndpop')?.hidden ?? true); sndwrap.innerHTML = soundUi(); $('sndpop').hidden = !open; };
  drawSound();
  const offSound = sound.onChange(drawSound);
  sndwrap.addEventListener('click', e => {
    const el = e.target as HTMLElement;
    if (el.id === 'snd') { const pop = $('sndpop'); pop.hidden = !pop.hidden; el.setAttribute('aria-expanded', String(!pop.hidden)); }
  });
  sndwrap.addEventListener('change', e => {
    const el = e.target as HTMLInputElement;
    if (el.dataset.snd) { sound.unlock(); sound.set(el.dataset.snd as 'bgm' | 'sfx', el.checked); }
  });

  STEPS[0]();

  return () => {
    alive = false; chatRun++; clearInterval(typing); cancelAnimationFrame(raf);
    timers.forEach(clearTimeout); cleanups.forEach(f => f());
    removeEventListener('resize', onResize); offSound(); sound.dispose();
    root.innerHTML = '';
  };
}
