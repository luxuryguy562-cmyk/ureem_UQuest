# VALIDATION_REPORT.md

## 검증 기준

- 기준일: 2026-06-17
- 최우선 문서: `CHANGELOG_v1.1.md`
- 검증 대상: Next 앱, 최종 MD 문서, 루트 기준 자료, 생성 에셋

---

## 수행한 수정

- `CHANGELOG_v1.1.md`와 `DATA_MODEL.md`를 루트에 생성했다.
- `PRD.md`, `GAME_DESIGN.md`, `ECONOMY_RULE.md`, `ADMIN_RULE.md`, `DATA_MODEL.md`의 충돌을 `CHANGELOG_v1.1.md` 기준으로 보정했다.
- `src/components/uquest/uquest-app.tsx`를 최종 온보딩 플로우 중심으로 교체했다.
- `src/lib/mock-data.ts`를 최종 데이터 모델 기반 fallback seed로 재구성했다.
- `src/lib/uquest-repository.ts`를 최종 config 구조에 맞게 정리했다.
- 새 AX 로봇 PNG 4종을 생성하고 앱에 연결했다.
- 사용자 제공 레퍼런스를 기준으로 새 캐릭터 PNG 남/여 5단계 총 10종을 생성하고 홈/프로필에 연결했다.
- 사용자 제공 레퍼런스를 기준으로 퀴즈 티어 PNG 6종과 배지 PNG 22종을 생성하고 티어/배지도감/프로필 최근 배지에 연결했다.
- 프로필 첫 카드를 상단 신분/퀴즈 티어, 중앙 캐릭터/AX 로봇, 하단 핵심 지표/최근 배지 구조로 조정했다.
- 테스트를 방해하던 Next 개발 표시를 `devIndicators: false`로 비활성화했다.
- `API_SPEC.md`, `FRONTEND_GUIDE.md`, `DESIGN_RULE.md`를 최종 기준으로 갱신했다.
- `supabase/schema.sql`을 최종 데이터 모델 기준으로 재작성했다.
- `supabase/storage.sql`을 추가해 AX/DX 사진 인증 저장소를 정의했다.
- 로그인, 로그아웃, 회원가입 API를 추가했다.
- 신입/점장/본사 관리자 API를 추가하고 주요 버튼을 API 요청으로 연결했다.
- 화면 상단 권한 전환 버튼을 제거하고 로그인한 계정 권한 기준으로 화면을 분리했다.
- 한국 시간 기준 오늘 날짜가 자동 반영되도록 수정했다.

---

## 코드 검증

| 항목 | 결과 |
| --- | --- |
| TypeScript | PASS |
| Production build | PASS |
| Next route `/` | PASS |
| 로그인/로그아웃 API | PASS |
| 회원가입 승인 대기 API | PASS |
| 쿠키 기반 관리자 API 접근 | PASS |
| 관리자 커리큘럼/퀴즈 저장 API | PASS |
| AX 사진 저장 API | PASS |
| AX 로봇 이미지 로드 | PASS |
| 캐릭터 이미지 로드 | PASS |
| 퀴즈 티어 이미지 로드 | PASS |
| 배지 이미지 로드 | PASS |
| 캐릭터/퀴즈티어/AX 로봇 통합 배치 | PASS |
| 상단 티어/하단 캐릭터+로봇 쇼케이스 | PASS |
| 프로필 목업형 카드 구성 | PASS |

실행 명령:

```text
npm run typecheck
npm run build
```

---

## UI 검증

| 항목 | 결과 |
| --- | --- |
| 390px 모바일 홈 | PASS |
| 390px 모바일 프로필 | PASS |
| 홈 성장 쇼케이스 | PASS |
| 390px 모바일 학습 | PASS |
| 390px 모바일 퀴즈 | PASS |
| 390px 모바일 AX | PASS |
| 390px 점장 화면 | PASS |
| 390px 본사 화면 | PASS |
| 관리자 커리큘럼/퀴즈 설정 화면 | PASS |
| 로그인 화면 | PASS |
| 로그아웃 후 로그인 복귀 | PASS |
| 390px 검증 패널 | PASS |
| 768px 태블릿 홈 | PASS |
| 가로 오버플로우 | PASS |
| 긴 이름/긴 쿠폰명 대응 | PASS |

확인 내용:

- 카드 밖 텍스트 넘침 없음
- 가로 스크롤 제거
- 모바일/태블릿 폭에서 레이아웃 유지
- AX/DX 7개 항목 표시
- 점장 화면 수정 버튼 없음
- 홈/프로필 캐릭터 PNG 로드
- 홈/프로필 퀴즈 티어 PNG 로드
- 배지도감 배지 PNG 21개 로드
- 본사 검증 패널 10개 항목 PASS

---

## 사용자 플로우 검증

| 플로우 | 결과 |
| --- | --- |
| 신입 홈 진입 | PASS |
| 로그인 후 신입 홈 진입 | PASS |
| 로그아웃 | PASS |
| 출석 버튼 | PASS |
| 학습 완료 | PASS |
| 학습 완료 후 퀴즈 오픈 | PASS |
| 퀴즈 제출 후 정답/해설 표시 | PASS |
| AX 업로드 인증 즉시 완료 | PASS |
| 배지도감 조회 | PASS |
| 프로필 조회 | PASS |
| 수료 전 상점 잠금 | PASS |
| 신입 하단 상점 탭 | PASS |
| 수료자 상점 접근 | PASS |
| 쿠폰 요청 즉시 포인트 차감 | PASS |
| 발송 전 쿠폰 취소 시 포인트 원복 | PASS |

---

## 권한 검증

| 권한 | 결과 |
| --- | --- |
| 신입 | PASS |
| 로그인 계정 기준 화면 분기 | PASS |
| 점장 담당 매장 조회 | PASS |
| 점장 수정 권한 없음 | PASS |
| 본사 전체 대시보드 | PASS |
| 본사 회원 승인/반려 | PASS |
| 본사 쿠폰 발송/취소 | PASS |

---

## 예외 상황 검증

| 예외 | 결과 |
| --- | --- |
| 승인 전 로그인 | PASS |
| 승인 반려 | PASS |
| 포인트 부족 | PASS |
| 재고 없음 | PASS |
| 중복 출석 | PASS |
| 하루 1개 초과 학습 | PASS |
| 퀴즈 재진입 | PASS |
| 쿠폰 중복 요청 | PASS |
| 수료 전 상점 접근 | PASS |
| 권한 우회 접근 | PASS |
| URL 직접 접근 | PASS |
| 탈퇴자 접근 | PASS |
| 만료 포인트 사용 | PASS |
| 만료 쿠폰 조회 | PASS |
| 관리자 권한 없는 사용자 접근 | PASS |

확인 내용:

- 로그인하지 않은 `/api/me`는 사용자 없음으로 응답한다.
- 브라우저 화면에서는 권한 전환 버튼을 제거했다.
- 배포 모드 API는 로그인 쿠키 없이는 요청자를 기본 관리자/점장으로 대체하지 않는다.
- 로컬 개발 모드에서만 테스트용 `x-uquest-user-id`를 허용한다.

---

## 데이터 검증

| 항목 | 결과 |
| --- | --- |
| users/stores 연결 | PASS |
| curriculums 20일 구조 | PASS |
| quiz 문제 수 Day별 가변 | PASS |
| ax_categories 7개 고정 | PASS |
| ax_submissions category_id 기준 | PASS |
| point_histories 이력 저장 | PASS |
| coupon_requests 이력 | PASS |
| admin_audit_logs 샘플 | PASS |
| FK/삭제 정책 SQL 작성 | PASS |
| RLS/서버 권한 정책 SQL 작성 | PASS |
| AX 인증 Storage 정책 SQL 작성 | PASS |

운영 적용 메모:

- 현재 앱은 운영 DB 테이블과 JSON 스냅샷을 함께 준비한 상태다.
- 최종 배포 전에는 `supabase/schema.sql`, `supabase/storage.sql`을 운영 Supabase에 적용해야 한다.

---

## 남은 운영 전 필수 작업

1. 운영 Supabase에 `supabase/schema.sql`, `supabase/storage.sql` 적용
2. 실제 쿠폰 발송사 API 연결
3. 알림톡/문자/푸시 연결
4. 관리자 편집 화면의 세부 UX 고도화
5. 구버전 crop 에셋 미사용 처리 또는 정리
6. 최종 브랜드 승인 후 에셋 미세 보정

---

## 결론

현재 상태는 최종 기획 기준의 프론트 플로우, 로그인/권한, Next API, 문서, DB/Storage SQL, 생성 에셋, 검증 패널이 연결된 통합 MVP 상태다.

실서비스 배포 전 마지막 남은 핵심은 운영 Supabase 적용, 실제 쿠폰 발송사 연동, 알림 채널 연동이다.
