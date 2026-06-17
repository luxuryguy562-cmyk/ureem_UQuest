# U-Quest 인수인계

## 1. 프로젝트 한 줄 요약

U-Quest는 신입사원의 온보딩 미션 수행을 습관화하고, 그 과정을 포인트, 경험치, 챕터, 배지, 칭호, 프로필 프레임, 캐릭터 진행도로 보여주는 사내 온보딩 리워드 플랫폼이다.

최신 핵심 루프:

```text
미션 수행
→ 포인트 획득
→ 경험치 획득
→ 챕터 진행
→ 배지/칭호/프레임 획득
→ 캐릭터/프로필 성장
→ 쿠폰 교환
```

나무 타격, 타격권, 검 강화 중심 구조는 최신 MVP 기준에서 폐기 또는 보류한다.

---

## 2. 현재 기술 구조

- Frontend: Next.js App Router
- UI: React 컴포넌트 기반 모바일 앱형 화면
- Data: Supabase `app_config_snapshots.current.payload`
- Local fallback: `src/lib/mock-data.ts`
- Admin test save: `POST /api/admin/missions`

현재 구현에는 이전 화면명과 파일명이 일부 남아 있다.

```text
tree-screen.tsx  → 미션/포인트/보상 흐름으로 리디자인 필요
sword-screen.tsx → 챕터/캐릭터 진행도 화면으로 리디자인 필요
```

---

## 3. 실행 방법

로컬 실행:

```bash
npm install
npm run dev
```

브라우저:

```text
http://127.0.0.1:3000/
```

검증:

```bash
npm run typecheck
npm run build
```

---

## 4. 가장 중요한 제품 결정

### 온보딩이 중심이다

U-Quest는 게임 앱이 아니라 온보딩 앱이다. 게임 요소는 온보딩 행동을 더 쉽게 반복하게 만들기 위한 장치다.

### 포인트와 경험치는 분리한다

- 포인트: 쿠폰 교환용 실질 재화
- 경험치: 챕터/레벨/캐릭터 진행도용 게임 재화
- 배지/칭호/프레임: 동료 간 자랑 요소

포인트를 써서 성장하지 않고, 경험치로 쿠폰을 사지 않는다.

### 캐릭터는 진행도 시각화 장치다

캐릭터는 메인 보상이나 전투 아바타가 아니다. 사용자가 온보딩 여정의 어디까지 왔는지 보여주는 시각 장치다.

### 범용 UX는 새로 만들지 않는다

출석, 캘린더, 요일, 검색, 정렬, 필터, 탭, 설정 저장 같은 기능은 일반 앱 문법을 따른다.

---

## 5. 현재 사용자 화면 방향

추천 하단 탭:

```text
홈
미션
챕터
컬렉션
보상
```

화면 역할:

| 화면 | 역할 |
|---|---|
| 홈 | 오늘 해야 할 일과 현재 온보딩 상태 요약 |
| 미션 | 출석/루틴/퀴즈/AXDX/멘토 미션 수행 |
| 챕터 | 2개월 온보딩 여정과 진행률 |
| 컬렉션 | 배지, 칭호, 프레임, 대표 장착 |
| 보상 | 포인트로 쿠폰 교환 |

---

## 6. 현재 데이터 방향

핵심 데이터:

- 미션
- 챕터
- 포인트
- 경험치
- 배지
- 칭호
- 프로필 프레임
- 캐릭터 단계
- 쿠폰/보상

DB 문서 기준:

- [DATABASE_SCHEMA.md](/Users/eunseongkim/Documents/Codex/2026-06-08/luxuryguy562-cmyk-ureem-uquest-https-github/DATABASE_SCHEMA.md)

주의:

- 실제 Supabase SQL에는 이전 구조가 일부 남아 있을 수 있다.
- 다음 DB 작업은 문서 기준에 맞춰 migration을 새로 정리해야 한다.

---

## 7. 관리자 화면 방향

관리자에서 설정해야 할 것:

- 미션 묶음
- 미션 항목
- 미션별 포인트/경험치
- 챕터
- 챕터 완료 조건
- 배지
- 칭호
- 프로필 프레임
- 캐릭터 단계
- 쿠폰/보상
- 월 예산/포인트 원가

현재 연결된 테스트 API:

```text
POST /api/admin/missions
```

이 API는 첫 테스트용 스냅샷 저장이다. 정식 운영에서는 운영 테이블 저장 후 스냅샷을 재발행해야 한다.

---

## 8. 주요 파일 위치

문서:

- `PRD.md`
- `GAME_DESIGN.md`
- `ECONOMY_RULE.md`
- `ADMIN_RULE.md`
- `DATABASE_SCHEMA.md`
- `API_SPEC.md`
- `FRONTEND_GUIDE.md`
- `DESIGN_RULE.md`

프론트:

- `src/app/page.tsx`
- `src/components/uquest/uquest-app.tsx`
- `src/components/uquest/home-screen.tsx`
- `src/components/uquest/profile-screen.tsx`
- `src/components/uquest/admin-screen.tsx`
- `src/components/uquest/common.tsx`

데이터:

- `src/lib/uquest-repository.ts`
- `src/lib/mock-data.ts`
- `src/types/uquest.ts`

관리자 API:

- `src/app/api/admin/missions/route.ts`

---

## 9. 다음 작업

1. 현재 화면 구조를 새 탭 구조로 리디자인한다.
2. `tree-screen.tsx`, `sword-screen.tsx`를 새 목적에 맞게 교체한다.
3. 타입 정의를 포인트/경험치/챕터/컬렉션 중심으로 정리한다.
4. mock-data와 Supabase snapshot payload를 새 구조로 맞춘다.
5. 관리자 화면에 챕터/배지/칭호/프레임 설정을 추가한다.
6. DB migration을 새 `DATABASE_SCHEMA.md` 기준으로 준비한다.

---

## 10. CTO 주의사항

- 나무 타격, 타격권, 검 강화 구조로 되돌리지 않는다.
- 보상을 받기 위해 의미 없는 중간 클릭을 만들지 않는다.
- 포인트와 경험치를 섞지 않는다.
- 캐릭터를 전투/강화 중심으로 만들지 않는다.
- 배지/칭호/프레임은 실제 온보딩 행동과 연결한다.

---

## 11. 현재 검증 상태

최근 검증:

- 로컬 앱 실행 가능
- Supabase `.env.local` 연결 확인
- 관리자 미션 저장 테스트 API 연결
- 타입체크/빌드 통과 이력 있음

다음 검증 필요:

- 새 기획 기준으로 화면 구조 재검증
- 포인트/경험치/챕터 payload 재설계
- DB migration과 API 구현 재정렬
