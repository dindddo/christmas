# 이미지·영상 요청서 (힉스필드 제작용)

작성: 2026-11-22 · 목적: ① 몰입감(보는 사람 "너"를 장면에 등장, 노엘 표정 변화) ② 화질(현재 원본 720px → 1440px)
방향(2026-11-22 확정): 노엘 = **너에게 흔들리는 당사자**. 수위는 설렘·긴장까지(노출·직접적 성적 표현 없음).

## 힉스필드 어떤 도구로 만드나

| 만들 것 | 추천 도구 | 이유 |
|---|---|---|
| 노엘 표정 세트(A), 투샷(B·D) | **Nano Banana**(참조 이미지로 편집·합성) → 컷이 여러 장이면 **Popcorn**(한 장면 최대 8컷 스토리보드) | 노엘은 그림 캐릭터라 실존 인물 사진 학습용인 Soul ID보다, 원본 그림을 참조로 넣는 방식이 맞음. Soul ID는 그림 캐릭터에 통하는지 먼저 시험 |
| 변신(T1)·돌아보기(B4) 영상 | **Kling 시작·끝 프레임**(start/end frame) | 첫 장면 이미지와 마지막 장면 이미지를 주면 사이를 만들어 줌. 5초 권장. 유료 상위 요금제 전용일 수 있음 |
| 채팅 배경 반복 영상, 다가오기 연출 | **Seedance / Kling 이미지→영상** + **Cinema Studio 카메라 무브**(push in, dolly in) | 이미지 한 장으로 숨쉬기·깜박임, 카메라가 천천히 다가가는 영상 |
| 날개 펼치기 대안 | 효과 라이브러리의 **"Angel Wings"** 프리셋 | T1을 시작·끝 프레임으로 만들기 어려울 때 시험 |
| 기존 컷 화질 개선(P1) | **업스케일** | 구도 그대로 해상도만 올림. 재생성보다 싸고 안전 |

참고: 힉스필드 공식 MCP(`https://mcp.higgsfield.ai/mcp`)를 Claude Code에 연결하면(`claude mcp add higgsfield https://mcp.higgsfield.ai/mcp` 후 로그인), Claude가 이 요청서대로 직접 생성해 `public/`에 넣을 수 있다. 크레딧은 힉스필드 계정에서 차감.

## 0. 공통 규격

| 구분 | 규격 |
|---|---|
| 이미지 | 세로 9:16, **1440×2560 이상**, JPG 또는 PNG (압축은 개발에서 처리) |
| 영상 | 세로 9:16, 720×1280 이상, 24fps, **3~5초**, 무음, MP4. 반복 재생용은 처음과 끝 프레임이 이어지게 |
| 일관성 | **v3 원본(2026-11-22 확정)을 참조 이미지로 사용**: `assets/master/v3/noel_human_v3.png`(인간), `assets/master/v3/noel_angel_v3.png`(천사), `assets/master/v3/you_f_v3.png`("너": 가냘픈 체형, 긴 생머리, 검은 오프숄더 미니 원피스, 얼굴 안 보임). 옛 원본(`assets/master/noel_*_master.*`)은 평면 스타일이라 쓰지 않음 |
| 저장 위치 | 이미지 `public/img/v2/파일명.jpg`, 영상 `public/vid/파일명.mp4` (파일명은 아래 표 그대로) |

**절대 규칙** (CLAUDE.md)
- 프롤로그·만남(인간 노엘) 컷에는 **날개가 보이면 안 됨**. 빛·깃털로만 암시
- 날개는 **하얀색**, **눈이 빛나는 연출 금지**
- "너"는 **얼굴을 보여주지 않음**: 뒷모습, 어깨 너머, 머리카락·그림자로 가리기, 손만 보이기

**공통 스타일 문구** (모든 프롬프트 끝에 붙이기, 2026-11-22 v3로 교체 — 웹툰 문구는 그림이 평면적으로 나와서 폐기)
```
STYLE: hyper-detailed realistic digital painting close to a cinematic movie still, realistic facial structure and skin texture, strong light and shadow modeling, shallow depth of field, about 80 percent realistic with a subtle painterly finish — match the rendering of the reference image exactly. Cold blue winter night with warm amber candle light, Christmas season, vertical 9:16, no text, no watermark
```
- 레퍼런스 이미지(웹소설 표지 등)는 **구도·포즈·표정·배경**만 참고하고 그림체는 v3 원본을 따른다. 출간작 표지는 생성 입력에 넣지 않는다.
- 모델: `nano_banana_flash` 4k(장당 3크레딧). 원본을 `--image-references`로 넣고 "Do NOT copy the reference pose" + 새 포즈를 적는다.
- 손을 화면 쪽으로 뻗거나 목을 꺾는 큰 동작은 기괴하게 나옴 → 피한다.

---

## P0. 꼭 필요 (몰입 기능에 바로 쓰임)

### A. 채팅 배경: 노엘 표정 세트 (인간 노엘, 같은 장소)
채팅 질문이 진행될수록 **노엘이 점점 가까워지게** 쓴다. 장소는 촛불 켜진 무도회장 + 크리스마스 트리 창가(현재 s0와 같은 공간). 각 컷은 이미지 1장 + **같은 구도의 4초 반복 영상**(숨쉬기, 눈 깜박임, 촛불 흔들림 정도의 작은 움직임)으로 만든다.

| 파일명 | 쓰는 곳 | 구도·표정 | 프롬프트 핵심 |
|---|---|---|---|
| `noel_chat_1` | 인사 ("앉아. 오래 걸리진 않아.") | 상반신, 테이블 건너편에 앉아 살짝 웃음 | `a handsome Korean man in his late 20s, tousled black hair, black suit, white shirt with loose black bow tie, sitting across a candlelit table, faint knowing smile, looking at viewer, medium shot` |
| `noel_chat_2` | 이름 반응 ("…기억해둘게.") | 시선을 살짝 피하며 웃음, 귀 끝이 붉음 | `... glancing away with a shy smile, slightly flushed ears, hand touching the back of his neck, medium close-up` |
| `noel_chat_3` | 생년월일 질문 | 테이블에 팔을 괴고 몸을 앞으로 기울임 | `... leaning forward on the table with chin on hand, curious eyes, closer shot` |
| `noel_chat_4` | 사주 보는 중 | 낡은 책을 펼치고 진지하게 내려다봄 | `... looking down at an old open leather book, serious expression, candle light on his face` |
| `noel_chat_5` | 연애 상태·취향 질문 | 얼굴 클로즈업, 한쪽 입꼬리만 올라감 | `... close-up of face, one corner of lips raised, teasing gaze at viewer` |
| `noel_chat_6` | 마지막 고민 질문 | 눈가 익스트림 클로즈업 (눈 빛남 금지) | `... extreme close-up of eyes and brow, soft warm reflection, intimate, no glowing eyes` |

### B. "너"가 등장하는 컷 (여자 `_f` / 남자 `_m` 두 벌)
입력한 성별에 맞춰 바꿔 쓴다. **얼굴은 절대 보이지 않게.**

| 파일명 | 대체하는 컷 | 장면 | 프롬프트 핵심 |
|---|---|---|---|
| `you_walk_f` / `_m` | 프롤로그 P7 (p7) | 눈 오는 퇴근길 골목, 휴대폰 화면 불빛, 뒤 또는 옆모습 | `a young Korean woman (or man) in a long winter coat and scarf walking alone in a snowy narrow alley at night, looking down at a glowing phone, seen from behind, face hidden` |
| `you_door_f` / `_m` | 만남 B1 (b1) | 낡은 나무 문 앞에서 멈춰 선 뒷모습, 문틈으로 따뜻한 빛 | `... standing still in front of an old wooden door in a brick alley, warm light leaking through the door gap, seen from behind` |
| `two_meet_f` / `_m` | 만남 B4 (s0) | 문 안쪽: 노엘이 돌아보며 너를 봄, 너는 어깨 너머 | `over-the-shoulder shot from behind the viewer character, the handsome man (reference) turning around by a candlelit window to look at them, Christmas tree, no wings` |
| `two_book_f` / `_m` | 1막 책 펼치기 (book_w) | 천사 노엘이 너에게 책을 펼쳐 보여줌, 너는 손과 어깨만 | `angel man with large white wings (reference) holding an open old book toward the viewer, viewer's hands visible at frame edge, warm candlelight` |
| `two_key_f` / `_m` | 1막 결제 직전 (lock_w) | 노엘이 너의 손바닥에 금빛 열쇠를 올려줌, 손 클로즈업 | `close-up of hands: the angel man placing a small antique golden key into the viewer's open palm, white feathers drifting, warm light` |

### C. 영상
| 파일명 | 쓰는 곳 | 내용 |
|---|---|---|
| `t1_transform` (5초) | 로딩 → 1막 첫 컷 (SPEC의 "변신 영상 T1") | 인간 노엘(s0) → 빛이 터지며 **하얀 날개가 촤악 펼쳐짐** → 천사 노엘(angel). 마지막 프레임이 angel 이미지와 같게 |
| `b4_turn` (3초) | 만남 B3 → B4 | 창가에 등 돌리고 선 노엘(b3)이 천천히 돌아봄 → s0 구도로 끝남. 날개 없음 |
| `door_open` (3초) | 만남 B2 "끼익—" | 골목의 낡은 문이 안쪽으로 열리며 따뜻한 빛과 먼지가 쏟아짐 (you_door 구도) |

### D. "흔들리는 노엘" 거리 단계 컷 (1막, 결제까지 점점 가까워짐)
1막에서 노엘이 너 때문에 흔들리는 순간마다 쓴다. 한 단계씩 거리가 좁혀지게. 너는 뒷모습·손·어깨만, 여자 기준 1벌.

| 단계 | 파일명 | 장면 | 형식 |
|---|---|---|---|
| 1 | `noel_flustered` | 문패를 읽다가 귀 끝이 붉어진 노엘, 시선 피함 (클로즈업) | 이미지 + 3초 영상 |
| 2 | `two_scarf` | 노엘이 너의 목도리를 고쳐 매줌, 얼굴이 가까움 | 이미지 |
| 3 | `wing_touch` | (탭: 날개 끝을 만진다) → 날개가 움찔 접히고 노엘이 돌아봄 | **3초 영상** |
| 4 | `wing_wrap` | 눈 내리는 밤, 하얀 날개로 너를 감싸 안음 (뒤에서) | 이미지 + 4초 영상 |
| 5 | `hand_hold` | (탭: 손을 잡는다) 깍지 낀 손 클로즈업, 깃털이 떨어짐 | 이미지 |
| 6 | `mistletoe` | 겨우살이 아래, 이마가 닿을 듯한 거리에서 **멈춤** (입맞춤 직전) | 이미지 + 3초 영상 |
| 7 | `two_key` (B와 같음) | 열쇠를 손에 쥐여주며 부드럽게 웃음, 아쉬움을 감춘 표정 (좋아하는 사람이 잘되길 바라는 마음) — "네가 지금까지 흔들렸던 이유, 말해줄게. …그리고 그건, 내가 너한테 꼭 하고 싶었던 말이고." | 이미지 |

프롬프트 공통: `romantic tension, intimate distance, tender, no nudity, viewer character seen from behind or only hands visible, face hidden`

---

## P1. 화질 개선 (같은 구도로 1440px 재생성)
기존 그림의 구도와 내용을 그대로 두고 해상도만 올린다. 기존 파일을 참조 이미지로 넣고 "same composition, higher resolution, sharper details"로 생성.

`angel`, `book_w`, `last_w`, `resA_w`, `resB_w`, `closed`, `p1`, `p4`, `p5`, `p6`, `b3`, `s0`, `fm`, `ff`
(p2 카페는 유지 결정. 화질만 올릴지 선택. p3는 그래픽 장면으로 대체되어 불필요)

---

## 개발 쪽 적용 계획 (받으면 바로 처리)
- 채팅: 질문이 바뀔 때마다 A1→A6 배경을 겹쳐 전환하고 살짝 확대해서 "다가오는" 느낌. 영상이 있으면 영상, 없으면 이미지
- "너" 컷: 입력한 성별로 `_f`/`_m` 자동 선택. 프롤로그는 성별 입력 전이라 뒷모습 위주 컷(you_walk, you_door)은 **중성적인 실루엣 버전 1벌**로도 대체 가능
- 영상: 무음 자동재생, 첫 프레임 이미지를 먼저 보여주고 로드되면 재생 (모바일 데이터 고려해 개당 2~3MB 이하로 압축)
