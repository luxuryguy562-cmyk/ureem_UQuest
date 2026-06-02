# FRONTEND_GUIDE.md

## 화면 구조

```text
src/app
  layout.tsx
  page.tsx

src/components/uquest
  uquest-app.tsx
  home-screen.tsx
  profile-screen.tsx
  inventory-screen.tsx
  tree-screen.tsx
  sword-screen.tsx
  shop-screen.tsx
  admin-screen.tsx
  overlays.tsx
  common.tsx
  pixel-art.tsx
```

---

## 컴포넌트 구조

```text
src/lib
  uquest-repository.ts
  mock-data.ts
  format.ts

src/types
  uquest.ts
```

현재 구현은 단일 Next 페이지 안에서 모바일 앱처럼 화면을 전환한다. 추후 실제 라우팅이 필요하면 `/home`, `/sword`, `/shop`, `/inventory`, `/profile`, `/admin` 라우트로 분리할 수 있다.

---

## 데이터 원칙

- 컴포넌트는 화면 수치와 문구를 직접 소유하지 않는다.
- `getUQuestAppConfig()`가 Supabase의 `app_config_snapshots`를 읽어 화면 데이터를 공급한다.
- Supabase 환경변수가 없을 때만 `mock-data.ts`의 fallback seed를 사용한다.
- fallback seed는 목업 확인용이며 운영 데이터의 기준이 아니다.

---

## UI 원칙

- 모바일 우선
- 카드형 구조
- 지나친 텍스트 금지
- 성장 체감 강조
- 타격감 강조
- 출석/캘린더/요일/검색/정렬/필터 같은 범용 기능은 일반 앱 문법을 따른다.
- 출석 주간 표시는 `월 화 수 목 금 토 일`을 유지하고, 오늘/완료 상태는 실제 해당 요일 칸에 표시한다.

---

## 애니메이션 원칙

- 과하지 않게
- 타격 시 즉각 반응
- 성장 연출은 강하게
- 실제 지급량보다 체감 중심

---

## 변경 이력

### 2026-05-28

- HTML 목업을 React/Next 컴포넌트 구조로 분리했다.
- 화면 값 공급 지점을 `getUQuestAppConfig()`로 모았다.

### 2026-06-01

- 범용 기능은 새로 발명하지 않고 익숙한 앱 패턴을 따른다는 UI 원칙을 추가했다.
- 출석 체크의 오늘/완료 상태를 실제 요일 칸에 표시하도록 기준을 명시했다.
