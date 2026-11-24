// 2막 생성용 '사실 묶음'. 1막 화면이 쓴 계산을 그대로 재사용해서, 2막 본문이 1막과 어긋나지 않게 한다.
// 서버 전용(Claude 프롬프트에 들어감). 성적 지향은 '상대 성별'로만 바꿔 넣고 따로 저장하지 않는다.
import { computeChart, elG, fam, god, GAN_K, JI_K, JI_MAIN, monthFlow, sunSign, type Pillar } from '@/lib/saju';
import { PARTNER, TXT } from '@/content/reading';
import { VERDICT } from '@/content/act1';
import { chapters } from '@/content/act2';
import { passIndex, promiseCtx } from '@/lib/flow/teaser';
import type { SavedInput } from '@/lib/flow/flow';

const WD = '일월화수목금토';
const EL = ['나무', '불', '흙', '쇠', '물'];
const STATUS_KO: Record<string, string> = { solo: '혼자', crush: '마음 가는 사람이 있음', partner: '연애 중', breakup: '최근 이별', married: '결혼함' };
const JOB_KO: Record<string, string> = { student: '학생', seek: '구직 중', office: '직장인', biz: '사업', free: '프리랜서', rest: '쉬는 중' };

/** 1막 flow.ts 의 seed()와 같은 계산 (같은 입력이면 같은 문장·장소) */
export function seedOf(s: SavedInput) {
  const key = `${s.sex}|${s.name}|${s.y}${s.m}${s.d}|${s.noTime ? '' : s.time}|${s.status}|${s.orient}|${s.job}`;
  let x = 2166136261;
  for (const c of key) { x ^= c.charCodeAt(0); x = Math.imul(x, 16777619); }
  return x >>> 0;
}

const fill = (t: string, v: Record<string, string | number>) => Object.entries(v).reduce((a, [k, x]) => a.split(`{${k}}`).join(String(x)), t);
const plain = (t: string) => t.replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, '').replace(/"/g, '');

export function buildFacts(s: SavedInput) {
  const male = s.sex === '남자', queer = s.orient === 'queer';
  const c = computeChart({ y: s.y, m: s.m, d: s.d, time: s.noTime ? null : s.time, sex: s.sex as '여자' | '남자', orient: (s.orient || 'hetero') as 'hetero' | 'queer' });
  const { P, A, dec } = c, dG = P.D.g;
  const pk = (p: Pillar | null) => (p ? GAN_K[p.g] + JI_K[p.j] : '모름');
  const together = ['partner', 'married'].includes(s.status);
  const seed = seedOf(s);
  const where = (together ? TXT.whereP : (TXT.where[s.job] || TXT.where.rest))[seed % 4];
  const sign = sunSign(s.m, s.d);
  const PF = PARTNER[c.partnerEl];
  const verdict = VERDICT.types[A.loveState] || VERDICT.types.clean;
  const k = seed % 2;
  const ctx = promiseCtx(c, sign, male, queer);
  const TYPE_KO: Record<string, string> = { knock: '다가오는 사람', half: '거의 닿는 인연', slam: '크게 정리하는 일', key: '시선이 몰림', wrong: '말이 앞서는 일', off: '엇갈림' };
  const flow2027 = monthFlow(P, male, queer, 2027).map(m => `${m.mo}월 ${m.score >= 6 ? '아주 강함' : m.score >= 4 ? '강함' : m.score >= 2 ? '약간' : '조용'}${m.score ? `(${TYPE_KO[m.type]})` : ''}`).join(', ');

  return {
    // 사람
    name: s.name,
    sex: s.sex,
    partnerSex: queer ? s.sex : male ? '여자' : '남자',
    status: STATUS_KO[s.status] || s.status,
    job: JOB_KO[s.job] || s.job,
    worry: s.worry || '(특별히 고른 고민 없음)',
    together,
    birth: `${s.y}년 ${s.m}월 ${s.d}일${s.noTime ? ' (시간 모름)' : ` ${s.time}`}`,
    // 사주
    pillars: `${pk(P.Y)}년 ${pk(P.M)}월 ${pk(P.D)}일 ${P.H ? pk(P.H) + '시' : '(시주 모름)'}`,
    ilju: c.ilju,
    dayMaster: `${GAN_K[dG]}(${EL[elG(dG)]})`,
    elements: A.el.map((n, i) => `${EL[i]} ${n}`).join(', '),
    missing: A.missing.map(i => EL[i]).join(', ') || '없음',
    heavy: A.heavy >= 0 ? EL[A.heavy] : '없음',
    strength: A.strength,
    gyeok: A.gyeok,
    loveFamily: male && !queer ? '재성(여성 인연)' : !male && !queer ? '관성(남성 인연)' : '관성·재성 모두',
    loveState: A.loveState,
    natal: A.natal || '없음',
    dayBranchGod: fam(god(dG, JI_MAIN[P.D.j])),
    zodiac: `${sign}자리`,
    // 1막에서 이미 보여준 것 (2막은 이것과 모순되면 안 됨)
    shown: {
      image: `${TXT.season(P.M.j)} ${TXT.img[dG]}`,
      verdict: `${verdict.name} — ${verdict.desc} (→ ${verdict.point}) / 올해 문 앞을 그냥 지나친 지수 ${passIndex(c)}%`,
      year: c.doors.length
        ? c.doors.map(d => `${d.mo}월: ${plain((together ? TXT.story[d.type].s : TXT.story[d.type].l[k]).replace(/^\{월\}쯤?, /, ''))}`).join(' / ')
        : '조용했던 해 (큰 사건 없음)',
      yearTitle: c.doors[0] ? TXT.story[c.doors[0].type].title : '조용했던 해',
      result: dec.A ? `결과 A: 12월 ${dec.best.d}일(${WD[dec.best.wd]}) 무렵 문이 열림` : '결과 B: 올해 안에는 안 열림, 크리스마스 지나고 바로',
      meetPlace: where,
      shakeDay: dec.shake ? `12월 ${dec.shake.d}일` : '없음',
      partner: together
        ? `지금 연인과의 하루. 속마음 일부: "${PF.mind}"`
        : `나이 ${c.partnerAge[0]}(${c.partnerAge[1]}), 직업 ${PF.job}, 인상 "${PF.look}", 성격 "${PF.mind}", 첫마디 "혹시 아까 저 보셨어요?"`,
    },
    // 2027년 월별 인연 흐름 (엔진 계산, 가장 센 달 = ${'{'}뜨거운달{'}'})
    flow2027,
    hottestMonth2027: `${ctx.뜨거운달}월`,
    // 12월 17일 달력 (엔진 점수 그대로)
    december: dec.days.map(x => {
      const tag = dec.A && x.d === dec.best.d ? '문 열리는 날' : dec.shake && x.d === dec.shake.d ? '흔들릴 날' : dec.passers.includes(x.d) ? '스쳐가는 사람' : x.s >= 2 ? '기운 좋음' : '평범';
      return `12/${x.d}(${WD[x.wd]}) ${tag}`;
    }).join(', '),
    // 2막 목차 (1막에서 잠긴 채로 보여준 약속)
    chapters: chapters(together).map((ch, i) => ({
      no: i + 1,
      title: plain(ch.title),
      items: ch.items.map(([h, t]) => ({ title: fill(h, ctx), promise: fill(t, ctx) })),
    })).map((ch, i) => (i === 3 && s.worry ? { ...ch, items: [...ch.items, { title: `“${s.worry}”`, promise: '네가 물어본 고민에 대한 노엘의 답' }] } : ch)),
  };
}
export type Facts = ReturnType<typeof buildFacts>;
