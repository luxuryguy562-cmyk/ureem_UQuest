# SYSTEM_ARCHITECTURE.md

## 전체 구조

```text
사용자 앱
  ↓
Next.js Frontend
  ↓
Supabase / Server Functions
  ↓
Postgres Tables
  ↓
app_config_snapshots
  ↓
사용자 화면 반영
```

U-Quest는 관리자 설정값을 기반으로 사용자 화면을 구성한다. 프론트는 최종 스냅샷을 렌더링하고, 포인트/경험치/쿠폰 같은 중요한 변경은 서버에서 처리한다.

---

## 최신 제품 흐름

```text
미션 수행
→ 포인트 지급
→ 경험치 지급
→ 챕터 진행 갱신
→ 배지/칭호/프레임 지급 조건 평가
→ 캐릭터/프로필 진행도 갱신
→ 쿠폰 교환
```

구버전 보상 게임 구조는 최신 MVP 아키텍처에서 사용하지 않는다.

---

## 기술 스택

### Frontend

- Next.js App Router
- React 컴포넌트
- 모바일 앱형 단일 화면 전환

### Backend

- Supabase Postgres
- Row Level Security
- Server Functions 또는 Next API Routes
- `app_config_snapshots` 기반 화면 설정 공급
- `ax-evidence` Storage bucket 기반 AX/DX 사진 인증 저장

### External

- 기프티콘 API
- 알림톡/문자/푸시
- 이미지 저장소

---

## 현재 구현된 서버 경계

- 로그인/회원가입/로그아웃은 Next API에서 처리한다.
- 세션 쿠키 `uquest_user_id` 는 유저 UUID 를 그대로 담지 않고 서버가 HMAC 서명한 `userId.signature` 토큰으로 발급한다. 서버는 서명이 유효한 쿠키만 신원으로 신뢰한다(`src/lib/uquest-session.ts`). 서명 비밀키는 이미 가진 `SUPABASE_SERVICE_ROLE_KEY` 를 재사용하므로 운영자가 새 비밀키를 등록할 필요가 없고, 프로덕션에서 키가 없으면 fail-closed 로 세션 발급을 거부한다. → 타인의 UUID 를 알아도 쿠키를 위조해 점장·관리자로 위장할 수 없다.
- 신입의 출석, 학습, 퀴즈, AX 인증, 쿠폰 교환 요청은 서버 도메인 규칙을 통과해야 저장된다.
- 점장은 담당 매장 신입만 조회한다.
- 본사 관리자는 회원 승인/반려와 쿠폰 발송 처리를 수행한다.
- 배포 모드에서는 로그인 쿠키 없는 요청을 기본 관리자/점장으로 대체하지 않는다.
- 로컬 개발 모드에서만 테스트용 요청자 헤더를 허용한다.

---

## 구조 원칙

### 1. 하드코딩 금지

아래 값은 코드에 고정하지 않는다.

- 미션명
- 미션별 포인트
- 미션별 경험치
- 챕터명
- 챕터 완료 조건
- 배지 조건
- 칭호 조건
- 프로필 프레임 조건
- 쿠폰 가격
- 보상 재고
- 정렬 순서
- 이미지 경로

---

### 2. 관리자 입력값과 자동 계산값을 분리한다

관리자가 입력:

- 월 예산
- 포인트 원가
- 미션별 포인트/경험치
- 챕터 완료 조건
- 챕터 완료 보상
- 배지/칭호/프레임 조건
- 쿠폰 가격/재고
- 이벤트 배율

시스템이 계산:

- 예상 월 포인트 지급량
- 예상 월 지급액
- 예산 위험도
- 경제보정계수
- 사용자별 챕터 진행률
- 배지/칭호/프레임 획득 가능 여부

---

### 3. 포인트/경험치 계산은 서버에서 처리한다

프론트에서 직접 잔액이나 경험치를 바꾸면 안 된다.

서버 처리 대상:

- 출석 보상 지급
- 미션 완료 보상 지급
- 챕터 완료 보상 지급
- 포인트 차감
- 쿠폰 발급
- 컬렉션 지급
- 대표 배지/칭호/프레임 장착

---

### 4. 관리자 화면은 운영 콘솔이다

관리자 화면은 아래를 설정하고 확인한다.

- 미션
- 챕터
- 배지
- 칭호
- 프로필 프레임
- 캐릭터 단계
- 쿠폰/보상
- 경제 설정
- 예상 월 지급액

---

### 5. 사용자 화면은 계산 결과만 반영한다

사용자 화면은 다음을 보여준다.

- 오늘의 미션
- 포인트 잔액
- 경험치/챕터 진행률
- 획득 배지/칭호/프레임
- 캐릭터 진행도
- 쿠폰 교환 가능 상태

프론트는 지급 결과를 연출할 수 있지만, 지급량과 지급 여부를 직접 결정하지 않는다.

---

## Supabase 연결 기준

- 브라우저에서 직접 쓰기 가능한 테이블을 최소화한다.
- 모든 사용자 데이터 테이블에는 RLS를 켠다.
- 직원은 본인 데이터만 조회한다.
- 관리자 수정은 권한 확인 후 서버를 통해 처리한다.
- 포인트 차감과 쿠폰 발급은 트랜잭션으로 처리한다.

### 저장 모델 (정규화 테이블)

- 데이터는 `supabase/schema.sql` 의 정규화 테이블(users, attendances, learning_completions, quiz_submissions, quiz_answers, ax_submissions, point_histories, user_badges, coupon_requests 등)에 행 단위로 저장한다.
- `src/lib/uquest-repository.ts` 가 어댑터 역할을 한다.
  - 읽기: 여러 테이블에서 조회해 화면용 `FinalUQuestConfig` 로 조립한다.
  - 쓰기: 저장 직전 DB 상태(before)와 도메인 결과(next)를 비교해 **바뀐 행만** insert/update 한다. 사용자별 활동은 각자의 행에 기록되어 동시 사용 시에도 서로 덮어쓰지 않는다.
- 중복 방지(중복 출석/학습/퀴즈/쿠폰 요청)는 테이블의 `unique` 제약으로 DB가 강제한다.
- `app_config_snapshots` 테이블은 더 이상 읽기/쓰기 경로에서 사용하지 않는다(과거 단일 JSON 스냅샷 방식의 잔재).
- 운영 기초 데이터(매장/커리큘럼/퀴즈/배지/쿠폰/AX, 관리자·점장 계정)는 `supabase/seed.sql` 로 시드한다.
- DB 미연결 또는 시드 전이면 `src/lib/mock-data.ts` 의 폴백 목업으로 동작한다.

---

## U-Quest 환경 격리 헌법 (절대 규칙)

> 이 절은 타협 불가 규칙이다. 코드 리뷰/배포/AI 작업 어디서든 위반을 발견하면 즉시 차단한다.

**핵심 원칙: 이것은 `uquest` 환경이다. 여기서는 U-Quest의 레포와 U-Quest의 DB만 사용한다.**
`Cashflow`, `pongdang`, `ureem` 등 다른 환경의 GitHub 레포나 Supabase 프로젝트로 **절대 넘어가지 않는다.** 환경끼리 레포·DB가 섞이거나 충돌하는 일이 없어야 한다.

이 환경에 묶인 자원은 아래 하나의 세트뿐이다. 이 세트 밖의 어떤 레포·프로젝트도 읽거나 쓰지 않는다.

| 자원 | U-Quest (이 환경) |
|---|---|
| GitHub 레포 | `luxuryguy562-cmyk/ureem_UQuest` |
| Supabase 프로젝트 | `uquest` (`ofeqiqauhvcovtzjangm`) |
| 조직 | `urvmldcrfrxfbqddzlzk` |

### 금지 (다른 환경 — 손대지 않는다)

| 환경 | GitHub 레포 | Supabase 프로젝트 ref |
|---|---|---|
| Cashflow | Cashflow 레포 | `ecfjkfqlnqfxovlwhdtx` |
| pongdang | pongdang 레포 | `ruytgygjwnbtzmtofopg` |
| ureem | ureem 레포 | `wowodgsiogxnqcfujbgc` |
| 그 외 전부 | — | — |

### 강제 규칙

- **GitHub:** 이 세션/작업은 `luxuryguy562-cmyk/ureem_UQuest` 레포에서만 커밋·푸시·PR 한다. 다른 레포로 푸시하거나 다른 레포의 코드를 가져오지 않는다.
- **Supabase 연결:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` 세 값은 **모두 같은 `ofeqiqauhvcovtzjangm` 프로젝트**를 가리켜야 한다. 하나라도 다른 프로젝트면 자격 증명이 섞인 것이며 사용 금지다.
- **Fail-closed:** 자격 증명이 잘못 주입되면 조용히 다른 DB에 붙지 않고 즉시 연결을 거부한다. 강제 장치는 `src/lib/supabase/server.ts`의 `assertUQuestProject()`이며, URL과 키의 프로젝트 `ref`를 검증하고 U-Quest가 아니면 `throw` 한다.
- 새로운 Supabase 클라이언트(브라우저/엣지/서버 무엇이든)를 추가할 때도 동일하게 이 가드를 통과시켜야 한다. 가드를 우회하는 직접 `createClient` 호출은 금지한다.

---

## 변경 이력

### 2026-05-28

- 관리자 설정값과 화면 스냅샷 구조를 문서화했다.

### 2026-06-11

- 아키텍처 기준을 포인트/경험치/챕터/컬렉션 구조로 전환했다.
- 서버 처리 대상을 미션 보상, 챕터 진행, 컬렉션 지급, 쿠폰 교환 중심으로 재정의했다.

### 2026-06-18

- U-Quest 환경 격리 헌법을 추가했다. 이 환경은 `luxuryguy562-cmyk/ureem_UQuest` 레포와 `uquest`(`ofeqiqauhvcovtzjangm`) 프로젝트만 사용하며, `Cashflow`/`pongdang`/`ureem` 등 다른 환경의 레포·프로젝트로 넘어가지 않는다. Supabase 연결은 코드(`assertUQuestProject`)에서 fail-closed로 차단한다.
- 저장 모델을 단일 JSON 스냅샷에서 정규화 테이블로 전환했다. `uquest-repository.ts` 가 조립 읽기 + 변경분 기록(diff) 방식으로 동작하고, 식별자를 uuid로 통일했다(배지는 code 유지). `supabase/seed.sql` 로 운영 기초 데이터를 시드한다.

### 2026-06-19

- 세션 쿠키에 HMAC 서명을 도입했다. 기존에는 쿠키에 유저 UUID 가 서명 없이 들어가 타인의 UUID 만 알면 점장·관리자로 위장할 수 있었다. 이제 로그인/회원가입은 `SUPABASE_SERVICE_ROLE_KEY` 로 서명한 토큰을 발급하고, `getRequesterId`·`/api/me` 는 서명이 유효한 쿠키만 신뢰한다(`src/lib/uquest-session.ts`). 운영자 추가 작업은 없으며, 서명 없는 옛 쿠키는 무효가 되어 사용자는 한 번 재로그인한다. 실제 DB 상대로 서명 쿠키 통과·raw UUID 차단·로그인 발급을 검증했다.
