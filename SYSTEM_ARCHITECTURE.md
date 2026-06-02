# SYSTEM_ARCHITECTURE.md

## 전체 구조

```text
Frontend (Next.js / React)
↓
Supabase
↓
Economy Engine
↓
Reward System
↓
External Gifticon API
```

현재 프론트 구현 구조:

```text
Next.js Server Component page
→ getUQuestAppConfig()
→ Supabase app_config_snapshots.payload
→ UQuestApp Client Component
→ 화면별 React 컴포넌트
```

Supabase 환경변수가 없는 로컬 목업 환경에서는 `mock-data.ts` fallback seed를 사용한다.

---

## 기술 스택

본 프로젝트의 기술 스택은 최종 개발 단계에서 확정한다.

현재 권장안은 다음과 같다.

### 권장 Frontend
- Next.js 또는 React
- TailwindCSS
- 모바일 웹 기준 UI
- 추후 PWA 가능성 고려

### 권장 Backend
- Supabase
  - Auth
  - PostgreSQL
  - Edge Functions
  - Storage

### 권장 External
- 기프티콘 API
- 문자/알림톡 API
- 이미지 Asset Storage

※ 단, 실제 개발자는 운영비, 유지보수 난이도, 배포 편의성을 검토해 최종 스택을 제안해야 한다.

---

## 구조 원칙

### 1. 하드코딩 금지
미션, 보상, 확률, 검 레벨, 성장 조건, 정렬순서, 이미지 경로는 코드에 고정하지 않는다.

### 2. 관리자 입력값과 자동 계산값을 분리한다
관리자가 직접 입력하는 값:
- 1인 월 기본 보상 한도
- 특별 포함 최대 한도
- 미션 중요도 계수
- 보상 상품 정보
- 이벤트 배율
- 활성/비활성 여부

시스템이 자동 계산하는 값:
- 월 예상 타격수
- 1타 평균 코인
- 경제보정계수
- 히든 확률
- 검 레벨별 추천 보상 상한
- 예상 월 지급액
- 예산 위험도

### 3. 경제 계산은 서버에서 처리한다
프론트엔드는 결과만 보여준다.
실제 계산은 Supabase Edge Function 또는 서버 함수에서 처리한다.

### 4. 관리자 화면은 경제 시뮬레이터 역할을 한다
관리자가 금액/계수를 조정하면 아래 값이 자동으로 갱신되어야 한다.
- 예상 월 지급액
- 1인 평균 보상
- 히든 지급 예상액
- 예산 초과 위험도
- 추천 보정계수

### 5. 유저 화면은 계산 결과만 반영한다
유저는 복잡한 경제식을 보지 않는다.
유저에게는 다음처럼 단순하게 보여준다.
- 오늘 획득 가능 타격권
- 보유 코인
- 히든코인
- 검 성장 효과
- 보상 교환 가능 여부

---

## Supabase 연결 기준

프론트는 운영 테이블을 여러 번 직접 조합하지 않는다. 서버/Edge Function/Admin 저장 로직이 운영 테이블을 계산한 뒤 `app_config_snapshots`의 `payload`를 갱신한다.

이유:
- 사용자 화면 속도를 빠르게 유지한다.
- 경제 계산식을 프론트에 노출하지 않는다.
- 관리자 변경값을 한 번에 사용자 화면에 반영한다.

---

## 변경 이력

### 2026-05-28

- React/Next 구현 구조와 `app_config_snapshots` 연결 방식을 추가했다.
