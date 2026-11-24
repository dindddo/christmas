// 프롤로그 P1~P7 + 만남 B1~B4 — 세로 웹툰 콘티.
// 절대 규칙: 프롤로그에는 노엘의 정체를 밝히는 단어를 쓰지 않는다(날개는 빛·깃털로만 암시). content.test.ts가 검사한다.
//
// 콘티 읽는 법 (위에서 아래로 스크롤 순서 그대로)
//  cap   : 컷 사이 여백에 떠오르는 글. voice 'noel'=노엘 독백, 'narrator'=3인칭 해설. size l=크게, align l/c/r
//  panel : 그림 컷. img=public/img 파일명, ratio=컷 비율(가로/세로), focus=잘라낼 중심점, zoom=확대(클로즈업)
//          items: 컷 위 말풍선 — say(사람 말) · think(속마음) · off(화면 밖 목소리) · cap(컷 위 독백) · sfx(효과음)
//          y는 컷 높이 기준 %(0 미만·100 초과면 컷 경계를 넘어 다음 장면과 이어진다)
//  space : 빈 여백(px). 시간이 흐르는 느낌
//  bg    : 이 지점부터의 배경색. 앞 장면 색에서 이 색으로 스크롤하며 서서히 바뀐다
import type { Beat } from '@/lib/flow/strip';

export const PROLOGUE: Beat[] = [
  { t: 'space', h: 72, bg: '#05070f' },
  { t: 'cap', voice: 'noel', text: '별이 지금보다 훨씬 밝던 시절부터,', align: 'l' },
  { t: 'panel', img: 'p1', ratio: 9 / 13, focus: '50% 30%', fx: { snow: 1 },
    items: [{ k: 'cap', text: '나는 인간들의 인연을 지켜봤어.', x: 'r', y: 84 }] },
  { t: 'cap', voice: 'noel', text: '봐, 저 둘.', align: 'c', bg: '#0a0e18' },
  // P2: 카페 만화컷(p2.jpg) → 복도식 오피스텔 같은 층 이웃, 겨울밤 귀가(p2o.jpg, 2026-11-22). 원본 public/img/v3/p2_officetel_test.png
  { t: 'panel', img: 'p2o', ratio: 9 / 14, focus: '50% 42%', fx: { snow: 1 },
    items: [{ k: 'cap', text: '같은 층에 살면서<br>벌써 백 번은 마주쳤어.', x: 'r', y: 8 }] },
  // 두 얼굴이 같은 높이(세로 33~35%)라 가로 컷 하나에 둘 다 담긴다
  { t: 'panel', img: 'p2o', ratio: 16 / 9, focus: '50% 31%', zoom: 1.1, tight: true,
    items: [{ k: 'cap', text: '아직 서로 이름도 몰라.', x: 'l', y: 104 }] },
  { t: 'space', h: 120, bg: '#08070a' },
  { t: 'cap', voice: 'noel', text: '인연은 늘 먼저 와 있어.', align: 'c' },
  { t: 'space', h: 40 },
  { t: 'cap', voice: 'noel', text: '알아보는 게 늦을 뿐이지.', align: 'c' },
  // P3: P2에서 이어짐 — 그녀는 들어가고 닫힌 문 앞에 빨간 장갑 한 짝, 남자는 그 문을 바라봄 (p3g.jpg, 2026-11-22)
  //     이전: 날개 실루엣 p3.jpg(규칙 위반) → 그래픽 'light-feather'(맥락 없음, 사용자 기각)
  { t: 'panel', img: 'p3g', ratio: 9 / 14, focus: '50% 62%', fx: { snow: 1 } },
  { t: 'cap', voice: 'noel', text: '그래서 크리스마스가 오면, 창문을 하나하나 들여다봐.', align: 'l', bg: '#0a1226' },
  { t: 'panel', img: 'p4', ratio: 9 / 14, focus: '55% 50%', fx: { snow: 2 },
    items: [{ k: 'say', text: '"올해는… 연락 올까."', x: 'r', y: 30 }, { k: 'say', text: '"그 사람, 잘 지내려나."', x: 'l', y: 54 }] },
  { t: 'cap', voice: 'noel', text: '그리고 딱 한 사람에게만, 선물을 줘.', align: 'r' },
  { t: 'panel', img: 'p5', ratio: 1, focus: '50% 62%', fx: { glow: [55, 55] },
    items: [{ k: 'sfx', text: '반짝', x: 'l', y: 18 }] },
  { t: 'space', h: 60, bg: '#0b0f1c' },
  { t: 'cap', voice: 'noel', text: '그 사람이 곁을 지나가는 순간,', align: 'c', size: 'l' },
  { t: 'space', h: 28 },
  { t: 'cap', voice: 'noel', text: '그걸 알아챌 수 있게.', align: 'c', size: 'l' },
  { t: 'space', h: 110 },
  { t: 'cap', voice: 'noel', text: '올해 창문을 들여다보다가, 유난히 마음이 복잡한 사람 하나가 눈에 밟혔어.', align: 'l', bg: '#0a1020' },
  // v3 추가 [선택] 수많은 창문 중 너에게서만 멈췄다
  { t: 'cap', voice: 'noel', text: '창문 수천 개를 지나쳤는데, 그렇게 오래 멈춰 선 건 처음이었어.', align: 'r' },
  { t: 'panel', img: 'p6', ratio: 9 / 15, focus: '50% 60%', fx: { snow: 1 },
    items: [{ k: 'cap', text: '몇 번이나 문 앞까지 왔다가,<br>그냥 지나친 사람.', x: 'r', y: 78 }] },
  // P7: 얼굴 검은 구멍 p7.jpg → '너'(긴 생머리) 반실사 뒷모습 p7b.jpg (2026-11-22)
  { t: 'panel', img: 'p7b', ratio: 4 / 5, focus: '50% 68%', zoom: 1.08, fx: { snow: 2 },
    items: [{ k: 'cap', text: '그게, 너야.', x: 'l', y: 88, big: true }] },
  { t: 'space', h: 60 },
  { t: 'cap', voice: 'noel', text: '그래서 이번엔, 선물만 두고 가지 않기로 했어.', align: 'l' },
  { t: 'space', h: 90, bg: '#06070b' },
  { t: 'cap', voice: 'narrator', text: '그해 겨울, 노엘은 처음으로 인간 앞에 모습을 드러냈다.', align: 'c' },
  { t: 'space', h: 90 },
  { t: 'cap', voice: 'noel', text: '…바로, 네 앞에.', align: 'r', size: 'l' },
  { t: 'space', h: 40, bg: '#120d0a' },
  { t: 'panel', img: 'b1', ratio: 9 / 15, focus: '50% 55%', fx: { snow: 1, glow: [62, 50] },
    items: [{ k: 'think', text: '(…여기, 원래 문이 있었나?)', x: 'l', y: 80 }] },
  { t: 'panel', ratio: 1, fill: 'linear-gradient(#1c1310, #0d0a0b)', fx: { shake: 1 },
    items: [{ k: 'sfx', text: '끼익—', x: 'l', y: 14 }, { k: 'off', text: '"…기다렸어."', x: 'r', y: 40 }, { k: 'think', text: '(…누구야, 너는?)', x: 'l', y: 74 }] },
  { t: 'panel', img: 'b3', ratio: 9 / 14, focus: '50% 40%', fx: { fe: [[40, 10, 320, 1]] }, bg: '#0b0c16',
    items: [{ k: 'off', text: '"널 꽤 오래 봐 온 사람."', x: 'r', y: 10 }, { k: 'off', text: '"넌 매번 이 앞에서 멈췄다가,<br>그냥 갔거든."', x: 'l', y: 72 }] },
  { t: 'panel', img: 's0', ratio: 9 / 14, focus: '50% 28%', bg: '#120c0c',
    items: [{ k: 'say', text: '"이번엔 그냥 못 보내.<br>들어와."', x: 'r', y: 74 }] },
];

export const FEATHER = '<svg viewBox="0 0 40 40"><path d="M33 4C22 6 11 15 7 30l-2 6 2-1C12 22 20 13 33 4z" fill="#fffaf0"/><path d="M33 4C25 13 17 21 7 33" stroke="#e9dcc0" stroke-width="1.2" fill="none"/></svg>';
