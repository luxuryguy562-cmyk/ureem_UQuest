# WORK_LOG.md

## 2026-05-28 / HTML 목업 React 분리 및 문서 정리

### 작업 요약

- `mockup.html` 기준 화면을 Next/React 컴포넌트 구조로 분리했다.
- 화면 수치와 목록은 컴포넌트 내부가 아니라 `UQuestAppConfig` 데이터에서 받도록 정리했다.
- Supabase 연결 진입점 `getUQuestAppConfig()`를 만들었다.
- 합본 문서를 개별 문서로 분리하고 충돌 검토 문서를 추가했다.

### 변경 파일

- `src/app/page.tsx`
- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/components/uquest/*`
- `src/lib/*`
- `src/types/uquest.ts`
- `supabase/schema.sql`
- `package.json`
- `package-lock.json`
- `PRD.md`
- `SYSTEM_ARCHITECTURE.md`
- `DATABASE_SCHEMA.md`
- `ADMIN_RULE.md`
- `FRONTEND_GUIDE.md`
- `API_SPEC.md`
- `DESIGN_RULE.md`
- `DOCUMENT_REVIEW.md`
- `PROJECT_CONSTITUTION.md`
- `TODO.md`

### 결정 사항

- 합본 `uquest_master_documentation_v_1.md`는 원본 보관용으로 둔다.
- 실제 기준 문서는 개별 `.md` 파일로 한다.
- 프론트는 Supabase `app_config_snapshots.payload`를 우선 읽는다.
- Supabase 환경변수가 없을 때만 fallback seed를 사용한다.
- Next.js는 보안 감사 결과를 반영해 `16.2.6` 기준으로 설치했다.

### 남은 문제

- 실제 Supabase 프로젝트 생성 및 테이블 반영이 필요하다.
- 관리자 저장 기능과 스냅샷 재계산 로직이 필요하다.
- `골드/코인`, `타격권 +3/+30` 같은 용어와 단위 정리가 필요하다.
- 로그인, 권한, RLS 정책은 운영 구조 확정 후 강화해야 한다.

### 다음 작업

- Supabase 프로젝트 연결
- 관리자 저장 API/Edge Function 구현
- 경제 계산 서버 함수 구현
- 실제 기프티콘 API 연동 검토

## 2026-05-28 / CTO Agent 규칙 추가

### 작업 요약

- 오너가 코딩을 잘 몰라도 에이전트 작업 결과를 판단할 수 있도록 CTO Agent 문서를 신설했다.
- CTO Agent가 Product, Design, Frontend, Backend, Economy, Admin, QA Agent를 검수하는 기준을 추가했다.
- 작업 시작/완료 체크리스트에 CTO 검수 항목을 연결했다.

### 변경 파일

- `CTO_AGENT.md`
- `PROJECT_CONSTITUTION.md`
- `AGENT_RULE.md`
- `WORK_LOG.md`

### 결정 사항

- CTO Agent는 기술 방향만 보는 역할이 아니라, 에이전트 작업 검수와 쉬운 설명까지 담당한다.
- 큰 작업은 완료 전에 CTO Agent 관점의 검수 결과를 남긴다.

### 남은 문제

- 실제 PR 단계에서 CTO 최종 보고 양식을 자동으로 붙이는 작업은 아직 없다.

### 다음 작업

- 다음 기능 작업부터 `CTO_AGENT.md` 기준으로 검수 결과를 함께 기록한다.

## 2026-05-28 / DB 설계 v2 초안 작성

### 작업 요약

- Supabase 실제 테이블 생성 전 검토용 DB 설계 초안을 작성했다.
- 기존 `supabase/schema.sql`의 부족한 부분인 원장, 승인 흐름, 타격 로그, 권한 범위, 스냅샷 구조를 보강했다.
- 합본 문서와 개별 문서의 DB 흐름 충돌 지점을 정리했다.

### 변경 파일

- `DB_DESIGN_DRAFT.md`
- `PROJECT_CONSTITUTION.md`
- `WORK_LOG.md`

### 결정 사항

- 실제 운영 DB는 잔액 테이블만 두지 않고 `wallet_ledger`, `sxp_ledger`를 함께 둔다.
- 사용자 화면은 여러 원본 테이블을 직접 읽기보다 `app_config_snapshots.payload`를 우선 읽는다.
- 관리자 설정 변경은 원본 테이블 저장, 경제 스냅샷 재계산, 화면 스냅샷 갱신 순서로 반영한다.
- Supabase SQL 실행은 아직 하지 않고, 초안 검토 후 migration으로 진행한다.

### 남은 문제

- `DATABASE_SCHEMA.md`를 v2 초안 기준으로 정상 한국어 문서로 재작성해야 한다.
- `supabase/schema.sql`을 v2 구조로 교체해야 한다.
- 조직 구조, 퀴즈 분리 여부, 기프티콘 업체, 골드/코인 용어 통일을 확정해야 한다.

### 다음 작업

- DB 초안 검토
- `DATABASE_SCHEMA.md` 재작성
- `supabase/schema.sql` v2 마이그레이션 작성
- Supabase MCP로 migration 실행

## 2026-05-29 / DB 공식 문서 및 v2 SQL 작성

### 작업 요약

- 깨진 `DATABASE_SCHEMA.md`를 `DB_DESIGN_DRAFT.md` 기준으로 정상 한국어 문서로 재작성했다.
- `supabase/schema.sql`을 운영용 v2 스키마로 교체했다.
- 회사/매장/팀/권한, 지갑 원장, SXP 원장, 미션 승인, 출석, 나무 타격, 검 강화, 보상 교환, 경제 스냅샷, 앱 설정 스냅샷, 퀴즈/시즌/랭킹/알림 확장 테이블을 반영했다.
- 모든 public 테이블에 RLS 활성화 구문을 포함했다.

### 변경 파일

- `DATABASE_SCHEMA.md`
- `supabase/schema.sql`
- `DB_DESIGN_DRAFT.md`
- `WORK_LOG.md`

### 결정 사항

- 현재 DB는 총 36개 테이블 기준으로 설계한다.
- MVP 필수 테이블 29개와 확장 대비 테이블 7개를 같은 v2 SQL에 포함한다.
- `app_config_snapshots.payload`는 기존 프론트 타입 `UQuestAppConfig`와 연결되는 화면 스냅샷으로 유지한다.
- 퀴즈 정답이 들어있는 `quiz_options`는 일반 사용자에게 직접 노출하지 않고, 추후 RPC 또는 정답 제외 view를 통해 제공한다.
- Supabase 실제 migration 실행은 아직 하지 않았다.

### 검증

- `supabase/schema.sql`의 `create table` 수와 RLS 활성화 수가 모두 36개로 일치하는지 확인했다.
- 예전 테이블명 `mission_logs`, `hidden_reward_candidates`가 새 SQL에 남아 있지 않은지 확인했다.
- `DATABASE_SCHEMA.md`의 기존 깨진 문자열이 사라졌는지 확인했다.
- 로컬에 `psql`이 없어 실제 PostgreSQL 파싱 검사는 아직 수행하지 못했다.

### 남은 문제

- Supabase MCP로 실제 migration 실행이 필요하다.
- 초기 seed 데이터가 필요하다.
- `hit_tree`, `complete_mission`, `redeem_reward` 등 서버 함수가 아직 필요하다.
- 첫 슈퍼관리자 권한을 service role 또는 seed로 생성해야 한다.

### 다음 작업

- Supabase MCP로 v2 schema migration 실행
- 목업 기준 seed 데이터 작성
- `app_config_snapshots.payload` seed 작성

## 2026-05-29 / Supabase v2 migration 실행 및 테스트 계획 추가

### 작업 요약

- Supabase MCP로 `uquest_v2_initial_schema` migration을 실제 실행했다.
- 생성된 public 테이블 36개와 RLS 활성화 36개를 확인했다.
- RLS policy 58개가 생성된 것을 확인했다.
- 오너가 테스트와 보상 시뮬레이션을 이해할 수 있도록 `TESTING_AND_SIMULATION.md`를 작성했다.
- 샘플 보상 경제 시뮬레이터 `scripts/economy-simulation.mjs`를 추가했다.

### 변경 파일

- `DB_DESIGN_DRAFT.md`
- `DATABASE_SCHEMA.md`
- `TESTING_AND_SIMULATION.md`
- `scripts/economy-simulation.mjs`
- `package.json`
- `PROJECT_CONSTITUTION.md`
- `WORK_LOG.md`

### 결정 사항

- 현재 Supabase DB는 빈 데이터 상태지만 테이블/RLS/정책 골조는 생성 완료 상태다.
- 실제 seed 데이터는 오너가 양식을 제공한 뒤 넣는다.
- 보상 시뮬레이션은 우선 로컬 스크립트로 확인하고, 이후 관리자 화면과 `economy_snapshots`에 연결한다.

### 검증

- Supabase `list_tables`: public 테이블 36개, 모두 RLS enabled 확인
- Supabase migration 기록: `uquest_v2_initial_schema`
- Supabase policy count: 58개 확인
- `npm run simulate:economy` 실행 완료
- `npm run typecheck` 통과

### 남은 문제

- seed 데이터 양식 확정 및 입력이 필요하다.
- 첫 슈퍼관리자 계정/권한 생성 방식이 필요하다.
- 서버 함수 `hit_tree`, `complete_mission`, `redeem_reward`, `recalculate_economy_snapshot`, `publish_app_config_snapshot` 구현이 필요하다.
- 관리자 화면에 실제 시뮬레이션 UI를 연결해야 한다.

### 다음 작업

- 오너가 줄 양식 기준으로 seed importer 설계
- 초기 seed 작성 및 `app_config_snapshots.payload` 생성
- 관리자 경제 시뮬레이터를 DB와 연결

## 2026-05-29 / 김은성 신입 1일차 테스트 화면 구성

### 작업 요약

- 화면 테스트용 fallback 데이터를 김은성 신입 1일차 상태로 변경했다.
- Supabase `app_config_snapshots.current`에도 김은성 화면 스냅샷을 seed로 넣었다.
- 기존 목업의 `김신입`, `온보딩 7일차`, `14,820 코인`, `타격권 64` 같은 값이 로컬 fallback에서 남아 있지 않은지 확인했다.

### 변경 파일

- `src/lib/mock-data.ts`
- `WORK_LOG.md`

### 결정 사항

- 정규 `profiles` 데이터는 Supabase Auth 계정이 있어야 생성 가능하므로, 지금은 화면 테스트용 `app_config_snapshots`와 fallback 데이터로 검증한다.
- 실제 직원 seed는 오너가 양식을 제공한 뒤 Auth/프로필/권한 구조까지 맞춰 넣는다.

### 검증

- Supabase `app_config_snapshots`: `김은성`, `onboardingDay = 1` 확인
- 로컬 페이지 HTML: `김은성` 포함, `김신입`/`D+7`/`14820` 미포함 확인
- `npm run typecheck` 통과

### 남은 문제

- 앱에 Supabase URL/키 환경변수가 아직 없어, 현재 화면은 DB가 아니라 fallback 데이터를 표시한다.
- Supabase 환경변수 연결 후에는 `app_config_snapshots.current` 값을 실제로 읽게 해야 한다.

### 다음 작업

- `.env.local`에 Supabase URL/키 연결
- 브라우저 화면에서 `data-config-source=\"supabase\"` 상태 확인
- 실제 직원 양식 기반 seed importer 작성

## 2026-05-29 / 로컬 실행형 인터랙션 연결

### 작업 요약

- 홈, 나무, 검 성장, 상점, 보상함이 로컬 상태로 이어지도록 연결했다.
- 출석하기 버튼으로 타격권과 SXP를 받을 수 있게 했다.
- 미션 항목 클릭 시 완료 처리, 타격권 지급, 진행률 갱신이 되도록 했다.
- 나무 타격 시 타격권 차감, 코인/히든/주문서 지급, 보유 재화 갱신이 이어지도록 했다.
- 검 강화 시 코인 차감, 검 레벨 갱신, 나무 보상 규칙 갱신이 되도록 했다.
- 상점 교환과 히든박스 부족 안내/보상함 추가 흐름을 연결했다.

### 변경 파일

- `src/components/uquest/uquest-app.tsx`
- `src/components/uquest/home-screen.tsx`
- `src/components/uquest/tree-screen.tsx`
- `src/components/uquest/sword-screen.tsx`
- `src/components/uquest/shop-screen.tsx`
- `src/components/uquest/inventory-screen.tsx`
- `src/components/uquest/overlays.tsx`
- `src/lib/mock-data.ts`
- `WORK_LOG.md`

### 결정 사항

- 실제 서버 함수가 붙기 전까지는 브라우저 새로고침 전용 로컬 상태로 동작한다.
- 첫 강화는 테스트 편의를 위해 주문서 0개, 골드 50개 기준으로 둔다.
- 히든 확률 표기와 실제 로컬 드랍 확률을 0.8%로 맞췄다.

### 검증

- `npm run typecheck` 통과
- `npm run build` 통과
- `http://127.0.0.1:3000` 응답 200 확인

## 2026-06-01 / 경제 기준 숫자 명확화

### 작업 요약

- `ECONOMY_RULE.md` 상단에 오너가 먼저 볼 수 있는 MVP 숫자 기준을 추가했다.
- 하루 최대 타격권을 250타로 명시했다.
- 타격권 구성표를 출석, 일일 루틴, AX/DX, 일일 퀴즈 기준으로 작성했다.
- 검 레벨별 1타격 코인 범위, 평균 코인, 하루 예상 코인, 히든 확률 표를 추가했다.
- 관리자 보상설정 결과 요약에 `1코인 = 1원`, `오늘 최대 타격권 250타`, `Lv.1 1타격 코인 4~10 / 평균 7`을 추가했다.
- Supabase `app_config_snapshots.current.payload.admin.economy.results`에도 같은 요약값을 반영했다.

### 변경 파일

- `ECONOMY_RULE.md`
- `src/lib/mock-data.ts`
- `WORK_LOG.md`

### 현재 MVP 기준

- 1코인 = 1원 상당
- 하루 전체 완료 시 최대 250타
- Lv.1 1타격 = 4~10코인, 평균 7코인
- Lv.1 하루 전체 사용 시 약 1,750코인
- Lv.10 하루 전체 사용 시 약 3,000코인

### 검증

- `npm run typecheck` 통과
- `npm run build` 통과
- `http://127.0.0.1:3000` 응답 200 확인
- 렌더 HTML에 `1코인 = 1원`, `250타`, `4~10 / 평균 7` 포함 확인

## 2026-06-01 / 검 성장 경제 분리

### 작업 요약

- MVP에서 검 레벨이 코인 획득량, 히든 확률, 타격권 수량에 영향을 주지 않도록 기준을 변경했다.
- 경제 계산을 `타격권 × 1타당 코인수량`으로 단순화했다.
- 검은 외형, 타격 이펙트, 프로필 표시, 칭호/배지용 성장 장치로 분리했다.
- 주문서 랜덤 드랍을 MVP에서 비활성화했다.
- 검 강화 화면에서 최대 코인/히든 확률/추가 코인 증가 문구를 제거했다.
- Supabase 스냅샷의 `tree.rewardRule.scrollDropChancePct`를 0으로 맞췄다.
- Supabase 스냅샷의 검 Lv.1/Lv.2 코인 상한과 히든 확률을 동일하게 맞췄다.

### 변경 파일

- `src/components/uquest/uquest-app.tsx`
- `src/components/uquest/sword-screen.tsx`
- `src/components/uquest/overlays.tsx`
- `src/lib/mock-data.ts`
- `src/app/globals.css`
- `ECONOMY_RULE.md`
- `GAME_DESIGN.md`
- `PROJECT_CONSTITUTION.md`
- `TESTING_AND_SIMULATION.md`
- `WORK_LOG.md`

### 현재 MVP 기준

- 검 레벨은 코인 경제에 영향 없음
- 주문서 랜덤 드랍 없음
- 1타격 코인은 검 레벨과 무관하게 4~10코인
- 검은 Lv.10까지 외형/연출만 성장

### 검증

- `npm run typecheck` 통과
- `npm run build` 통과
- `http://127.0.0.1:3000` 응답 200 확인
- 렌더 HTML에 `검 경제 영향`, `없음`, `검 레벨과 무관` 포함 확인
- 렌더 HTML에 `필요 주문서` 미포함 확인
- dev server 3000 포트 listen 확인

### 남은 문제

- 새로고침하면 로컬 상태는 초기화된다.
- 아직 Supabase 서버 함수와 실제 원장 기록에는 연결되지 않았다.
- Supabase 환경변수 연결 전까지 화면은 fallback 데이터를 사용한다.

### 다음 작업

- Supabase URL/키를 `.env.local`에 연결
- 로컬 인터랙션을 `claim_attendance`, `complete_mission`, `hit_tree`, `redeem_reward` 서버 함수로 이전
- 사용자 액션 결과를 `wallet_ledger`, `tree_hit_logs`, `reward_redemptions`에 기록

## 2026-05-29 / 관리자 미션 추가 폼 연결

### 작업 요약

- 관리자 미션 탭의 placeholder 안내 모달을 실제 입력 폼으로 교체했다.
- `+ 항목 추가` 클릭 시 미션명, 아이콘, 지급 타격권을 입력할 수 있게 했다.
- `+ 미션 묶음 추가` 클릭 시 새 온보딩 미션 묶음을 만들 수 있게 했다.
- 추가한 항목은 관리자 미션 목록과 홈 온보딩 미션 목록에 즉시 반영되도록 로컬 상태에 연결했다.

### 변경 파일

- `src/components/uquest/uquest-app.tsx`
- `src/components/uquest/admin-screen.tsx`
- `src/components/uquest/overlays.tsx`
- `WORK_LOG.md`

### 검증

- `npm run typecheck` 통과
- `npm run build` 통과
- `http://127.0.0.1:3000` 응답 200 확인

### 남은 문제

- 현재 추가/수정은 새로고침 전까지 유지되는 로컬 테스트 상태다.
- Supabase 저장 API가 붙으면 같은 UI를 `mission_groups`, `mission_templates` 저장 흐름으로 교체해야 한다.

## 2026-05-29 / 온보딩 미션 전체 펼침 테스트 모드

### 작업 요약

- AX/DX 미션과 일일 퀴즈 묶음이 기본으로 펼쳐지도록 fallback 데이터를 수정했다.
- 앱 초기 로딩 시 Supabase/fallback 어느 쪽에서 오더라도 미션 묶음을 전부 펼친 상태로 정규화했다.
- 홈 화면 미션 묶음 제목을 클릭하면 접기/펼치기가 실제로 동작하도록 연결했다.
- 미션 항목에 클릭 가능한 hover 상태를 추가했다.

### 변경 파일

- `src/components/uquest/uquest-app.tsx`
- `src/components/uquest/home-screen.tsx`
- `src/lib/mock-data.ts`
- `src/app/globals.css`
- `WORK_LOG.md`

### 검증

- `npm run typecheck` 통과
- `npm run build` 통과
- `http://127.0.0.1:3000` 응답 200 확인
- 렌더 HTML에 `AX/DX 미션`, `AI 헬프데스크 실행`, `오늘의 유림 퀴즈` 포함 확인

## 2026-06-01 / 첫 테스트 런북 및 로컬 서버 안정화

### 작업 요약

- 오너가 직접 따라 할 수 있는 `FIRST_TEST_RUNBOOK.md`를 추가했다.
- 로컬 서버를 백그라운드로 켜는 `scripts/start-local-dev.ps1`을 추가했다.
- 로컬 서버를 끄는 `scripts/stop-local-dev.ps1`을 추가했다.
- `npm run dev:local` 스크립트를 추가해 3000 포트 실행 방식을 고정했다.
- Supabase 스냅샷 payload가 일부 필드를 누락해도 fallback 기본값으로 보완되도록 했다.
- 숫자 포맷 함수가 `undefined` 값 때문에 화면을 터뜨리지 않도록 방어했다.

### 변경 파일

- `FIRST_TEST_RUNBOOK.md`
- `scripts/start-local-dev.ps1`
- `scripts/stop-local-dev.ps1`
- `package.json`
- `src/lib/uquest-repository.ts`
- `src/lib/format.ts`
- `WORK_LOG.md`

### 검증

- `npm run typecheck` 통과
- `npm run build` 통과
- `scripts/start-local-dev.ps1`로 로컬 서버 실행 확인
- `http://127.0.0.1:3000` 응답 200 확인
- 렌더 HTML에 `김은성`, `AX/DX 미션` 포함 확인

## 2026-06-01 / 출석 요일 UX 정정 및 범용 UX 원칙 추가

### 작업 요약

- 출석 주간 표시를 `월 화 수 목 금 토 일` 구조로 수정했다.
- `오늘`이라는 가짜 오른쪽 칸을 제거하고, 실제 오늘 요일 칸이 오늘/완료 상태를 갖도록 했다.
- 2026년 6월 1일 월요일 기준으로 `월` 칸이 오늘 상태가 되도록 fallback과 Supabase 스냅샷을 맞췄다.
- 출석 완료 로직도 `today` 고정 ID가 아니라 실제 요일 ID 기준으로 처리하도록 수정했다.
- 범용 기능은 새로 창조하지 않고 일반 앱 문법을 따른다는 원칙을 문서에 추가했다.

### 변경 파일

- `src/components/uquest/uquest-app.tsx`
- `src/lib/mock-data.ts`
- `PROJECT_CONSTITUTION.md`
- `DESIGN_RULE.md`
- `FRONTEND_GUIDE.md`
- `WORK_LOG.md`

### Supabase 반영

- `app_config_snapshots.current.payload.attendanceWeek`를 `월 화 수 목 금 토 일` 구조로 갱신했다.

### 검증

- `npm run typecheck` 통과
- `npm run build` 통과
- `http://127.0.0.1:3000` 응답 200 확인
- 렌더 HTML에서 `일` 요일 칸 포함, legacy `today` 출석 ID 미포함 확인

## 2026-06-01 / 코인 정산 기준 및 성장 레벨 상한 정리

### 작업 요약

- 화면/상점 가격 기준에 맞춰 MVP 정산 기준을 `1코인 = 1원 상당`으로 문서화했다.
- 코인은 현금이 아니라 앱 안에서 보상으로만 교환되는 내부 포인트라고 명시했다.
- 사람 성장과 검 성장을 분리했다.
- 검 강화가 사람 레벨을 직접 올리던 로컬 테스트 로직을 제거했다.
- 검 강화에 SXP 해금 조건을 추가했다.
- MVP 검 레벨 상한을 Lv.10으로 추가했다.
- 검 레벨별 코인 상한/히든확률 증가를 완만한 테이블 기반으로 제한했다.
- 홈/내현황에서 사람 SXP와 검 레벨이 섞여 보이지 않도록 표시를 분리했다.
- Supabase `app_config_snapshots.current.payload.sword`에도 `maxLevel`, `requiredSxp`, Lv.1/Lv.2 기준값을 반영했다.

### 변경 파일

- `src/types/uquest.ts`
- `src/lib/mock-data.ts`
- `src/components/uquest/uquest-app.tsx`
- `src/components/uquest/home-screen.tsx`
- `src/components/uquest/profile-screen.tsx`
- `src/components/uquest/sword-screen.tsx`
- `src/app/globals.css`
- `ECONOMY_RULE.md`
- `GAME_DESIGN.md`
- `PROJECT_CONSTITUTION.md`
- `WORK_LOG.md`

### 결정 사항

- MVP에서는 예산 이해를 쉽게 하기 위해 `1코인 = 1원 상당`으로 둔다.
- 단, 코인은 현금 인출 수단이 아니라 보상 교환용 내부 포인트다.
- 검은 MVP에서 Lv.10까지만 숫자로 성장한다.
- Lv.10 이후는 숫자를 늘리지 않고 숙련도/외형/배지/시즌 티어로 확장한다.

### 검증

- `npm run typecheck` 통과
- `npm run build` 통과
- `http://127.0.0.1:3000` 응답 200 확인
