# Claude Code에 붙여 넣을 첫 지시문

```
이 저장소의 CLAUDE.md, docs/SPEC.md를 먼저 읽고, prototype/index.html을 브라우저로 열어 전체 흐름을 확인해줘.

목표: prototype/index.html(단일 파일 시안)을 Next.js(App Router) + TypeScript + Tailwind 프로젝트로 옮기고 Vercel에 배포할 수 있게 만드는 것.

순서:
1. 프로젝트 뼈대 생성 (app/, lib/, content/, public/img/). prototype/img를 public/img로 복사.
2. 시안의 사주 엔진(SAJU 모듈, toKST, sijin, lunar2solar, JEOL_T, LUNAR, KR_TZ, calc, partnerAge 등)을 lib/saju/ 순수 TS로 옮기고,
   data/saju-test-vectors.json 40건을 Vitest로 전부 통과시켜. 값이 하나라도 다르면 시안 로직을 기준으로 고쳐.
3. 문구·대사·풀이 표(TXT, RES, QS 대사, 프롤로그 컷 배열 C 등)는 content/ 폴더 데이터 파일로 분리해.
4. 화면 이식: 타이틀 → 프롤로그(세로 웹툰 오버레이) → 채팅 입력 → 로딩 → 1막 세로 스크롤 → 결제 CTA.
   모바일 390px 기준, 시안과 같은 연출(말풍선, 효과음 글자, 블러 카드)을 유지해.
5. 각 단계 끝나면 스크린샷으로 시안과 비교하고 다음으로 넘어가.

결제(토스페이먼츠), Supabase 저장, Meta 픽셀/GA4는 4번까지 끝난 뒤 따로 진행할게.
CLAUDE.md의 절대 규칙(프롤로그에 "천사" 금지, 확인형 말투 금지, 가짜 후기 금지 등)을 지켜줘.
```
