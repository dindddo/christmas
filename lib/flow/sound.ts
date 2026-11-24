// 소리: 배경음(오르골 + 잔향 패드) · 효과음. 전부 WebAudio로 합성 — 외부 음원·저작권 없음.
// 브라우저 정책상 첫 탭 이후에만 소리가 난다. 설정(배경음/효과음 켬·끔)은 기기에 저장.
type Kind = 'chime' | 'key' | 'pop' | 'whoosh' | 'impact' | 'door' | 'heart' | 'sparkle';

const KEY = 'door:sound';
// 배경음은 일단 끔(2026-11-22 피드백). 다시 쓰려면 true로
export const BGM_ENABLED = false;
let ac: AudioContext | null = null;
let master: GainNode, bgmBus: GainNode, sfxBus: GainNode;
let prefs = { bgm: true, sfx: true };
try { Object.assign(prefs, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch { /* 기본값 */ }
const listeners = new Set<() => void>();

function ctx() {
  if (ac) return ac;
  const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  ac = new C();
  master = ac.createGain(); master.gain.value = .9; master.connect(ac.destination);
  bgmBus = ac.createGain(); bgmBus.gain.value = prefs.bgm ? .5 : 0; bgmBus.connect(master);
  sfxBus = ac.createGain(); sfxBus.gain.value = prefs.sfx ? 1 : 0; sfxBus.connect(master);
  return ac;
}
function noise(len: number) {
  const a = ctx(), b = a.createBuffer(1, Math.max(1, a.sampleRate * len), a.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const s = a.createBufferSource(); s.buffer = b; return s;
}
function env(g: GainNode, t: number, peak: number, atk: number, dec: number) {
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + atk); g.gain.exponentialRampToValueAtTime(0.0001, t + atk + dec);
}
function tone(type: OscillatorType, f: number, t: number, peak: number, dec: number, out: AudioNode, atk = .005, slideTo?: number) {
  const a = ctx(), o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dec);
  env(g, t, peak, atk, dec); o.connect(g).connect(out); o.start(t); o.stop(t + atk + dec + .05);
}

// ---- 효과음 ----
function play(kind: Kind) {
  if (!prefs.sfx) return;
  try {
    const a = ctx(), t = a.currentTime, out = sfxBus;
    if (a.state === 'suspended') a.resume();
    // 'pop'(말풍선 톡)·'impact'(효과음 글자 쿵)은 끔 — "툭툭 거린다" 피드백(2026-11-22)
    if (kind === 'pop' || kind === 'impact') return;
    if (kind === 'whoosh') { // 부드러운 바람 소리 (빠른 '탁' 소리 없음)
      const n = noise(.7), f = a.createBiquadFilter(), g = a.createGain();
      f.type = 'bandpass'; f.Q.value = .6; f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(1800, t + .6);
      env(g, t, .07, .18, .5); n.connect(f).connect(g).connect(out); n.start(t); return;
    }
    if (kind === 'heart') { [0, .22].forEach((d, i) => tone('sine', 70, t + d, i ? .35 : .5, .2, out, .01, 48)); return; }
    if (kind === 'door') {
      const o = a.createOscillator(), f = a.createBiquadFilter(), g = a.createGain(), lfo = a.createOscillator(), lg = a.createGain();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(180, t); o.frequency.linearRampToValueAtTime(320, t + .9);
      lfo.frequency.value = 23; lg.gain.value = 40; lfo.connect(lg).connect(o.frequency);
      f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 6; env(g, t, .06, .1, .9);
      o.connect(f).connect(g).connect(out); o.start(t); lfo.start(t); o.stop(t + 1.1); lfo.stop(t + 1.1); return;
    }
    if (kind === 'sparkle') { [2093, 2637, 3136, 3951].forEach((f, i) => tone('sine', f, t + i * .06, .04, .6, out)); return; }
    // chime / key: 종소리
    const notes = kind === 'key' ? [1046.5, 1318.5, 1568, 2093] : [1318.5, 1760, 2637];
    notes.forEach((f, i) => { tone('sine', f, t + i * .08, .07, 1.4, out); tone('sine', f * 2.01, t + i * .08, .015, .6, out); });
  } catch { /* 소리 없이 진행 */ }
}

// ---- 배경음: 자작 오르골 루프 (I–vi–IV–V, 4마디 × 2) ----
let bgmTimer: ReturnType<typeof setInterval> | null = null;
let nextT = 0, step = 0;
const BPM = 76, EIGHTH = 60 / BPM / 2;
const PROG = [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 65]]; // Cmaj7 · Am7 · Fmaj7 · G7 (MIDI)
const MEL = [76, 79, 74, 76, 72, 74, 71, 72, 69, 72, 71, 67, 69, 74, 72, 71]; // 마디별 4음씩 쓰는 오르골 선율
const hz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
let verb: ConvolverNode | null = null;
function reverb() {
  if (verb) return verb;
  const a = ctx(); verb = a.createConvolver();
  const len = a.sampleRate * 2.6, b = a.createBuffer(2, len, a.sampleRate);
  for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.4); }
  verb.buffer = b; const wet = a.createGain(); wet.gain.value = .55; verb.connect(wet).connect(bgmBus);
  return verb;
}
function schedule() {
  const a = ctx(), v = reverb();
  while (nextT < a.currentTime + .4) {
    const bar = Math.floor(step / 8) % 4, pos = step % 8, chord = PROG[bar];
    // 오르골: 아르페지오 + 2박마다 선율
    const arp = chord[[0, 2, 1, 3, 2, 1, 3, 2][pos]] + 12;
    tone('triangle', hz(arp), nextT, .05, 1.1, bgmBus); tone('sine', hz(arp) * 3.01, nextT, .006, .4, v);
    tone('triangle', hz(arp), nextT, .03, 1.1, v);
    if (pos % 2 === 0) { const m = MEL[(bar * 4 + pos / 2 + (Math.floor(step / 32) % 2 ? 2 : 0)) % 16]; tone('sine', hz(m), nextT, .07, 1.6, bgmBus); tone('sine', hz(m), nextT, .05, 2, v); }
    // 패드: 마디 시작마다 낮게 깔기
    if (pos === 0) chord.forEach(n => tone('sine', hz(n - 12), nextT, .018, EIGHTH * 8, v, .6));
    nextT += EIGHTH; step++;
  }
}
function startBgm() {
  if (!BGM_ENABLED || !prefs.bgm || bgmTimer) return;
  const a = ctx(); if (a.state === 'suspended') a.resume();
  nextT = a.currentTime + .1; bgmTimer = setInterval(schedule, 120);
}
function stopBgm() { if (bgmTimer) clearInterval(bgmTimer); bgmTimer = null; }

function set(k: 'bgm' | 'sfx', on: boolean) {
  prefs = { ...prefs, [k]: on };
  try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch { /* 저장 못 해도 진행 */ }
  if (ac) {
    const bus = k === 'bgm' ? bgmBus : sfxBus;
    bus.gain.setTargetAtTime(on ? (k === 'bgm' ? .5 : 1) : 0, ac.currentTime, .15);
  }
  if (k === 'bgm') { if (on) startBgm(); else stopBgm(); }
  listeners.forEach(f => f());
}

export const sound = {
  play,
  /** 첫 탭에서 호출: 오디오 잠금 해제 + 배경음 시작 */
  unlock() { try { ctx(); startBgm(); } catch { /* 무시 */ } },
  get prefs() { return { ...prefs }; },
  set,
  onChange(f: () => void) { listeners.add(f); return () => listeners.delete(f); },
  dispose() { stopBgm(); ac?.close().catch(() => {}); ac = null; verb = null; listeners.clear(); },
};
