# 노엘 스타일 바이블 (이미지·영상 생성 기준)

작성: 2026-11-22 · 모든 Higgsfield 생성 프롬프트는 이 문서의 블록을 **그대로 복사해 조립**한다. 컷마다 바꾸는 건 `SCENE` 블록뿐.
배경: 문구 하나("Korean webtoon style…")로 그림체가 웹툰 쪽으로 흔들린 일, 큰 동작·어두운 조명으로 "좀비 같다"는 결과가 나온 일을 막기 위해 만든다.

## 1. 참조 이미지 (순서 고정)

| 순서 | 파일 | 역할 |
|---|---|---|
| image 1 | `assets/master/noel_character_sheet.png` | 얼굴·체형·옷의 모든 각도 (캐릭터 시트) |
| image 2 | `assets/master/noel_human_master.jpg` | 그림체·질감의 정답 |
| image 3 (선택) | `public/img/v2/noel_chat_1.png` | 구도까지 같아도 될 때만 (반복 영상 첫 프레임 등) |

> **주의 (2026-11-22 시험 결과):** 장면 사진을 참조로 넣으면 "더 가까이" 같은 구도 지시를 무시하고 그 사진의 구도를 그대로 따라 한다. 구도를 바꿀 컷에는 image 3을 넣지 말고, 장소는 SCENE 글로만 설명한다.

캐릭터 시트는 2026-11-22 확정(키 약 187cm, 모델 비율). 이전 시트 `noel_character_sheet_v1.png`는 비교용으로만 보관하고 참조로 쓰지 않는다.

천사 컷은 image 2를 `assets/master/noel_angel_master.png`로 바꾼다.

## 2. 프롬프트 조립 순서

```
[IDENTITY] + [SCENE: 컷마다 다름] + [STYLE] + [LIGHT] + [NEGATIVE]
```

### IDENTITY (맨 앞, 수정 금지)
```
Noel, the same man as in the reference images: a handsome Korean man in his late 20s, short tousled black hair with soft bangs, calm warm eyes. Tall (about 187 cm) with fashion-model proportions: small head, broad straight shoulders, long legs, slim but fit build, upright posture. Black suit jacket, white shirt with the collar open, untied black bow tie hanging loosely, gold wristwatch on the left wrist. Keep his face identical to image 1 and image 2.
```

### STYLE (그림체, 수정 금지)
```
Rendering: match image 2 exactly — realistic digital painting, semi-realistic, lifelike skin shading, realistic proportions, clean detailed hair strands. Not a photograph, not anime, not webtoon line art, not 3D.
```

### LIGHT (조명, 수정 금지)
```
Lighting: soft warm amber candlelight on his face, cool blue snowy window light as rim light, face evenly lit and clearly visible, gentle and inviting mood.
```

### NEGATIVE (금지, 수정 금지)
```
No wings, no glowing eyes, no other people, no text, no watermark. Natural anatomy: normal neck length, five fingers per hand, relaxed shoulders. Eyes alive and focused, with natural catchlights.
```

## 3. SCENE 작성 규칙 (컷마다)

- **동작은 작게.** 고개 기울이기, 미소, 시선 옮기기, 넥타이·소매 만지기 정도. 손을 카메라로 뻗기, 볼 괴고 목 꺾기, 더치 앵글은 쓰지 않는다(손·목이 망가진 원인).
- **설렘은 동작 대신 거리와 시선으로.** 미디엄 → 바스트 → 클로즈업으로 점점 가까워지고, 시선이 화면(너)에 머무는 시간으로 표현한다.
- **얼굴 그림자 금지.** 반쪽 그림자, 강한 측광은 음산해 보인다.
- 형용사 대신 구체 묘사. "섹시하게" 대신 "one corner of his lips raised, eyes softly narrowed, looking at viewer".
- 영어로 쓰고, 한 컷 = 한 동작 + 한 표정.

## 4. 생성 규칙 (크레딧)

| 항목 | 기준 |
|---|---|
| 모델 | 이미지 `nano_banana_pro`(일관성·지시 준수 우선) |
| 해상도 | 시험 2k → 확정된 컷만 4k 재생성 |
| 장수 | 시험 1장. 방향이 승인된 뒤에만 여러 장 |
| 승인 | 생성 전 장수·예상 크레딧을 먼저 알리고 승인 후 진행 |
| 검수 | Claude가 먼저 확인: 원본과 같은 얼굴인가 / 손가락·목·어깨 / 눈에 생기 / 날개·빛나는 눈 없음 / 얼굴이 밝게 보이는가. 통과한 것만 보여준다 |
| 수정 | 손만 망가지면 재생성 대신 부분 수정(`ideogram_4_6_precise_edit` 또는 `flux_kontext`) |
| 확대 | 업스케일은 맨 마지막. 업스케일은 망가진 손을 고치지 못함 |

## 5. 영상 기준 (요약)

- 변신 T1, 돌아보기 B4: 시작·끝 프레임 방식(`kling_o3_flf` 또는 `veo3_1`). 저가 모델(`veo3_1_lite`, `kling_4_0_flash`, `seedance_2_0_mini`)로 먼저 비교.
- 반복 배경: 같은 이미지를 시작·끝으로 넣어도 끝에서 어긋남 → ffmpeg 크로스페이드로 잇고 MP4+WebM 2~3MB, 첫 프레임을 포스터 이미지로.
- 움직임 프롬프트는 작게: 숨쉬기, 눈 깜박임, 촛불 흔들림, 카메라 천천히 다가가기.
