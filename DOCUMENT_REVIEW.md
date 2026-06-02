# DOCUMENT_REVIEW.md

## 2026-05-28 / 합본 문서 분리 검토

### 결론

`PROJECT_CONSTITUTION.md`와 `uquest_master_documentation_v_1.md`의 큰 방향은 같다.  
공통 핵심은 다음 세 가지다.

- 문서 우선
- 하드코딩 금지
- 관리자 설정이 사용자 화면과 경제 계산을 지배

다만 합본 문서가 그대로 작업 기준이 되기에는 역할이 섞여 있었다. 그래서 합본은 보관용으로 두고, 실제 기준은 개별 문서로 분리했다.

---

## 발견한 충돌/정리 필요점

### 1. DESIGN_RULE.md가 필수인데 파일이 없었음

헌법은 모든 UI 작업이 `DESIGN_RULE.md`를 따라야 한다고 했지만, 실제 파일과 최신 문서 목록에는 없었다.

조치:
- `DESIGN_RULE.md`를 신설했다.
- `PROJECT_CONSTITUTION.md`의 최신 문서 목록에 추가했다.

### 2. 합본 문서와 개별 문서의 우선순위가 없었음

`uquest_master_documentation_v_1.md` 안에 PRD, 구조, DB, 경제, 관리자, API, TODO가 모두 합쳐져 있었다.

조치:
- 합본은 원본 보관용으로 유지한다.
- 실제 작업 기준은 `PRD.md`, `SYSTEM_ARCHITECTURE.md` 등 개별 문서로 정한다.
- 합본과 개별 문서가 다르면 개별 문서를 우선한다.

### 3. PROJECT_CONSTITUTION.md에 닫히지 않은 코드블록이 있었음

Frontend Agent 설명의 코드블록이 닫히지 않아 이후 문서가 코드블록처럼 해석될 수 있었다.

조치:
- 코드블록 종료 표시를 추가했다.

### 4. DB 문서가 현재 화면보다 부족했음

합본의 DB 스키마는 최소 테이블만 있었다. 현재 목업에는 다음 기능이 추가로 필요하다.

- 미션 묶음
- 출석 로그
- 검 레벨 설정
- 히든 보상 후보/확률
- 경제 스냅샷
- 관리자 변경 로그
- 화면 설정 스냅샷

조치:
- `DATABASE_SCHEMA.md`와 `supabase/schema.sql`에서 확장 기준을 추가했다.

### 5. 수치 단위가 일부 섞여 있음

목업에는 `타격권 +3`과 `+30`, `골드`와 `코인` 표현이 섞여 있다.

판단:
- 현재는 UX 목업이라 허용한다.
- 실제 개발에서는 관리자 설정의 단일 재화 정의를 기준으로 정리해야 한다.

---

## 최종 정리

다음부터 코덱스 작업 시작 기준은 이 순서다.

1. `PROJECT_CONSTITUTION.md`
2. 작업 영역별 문서
3. `DESIGN_RULE.md`
4. `WORK_LOG.md`
5. `mockup.html` 또는 React 구현 파일
