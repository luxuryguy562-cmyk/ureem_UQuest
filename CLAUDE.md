# CLAUDE.md — U-Quest

이 문서는 Claude Code(및 새 작업자)가 U-Quest 레포에서 작업할 때 따라야 할 기준이다.

## 프로젝트 개요

U-Quest는 유림텔레콤 **신입 직원 4주 온보딩 게임**이다. 신입은 4주(20일 커리큘럼)
동안 출석·학습·퀴즈·AX 인증을 수행하며 성장하고, 성장 결과는 캐릭터/배지/티어/AX
로봇으로 시각화된다. 수료 후 포인트로 쿠폰을 교환한다.

사용자 유형: **신입(rookie) / 점장(manager) / 본사 관리자(admin)**.

> 상세 기획은 루트의 `PRD.md`, `GAME_DESIGN.md`, `DATA_MODEL.md`, `ECONOMY_RULE.md`,
> `ADMIN_RULE.md`, `API_SPEC.md`, `SYSTEM_ARCHITECTURE.md`, `FRONTEND_GUIDE.md`,
> `DESIGN_RULE.md` 참고. 우선순위는 `CHANGELOG_v1.1.md > PRD.md > GAME_DESIGN.md >
> DATA_MODEL.md`.

## ⚠️ 최우선 주의사항 — 캐시플로우와 절대 분리

U-Quest는 **캐시플로우(Cashflow) 앱과 완전히 별개**인 프로젝트다.

- **DB·환경변수·Supabase 프로젝트·Cloudflare 프로젝트를 캐시플로우와 절대 공유하지 않는다.**
- 환경변수에 캐시플로우의 Supabase URL/키, Cloudflare 토큰을 넣지 않는다.
- 의심되면 멈추고 사람에게 확인한다. (어느 Supabase/Cloudflare 프로젝트인지 불확실할 때)
- `.env.local` 의 `NEXT_PUBLIC_SUPABASE_URL` 이 U-Quest 전용 프로젝트를 가리키는지 항상 확인.

## 기술 스택

- **Next.js 16** (App Router, Turbopack) + **React 18**
- **TypeScript** (strict)
- **Supabase** (Postgres + RLS + Storage `ax-evidence` 버킷)
- 빌드/런타임: Node 기반 (인증에 `node:crypto` 사용)
- 배포 대상: **Cloudflare** (Pages/Workers — `DEPLOY_CLOUDFLARE.md` 참고)

## 폴더 구조

```
src/
  app/
    layout.tsx, page.tsx, globals.css, icon.svg
    api/                  # Next API Routes (서버 경계)
      auth/               # login, logout, signup
      me/                 # 현재 사용자
      rookie/             # attendance, learning-completions, quiz-submissions,
                          #   ax-submissions, home, profile, point-histories
      shop/               # 상점, coupon-requests, cancel
      manager/            # rookies (담당 매장 신입 조회)
      admin/              # dashboard, users(approve/reject), curriculums,
                          #   coupon-requests(send)
  components/uquest/      # uquest-app.tsx (앱 UI)
  lib/
    supabase/server.ts    # 서버용 Supabase 클라이언트 (env 없으면 null → fallback)
    uquest-repository.ts  # DB 접근 + fallback 처리
    uquest-domain.ts      # 도메인 규칙(포인트/경험치/진행 계산)
    uquest-auth.ts        # 비밀번호 해시/검증, 회원가입 생성
    uquest-api.ts, format.ts, mock-data.ts
  types/uquest.ts         # 공용 타입
supabase/
  schema.sql              # 전체 스키마 + RLS + 시드(AX 7항목)
  storage.sql             # ax-evidence Storage 버킷 + 정책
public/assets/uquest/     # 캐릭터/배지/티어/AX 로봇 등 생성 에셋
references/               # 와이어프레임, 원본 docx/이미지
scripts/                  # 로컬 개발 보조 스크립트(PowerShell)
.claude/                  # SessionStart 훅, 설정
```

## 실행 / 빌드 / 배포 명령

```bash
npm install            # 의존성 설치
npm run dev            # 개발 서버 (기본)
npm run dev:local      # 개발 서버 (127.0.0.1:3000 고정)
npm run typecheck      # tsc --noEmit (테스트/린터 대용 — 변경 후 반드시 실행)
npm run build          # 프로덕션 빌드
npm start              # 빌드 결과 실행
```

별도 테스트 러너/ESLint는 없다. **`npm run typecheck` 가 1차 검증 수단**이다.
변경 후에는 최소 `typecheck` → 가능하면 `build` 까지 확인한다.

## 환경변수

`.env.local.example` 을 복사해 `.env.local` 을 만들어 채운다.

| 변수 | 용도 | 필수 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | 실DB 연결 시 필수 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public 키 | 실DB 연결 시 필수 |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role 키(서버 전용, 비밀) | 실DB 연결 시 필수 |
| `SUPABASE_ACCESS_TOKEN` | CLI/마이그레이션용 | 선택 |
| `CLOUDFLARE_API_TOKEN` | Cloudflare 배포 | 배포 시 |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 계정 | 배포 시 |

**중요한 fallback 동작:** `NEXT_PUBLIC_SUPABASE_URL`/키가 없으면
`createServerSupabaseClient()` 가 `null` 을 반환하고, 앱은 `src/lib/mock-data.ts`
의 더미 데이터로 동작한다. 즉 **키가 없어도 앱은 뜨지만 진짜 데이터는 아니다.**
실데이터로 동작하려면 환경변수를 채우고 `supabase/schema.sql` + `storage.sql` 을
해당 Supabase 프로젝트에 적용해야 한다.

## Supabase 사용 규칙

`SYSTEM_ARCHITECTURE.md` 기준:

- **모든 사용자 데이터 테이블에 RLS를 켠다.** 직원은 본인 데이터만, 점장은 담당 매장
  신입만, 본사는 전체 조회.
- **포인트/경험치/잔액 계산은 서버에서만** 처리한다. 프론트에서 직접 잔액·경험치를
  바꾸지 않는다. (출석/미션/챕터 보상 지급, 포인트 차감, 쿠폰 발급 등)
- 포인트 차감과 쿠폰 발급은 **트랜잭션**으로 처리한다.
- 미션명/포인트/조건/가격/이미지 경로 등은 **하드코딩 금지** — DB(설정값)/스냅샷에서 온다.
- `app_config_snapshots.current.payload` 는 화면 렌더링용 읽기 모델이다.
- 서버 클라이언트는 `service_role` 키를 쓰므로 **서버(API Route) 안에서만** 사용한다.
  브라우저로 service_role 키가 새지 않도록 주의.
- 스키마 변경은 `supabase/schema.sql` 에 반영하고, 적용 전 **기존 테이블을 먼저 확인**한다.

## 코딩 컨벤션

- TypeScript **strict**. `any` 지양, 타입은 `src/types/uquest.ts` 에 모은다.
- import 별칭: `@/*` → `src/*` (`tsconfig.json`).
- 서버 경계는 `src/app/api/**` 의 Route Handler. 도메인 규칙은 `src/lib/uquest-domain.ts`,
  DB 접근은 `src/lib/uquest-repository.ts` 로 분리한다 (UI에서 직접 DB 호출 금지).
- 배포 모드에서는 로그인 쿠키 없는 요청을 관리자/점장으로 대체하지 않는다.
  테스트용 요청자 헤더는 로컬 개발 모드에서만 허용한다.
- 주변 코드 스타일(따옴표, 네이밍, 주석 밀도)을 따른다.

## 작업 절차

1. 변경 → `npm run typecheck` (필수) → 가능하면 `npm run build`.
2. 커밋 메시지는 명확하고 서술적으로.
3. 작업은 `claude/*` 브랜치에서 하고, 지정 브랜치로만 push 한다.
4. DB/배포/계정이 캐시플로우와 섞일 가능성이 보이면 **멈추고 확인**.
