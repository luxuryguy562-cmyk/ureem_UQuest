# API_SPEC.md

## 기준

- 최우선 기준: `CHANGELOG_v1.1.md`
- 서비스 기준: 4주 온보딩, 20일 커리큘럼, 수료 후 상점 오픈
- 권한 기준: 신입 / 점장 조회 전용 / 본사 관리자 전체 권한
- 현재 Next 구현은 `getUQuestAppConfig()`로 화면 데이터를 공급하고, 주요 변경은 Next API와 서버 도메인 규칙에서 처리한다.
- 운영 배포 시 `supabase/schema.sql`, `supabase/storage.sql`을 Supabase에 적용한다.

---

## 인증/회원

```text
POST /auth/signup
POST /auth/login
POST /auth/logout
GET /me
```

회원가입 필수값:

```text
name
phone
login_id
password
store_id
hire_date
```

상태:

```text
pending
active
rejected
completed
inactive
```

정책:

- 신입은 가입 후 본사 관리자 승인이 필요하다.
- 점장 계정은 본사 관리자가 직접 생성한다.
- 점장은 회원가입 대상이 아니다.
- 승인 전/반려/비활성 사용자는 온보딩 액션이 차단된다.

---

## 신입 홈

```text
GET /rookie/home
GET /rookie/onboarding-status
```

응답 포함:

```text
today
current_day
progress_rate
attendance_status
learning_status
quiz_status
ax_status
point_balance
quiz_tier
ax_level
character_level
shop_opened
point_expire_at
```

---

## 출석

```text
POST /rookie/attendance
GET /rookie/attendance
```

정책:

- 앱 접속 후 출석 버튼 클릭 시 인정한다.
- GPS/위치 인증은 사용하지 않는다.
- 하루 1회만 가능하다.
- 중복 출석은 차단한다.
- 성공 시 300P를 지급하고 `point_histories`에 기록한다.

---

## 학습

```text
GET /curriculums
GET /curriculums/:dayNumber
POST /rookie/learning-completions
```

정책:

- 커리큘럼은 Day 1~20 고정이다.
- 학습 완료는 사용자 + 커리큘럼 기준 1회만 가능하다.
- 학습 완료 후 해당 Day 퀴즈가 열린다.
- 성공 시 300P를 지급하고 `point_histories`에 기록한다.

---

## 퀴즈

```text
GET /curriculums/:dayNumber/quizzes
POST /rookie/quiz-submissions
GET /rookie/quiz-submissions
GET /rookie/wrong-notes
```

정책:

- Day별 퀴즈 문제 수는 변경 가능하다.
- 총 문제 수는 고정하지 않는다.
- 퀴즈는 재도전 불가다.
- 제출 후 정답과 해설을 공개한다.
- 문제당 300P를 지급한다.
- 티어는 정답 개수가 아니라 정답률로 계산한다.

티어 기준:

| 티어 | 정답률 |
| --- | --- |
| Bronze | 20% 이상 |
| Silver | 40% 이상 |
| Gold | 60% 이상 |
| Platinum | 80% 이상 |
| Diamond | 95% 이상 |

---

## AX/DX

```text
GET /ax-categories
POST /rookie/ax-submissions
GET /rookie/ax-submissions
```

AX/DX 고정 항목:

```text
AX: AI 헬프데스크, 스마트CS, U+ONE, 요금시뮬레이터
DX: 생애주기, 타사확보, 자사전환
```

정책:

- 항목은 7개 고정이다.
- 관리자는 설명, 예시 이미지, 보상 포인트, 공개 여부만 수정할 수 있다.
- 이미지 업로드 인증 후 승인 절차 없이 즉시 완료한다.
- 인증 시마다 500P를 지급한다.
- AX 단계는 전체 인증 횟수 기준으로 계산한다.

AX 단계:

| 기준 | 단계 |
| --- | --- |
| 5회 이상 | Explorer |
| 10회 이상 | User |
| 15회 이상 | Expert |
| 20회 이상 | Master |

---

## 배지/프로필

```text
GET /rookie/badges
GET /rookie/profile
GET /rookie/point-histories
```

프로필 표시:

```text
character_level
quiz_tier
ax_level
badges
point_balance
```

배지 정책:

- 출석 배지, 퀴즈 배지, 티어 배지, 희귀 배지를 구분한다.
- 희귀 배지는 획득 전 조건을 숨김 처리할 수 있다.
- 배지 획득 보상은 즉시 포인트로 지급하고 이력에 남긴다.

---

## 상점/쿠폰

```text
GET /shop
POST /shop/coupon-requests
POST /shop/coupon-requests/:id/cancel
GET /rookie/coupon-requests
```

정책:

- 상점은 수료 후 오픈한다.
- 포인트는 수료 후 3개월 동안만 사용할 수 있다.
- 1P = 1원은 고정이다.
- 쿠폰 요청 즉시 포인트를 차감한다.
- 발송 전 취소하면 포인트를 원복한다.
- 발송 완료 후 취소할 수 없다.
- 발송 완료 시 쿠폰 만료일을 저장하고 조회 응답에 만료 여부를 포함한다.
- 쿠폰 재고가 `NULL`이면 무제한으로 처리한다.
- 재고가 0이면 요청을 차단한다.

---

## 점장

```text
GET /manager/rookies
GET /manager/rookies/:rookieId
GET /manager/rookies/:rookieId/badges
```

권한:

- 담당 매장 신입만 조회한다.
- 진행률, 티어, AX, 배지를 조회한다.
- 회원 수정, 승인, 포인트 수정, 쿠폰 처리, 엑셀 다운로드는 불가하다.

---

## 본사 관리자

```text
GET /admin/dashboard
GET /admin/users
POST /admin/users/:id/approve
POST /admin/users/:id/reject

GET /admin/stores
POST /admin/stores
PATCH /admin/stores/:id

GET /admin/curriculums
PATCH /admin/curriculums/:id
POST /admin/curriculums/:id

GET /admin/quizzes
POST /admin/quizzes
PATCH /admin/quizzes/:id

GET /admin/ax-categories
PATCH /admin/ax-categories/:id

GET /admin/badges
PATCH /admin/badges/:id

POST /admin/points/manual
GET /admin/point-histories

GET /admin/coupons
POST /admin/coupons
PATCH /admin/coupons/:id
POST /admin/coupon-requests/:id/send
POST /admin/coupon-requests/:id/cancel
```

현재 구현된 `POST /admin/curriculums/:id`는 한 번에 다음 값을 저장한다.

```text
Day 제목
Day 내용
학습 보상 포인트
공개 여부
퀴즈 문제
퀴즈 보기 4개
정답
해설
문제별 포인트
```

관리자 작업은 반드시 `admin_audit_logs`에 기록한다.

---

## 예외 처리 코드

| 상황 | 권장 코드 |
| --- | --- |
| 승인 전 로그인 | `ACCOUNT_PENDING` |
| 승인 반려 | `ACCOUNT_REJECTED` |
| 포인트 부족 | `INSUFFICIENT_POINTS` |
| 재고 없음 | `COUPON_OUT_OF_STOCK` |
| 중복 출석 | `DUPLICATE_ATTENDANCE` |
| 퀴즈 재진입 | `QUIZ_ALREADY_SUBMITTED` |
| 쿠폰 중복 요청 | `DUPLICATE_COUPON_REQUEST` |
| 수료 전 상점 접근 | `SHOP_LOCKED_UNTIL_COMPLETION` |
| 권한 우회 접근 | `FORBIDDEN_ROLE` |
| 탈퇴자 접근 | `ACCOUNT_INACTIVE` |
| 만료 포인트 사용 | `POINTS_EXPIRED` |
| 발송 완료 쿠폰 취소 | `COUPON_ALREADY_SENT` |

---

## 현재 구현 상태

현재 코드에서 검증된 주요 파일:

```text
src/components/uquest/uquest-app.tsx
src/lib/mock-data.ts
src/lib/uquest-repository.ts
src/lib/uquest-domain.ts
src/lib/uquest-api.ts
src/lib/uquest-auth.ts
src/app/api/**
supabase/schema.sql
supabase/storage.sql
```

- 신입 홈/학습/퀴즈/AX/배지도감/프로필/상점/포인트 이력 연결
- 점장 담당 매장 조회 전용 화면
- 본사 관리자 대시보드/회원/커리큘럼/AX/쿠폰/검증 화면
- 로그인/로그아웃/회원가입 연결
- 신입 출석/학습/퀴즈/AX/쿠폰 요청 API 연결
- 점장 조회 API 연결
- 본사 회원 승인/반려, 쿠폰 발송/취소 API 연결
- AX/DX 사진 업로드 Storage 연결
- 서버 도메인 규칙 기반 예외 처리
- 운영 DB 적용용 schema/storage SQL 작성

`POST /api/admin/missions`는 이전 첫 테스트용 경로이며, 최종 운영 API의 주 경로가 아니다.
