# U-Quest — Cloudflare 배포 가이드

이 문서는 U-Quest를 Cloudflare에 배포하는 흐름을 정리한다.

> ⚠️ **캐시플로우와 분리**: 반드시 **U-Quest 전용** Cloudflare 프로젝트/토큰/계정을
> 사용한다. 캐시플로우 Cloudflare 프로젝트에 배포하거나 토큰을 재사용하지 않는다.

---

## 0. 먼저 알아둘 점 (중요)

U-Quest는 단순 정적 사이트가 아니다. **서버 API Route(`src/app/api/**`)** 가 있고,
인증에 **`node:crypto`** 를 쓴다. 그래서 "정적 Export" 로는 배포할 수 없고,
**서버 런타임이 있는 배포 방식**이 필요하다.

Cloudflare에서 Next.js를 서버로 돌리는 방법은 두 가지다:

| 방식 | 설명 | U-Quest 적합도 |
|---|---|---|
| **OpenNext (`@opennextjs/cloudflare`)** | Next.js를 Cloudflare **Workers** 위에서 실행. `nodejs_compat` 로 `node:crypto` 지원. Cloudflare가 현재 권장. | ✅ 권장 |
| `@cloudflare/next-on-pages` | Cloudflare **Pages** + Edge 런타임. 모든 라우트가 Edge runtime 이어야 함. | △ node:crypto 등 제약 큼 |

→ **권장: OpenNext(Workers) 방식.** 아래는 그 기준으로 안내한다.
(회사 정책상 "Pages"가 꼭 필요하면 알려주면 next-on-pages 기준으로 다시 잡아준다.)

---

## 1. 배포 전 준비물

1. **U-Quest 전용 Cloudflare 계정 ID** → `CLOUDFLARE_ACCOUNT_ID`
   - Cloudflare 대시보드 → 우측 또는 Workers & Pages 개요에서 Account ID 확인.
2. **API 토큰** → `CLOUDFLARE_API_TOKEN`
   - My Profile → API Tokens → Create Token → "Edit Cloudflare Workers" 템플릿.
3. **Supabase 환경변수 3개** (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
   → Cloudflare 프로젝트의 **환경변수/시크릿**으로 등록해야 배포본이 실DB에 붙는다.

---

## 2. 방법 A — 대시보드 Git 연동 (가장 쉬움, 추천)

코드를 푸시하면 Cloudflare가 자동 빌드·배포한다.

1. Cloudflare 대시보드 → **Workers & Pages** → **Create** → **Import a repository**.
2. GitHub 연결 후 **`luxuryguy562-cmyk/ureem_uquest`** 선택. (캐시플로우 레포 아님 확인!)
3. 프레임워크 프리셋: **Next.js**. 빌드 설정은 OpenNext 사용 시:
   - Build command: `npx opennextjs-cloudflare build`
   - Deploy command / output: 어댑터 안내에 따름 (`.open-next` 산출물)
4. **환경변수 등록**: 위 Supabase 3개를 Production/Preview 양쪽에 추가.
   - `SUPABASE_SERVICE_ROLE_KEY` 는 **Secret** 으로 등록.
5. 저장 후 첫 배포 실행. 이후 지정 브랜치 push 시 자동 배포.

---

## 3. 방법 B — 로컬/CLI (Wrangler + OpenNext)

직접 빌드해서 올리는 방식. (CI에서도 동일)

```bash
# 1) 어댑터 설치 (최초 1회)
npm install --save-dev @opennextjs/cloudflare wrangler

# 2) 환경변수 (U-Quest 전용 값만!)
export CLOUDFLARE_ACCOUNT_ID=...      # U-Quest 계정
export CLOUDFLARE_API_TOKEN=...       # U-Quest 토큰

# 3) 빌드 (Next build → Cloudflare 산출물 변환)
npx opennextjs-cloudflare build

# 4) 미리보기 (로컬에서 Workers 런타임으로 실행)
npx opennextjs-cloudflare preview

# 5) 배포
npx opennextjs-cloudflare deploy
```

`wrangler.toml` (또는 `wrangler.jsonc`) 예시 — `node:crypto` 위해 nodejs_compat 필수:

```toml
name = "u-quest"                      # 캐시플로우와 다른 이름
compatibility_date = "2025-03-01"
compatibility_flags = ["nodejs_compat"]
```

Supabase 키는 빌드 시점이 아니라 런타임 시크릿으로 주입:

```bash
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put NEXT_PUBLIC_SUPABASE_ANON_KEY
# NEXT_PUBLIC_SUPABASE_URL 도 동일하게 등록
```

> 참고: `@opennextjs/cloudflare` / `wrangler` 패키지는 아직 이 레포에 설치돼 있지
> 않다. 위 1단계에서 설치한 뒤 사용한다. 설치·설정을 자동으로 잡아주길 원하면
> 말해달라(현재 working build를 깨지 않도록 별도로 진행).

---

## 4. 빌드/배포 흐름 요약

```
코드 변경 (claude/* 브랜치)
  → npm run typecheck / npm run build 로 로컬 검증
  → 지정 브랜치에 push
  → (방법 A) Cloudflare가 자동 빌드(opennextjs-cloudflare build) → 배포
     (방법 B) npx opennextjs-cloudflare build → deploy
  → 배포본은 Cloudflare에 등록된 Supabase 시크릿으로 U-Quest DB에 연결
```

---

## 5. 체크리스트

- [ ] Cloudflare 프로젝트 이름이 캐시플로우와 다른가? (`u-quest`)
- [ ] `CLOUDFLARE_ACCOUNT_ID` / `CLOUDFLARE_API_TOKEN` 이 U-Quest 전용인가?
- [ ] Supabase 3개 키가 Cloudflare 환경변수/시크릿으로 등록됐는가?
- [ ] `NEXT_PUBLIC_SUPABASE_URL` 이 캐시플로우가 아닌 U-Quest 프로젝트를 가리키는가?
- [ ] `nodejs_compat` 플래그가 켜져 있는가? (node:crypto 때문)
- [ ] 연결한 GitHub 레포가 `ureem_uquest` 인가?
