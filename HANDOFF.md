# U-Quest 인수인계

작성일: 2026-06-02  
레포: https://github.com/luxuryguy562-cmyk/ureem_UQuest

## 1. 프로젝트 한 줄 요약

U-Quest는 신입 직원 온보딩을 게임처럼 진행하는 모바일 웹 앱이다.

직원은 출석, 일일 루틴, AX/DX 미션, 퀴즈를 완료해 타격권과 SXP를 얻고, 타격권으로 나무를 쳐서 코인을 얻는다. 코인은 보상 교환에 사용한다.

## 2. 현재 기술 구조

- Framework: Next.js 16
- UI: React 18 컴포넌트
- DB 후보/현재 설계: Supabase PostgreSQL
- 실행 방식: 모바일 앱처럼 단일 페이지 안에서 화면 전환
- 주요 데이터 공급:
  - Supabase 환경변수가 있으면 `app_config_snapshots.current.payload`
  - 환경변수가 없으면 `src/lib/mock-data.ts` fallback

## 3. 실행 방법

의존성 설치:

```powershell
npm install
```

로컬 서버 실행:

```powershell
cd C:\Users\es\Documents\Codex\U-Quest
powershell -ExecutionPolicy Bypass -File .\scripts\start-local-dev.ps1
```

브라우저:

```text
http://127.0.0.1:3000
```

로컬 서버 종료:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\stop-local-dev.ps1
```

검증:

```powershell
npm run typecheck
npm run build
```

## 4. 가장 중요한 제품 결정

### 범용 UX는 새로 만들지 않는다

출석, 캘린더, 요일, 검색, 정렬, 필터 같은 기능은 일반 앱 문법을 따른다.

예: 2026-06-01 월요일에 출석하면 `월` 칸이 오늘/완료 상태가 되어야 한다. `월 화 수 목 금 토 오늘` 같은 임의 구조는 금지한다.

### MVP 경제는 단순하게 간다

현재 MVP 기준:

```text
1코인 = 1원 상당의 내부 포인트
하루 최대 타격권 = 250타
1타격 코인 = 4~10코인
1타격 평균 = 약 7코인
검 레벨의 경제 영향 = 없음
주문서 랜덤 드랍 = 없음
```

핵심 계산:

```text
예상 코인 = 타격권 × 1타당 평균 코인
```

검은 경제 장치가 아니라 외형/연출/칭호용 성장 장치다. 검 레벨이 올라가도 코인 획득량, 히든 확률, 타격권 수량은 변하지 않는다.

### 성장과 경제를 분리한다

- 코인: 보상 교환용 내부 포인트
- 타격권: 나무를 칠 수 있는 플레이 횟수
- SXP: 사람/온보딩 성장 경험치
- 검: 외형, 이펙트, 프로필 만족감
- 히든코인: 히든박스용 별도 재화

## 5. 현재 테스트 데이터

현재 fallback 기준 사용자는 `김은성`이다.

- 신입 1일차
- 보유 코인 0
- 히든코인 0
- 주문서 0
- 타격권 0
- 검 Lv.1 나무검
- SXP 0

미션 구성:

- 출석: 10타
- 일일 루틴 3개: 각 10타, 총 30타
- AX/DX 미션 2개: 각 80타, 총 160타
- 일일 퀴즈 1개: 50타
- 전체 합계: 250타

## 6. 현재 화면 동작

로컬 상태로 동작하는 기능:

- 오늘 출석하기
- 미션 완료
- 타격권 지급
- 나무 타격
- 코인/히든코인 지급
- 검 성장
- 상점 교환
- 히든박스 열기
- 관리자 미션 항목 추가
- 관리자 미션 묶음 추가

주의:

- 현재 대부분은 브라우저 로컬 상태다.
- 새로고침하면 로컬 액션 결과는 초기화된다.
- 실제 DB 원장 기록은 아직 연결 전이다.

## 7. Supabase 현재 상태

Supabase MCP는 연결된 상태에서 작업했다.

적용된 주요 내용:

- `supabase/schema.sql` 기반 초기 스키마 작성
- public 테이블 36개
- RLS 활성화 36개
- 정책 58개 확인
- `app_config_snapshots.current`에 김은성 테스트 화면 스냅샷 반영

중요:

- 앱 코드에 Supabase 환경변수가 없으면 fallback 데이터를 사용한다.
- 실제 다음 작업에서는 `.env.local`에 Supabase URL/키를 연결해야 한다.
- `.env`, `.env*.local`은 git에 올리면 안 된다.

필요 환경변수:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## 8. 주요 파일 위치

앱 진입:

- `src/app/page.tsx`
- `src/components/uquest/uquest-app.tsx`

화면 컴포넌트:

- `src/components/uquest/home-screen.tsx`
- `src/components/uquest/tree-screen.tsx`
- `src/components/uquest/sword-screen.tsx`
- `src/components/uquest/shop-screen.tsx`
- `src/components/uquest/profile-screen.tsx`
- `src/components/uquest/admin-screen.tsx`
- `src/components/uquest/overlays.tsx`

데이터/타입:

- `src/lib/mock-data.ts`
- `src/lib/uquest-repository.ts`
- `src/types/uquest.ts`

DB/문서:

- `supabase/schema.sql`
- `DATABASE_SCHEMA.md`
- `ECONOMY_RULE.md`
- `PROJECT_CONSTITUTION.md`
- `GAME_DESIGN.md`
- `FIRST_TEST_RUNBOOK.md`
- `WORK_LOG.md`

## 9. 다음 세션에서 바로 할 일

추천 작업 순서:

1. GitHub 레포를 새 세션 workspace로 연결한다.
2. `npm install` 후 `npm run typecheck`, `npm run build`를 실행한다.
3. `.env.local`에 Supabase URL/키를 연결한다.
4. 화면이 `data-config-source="supabase"` 상태로 뜨는지 확인한다.
5. 첫 DB 테스트 루프를 만든다.

첫 DB 테스트 루프:

```text
김은성 진입
→ 오늘 출석하기
→ 미션 1개 완료
→ 타격권 지급
→ 나무 치기
→ 코인 지급
→ 관리자 대시보드 반영
```

이때 우선 연결할 서버 함수:

- `claim_attendance`
- `complete_mission`
- `hit_tree`

나중에 연결할 서버 함수:

- `redeem_reward`
- `open_hidden_box`
- `upgrade_sword_visual`
- `admin_create_mission_group`
- `admin_create_mission_task`

## 10. CTO 주의사항

- 검 레벨을 코인 획득량에 다시 연결하지 않는다.
- 주문서 랜덤 드랍을 MVP에 다시 넣지 않는다.
- 출석/요일/캘린더 같은 범용 UX를 새로 발명하지 않는다.
- 관리자 설정값이 사용자 화면을 지배해야 한다.
- 모든 돈/코인/확률 관련 계산은 최종적으로 서버 함수에서 처리한다.
- 프론트는 계산 결과를 보여주는 역할로 제한한다.
- 오너가 숫자를 바로 이해할 수 있게 관리자 화면에는 항상 `하루 타격권`, `1타 평균 코인`, `예상 지급액`을 보여준다.

## 11. 현재 검증 상태

최근 통과:

```powershell
npm run typecheck
npm run build
```

로컬 서버:

```text
http://127.0.0.1:3000
```

마지막 확인 기준:

- 페이지 응답 200
- `김은성` 표시
- `1코인 = 1원`
- `250타`
- `4~10 / 평균 7`
- `검 경제 영향 없음`
- `필요 주문서` 미표시

