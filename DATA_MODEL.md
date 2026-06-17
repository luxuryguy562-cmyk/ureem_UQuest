# DATA_MODEL.md

# U-Quest 데이터 모델 설계서

## 1. 문서 목적

본 문서는 U-Quest 개발에 필요한 핵심 데이터 구조를 정의한다.

목표는 다음과 같다.

신입 / 점장 / 본사 권한 분리

매장 기준 조회 구조 지원

20일 커리큘럼 운영

퀴즈, AX, 배지, 포인트, 쿠폰 이력 추적

관리자 운영 및 엑셀 다운로드 지원

# 2. 핵심 엔티티 목록

| 엔티티 | 목적 |
| --- | --- |
| users | 전체 사용자 계정 |
| stores | 매장 정보 |
| curriculums | 20일 커리큘럼 |
| quizzes | 커리큘럼별 퀴즈 문제 |
| attendances | 출석 기록 |
| learning_completions | 학습 완료 기록 |
| quiz_submissions | 퀴즈 제출 기록 |
| quiz_answers | 문제별 답변 기록 |
| ax_categories | AX/DX 고정 항목 |
| ax_submissions | AX 인증 기록 |
| badges | 배지 정의 |
| user_badges | 사용자 배지 획득 기록 |
| point_histories | 포인트 지급/차감 이력 |
| coupons | 쿠폰 상품 |
| coupon_requests | 쿠폰 교환 요청 |
| notifications | 알림센터 |
| onboarding_status | 사용자 온보딩 상태 |

# 3. users

전체 계정을 관리한다.

신입, 점장, 본사 관리자 모두 users 테이블에 저장한다.

## 주요 컬럼

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | uuid | 사용자 ID |
| role | enum | rookie / manager / admin |
| name | text | 이름 |
| phone | text | 휴대폰번호 |
| login_id | text | 로그인 아이디 |
| password_hash | text | 비밀번호 해시 |
| email | text nullable | 이메일 |
| employee_number | text nullable | 사번 |
| store_id | uuid nullable | 소속 또는 담당 매장 |
| hire_date | date nullable | 입사일 |
| status | enum | pending / active / rejected / completed / inactive |
| reject_reason | text nullable | 가입 반려 사유 |
| approved_at | timestamp nullable | 승인일 |
| completed_at | timestamp nullable | 수료일 |
| inactive_at | timestamp nullable | 비활성 처리일 |
| created_at | timestamp | 생성일 |
| updated_at | timestamp | 수정일 |

## role 정책

| role | 의미 |
| --- | --- |
| rookie | 신입 |
| manager | 점장 |
| admin | 본사 관리자 |

## status 정책

| status | 의미 |
| --- | --- |
| pending | 가입 승인 대기 |
| active | 온보딩 진행 중 |
| rejected | 가입 반려 |
| completed | 수료 |
| inactive | 퇴사/비활성 |

# 4. stores

매장 정보를 관리한다.

## 주요 컬럼

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | uuid | 매장 ID |
| name | text | 매장명 |
| code | text | 매장 코드 |
| is_active | boolean | 운영 여부 |
| created_at | timestamp | 생성일 |
| updated_at | timestamp | 수정일 |

## 매장 연결 정책

| 계정 | store_id |
| --- | --- |
| 신입 | 소속 매장 ID |
| 점장 | 담당 매장 ID |
| 본사 | null 또는 전체 접근 |

점장은 자신의 store_id와 동일한 신입만 조회 가능하다.

# 5. onboarding_status

신입의 온보딩 진행 상태를 요약 저장한다.

대시보드와 회원 목록 조회 성능을 위해 사용한다.

## 주요 컬럼

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | uuid | ID |
| user_id | uuid | 신입 ID |
| start_date | date | 온보딩 시작일 |
| end_date | date | 온보딩 종료일 |
| current_day | int | 현재 Day |
| progress_rate | numeric | 전체 진행률 |
| attendance_count | int | 출석 횟수 |
| learning_count | int | 학습 완료 수 |
| quiz_solved_count | int | 퀴즈 풀이 수 |
| quiz_correct_count | int | 퀴즈 정답 수 |
| quiz_accuracy_rate | numeric | 퀴즈 정답률 (%) |
| ax_submission_count | int | AX 인증 수 |
| character_level | int | 캐릭터 레벨 |
| quiz_tier | text | Bronze/Silver/Gold/Platinum/Diamond |
| ax_level | text | Explorer/User/Expert/Master |
| point_balance | int | 현재 포인트 |
| total_earned_points | int | 총 획득 포인트 |
| total_spent_points | int | 총 사용 포인트 |
| shop_opened_at | timestamp nullable | 상점 오픈일 |
| point_expire_at | timestamp nullable | 포인트 만료일 |
| created_at | timestamp | 생성일 |
| updated_at | timestamp | 수정일 |

## 수료 정책

온보딩 시작일 기준 4주 종료 시 자동 수료

수료 시 users.status = completed

completed_at 저장

shop_opened_at 저장

point_expire_at = completed_at + 3개월

# 6. curriculums

20일 커리큘럼을 관리한다.

퀴즈는 curriculums에 연결된다.

## 주요 컬럼

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | uuid | 커리큘럼 ID |
| day_number | int | Day 1~20 |
| title | text | 제목 |
| description | text | 설명 |
| image_url | text nullable | 대표 이미지 |
| learning_reward_points | int | 학습 완료 보상 |
| is_published | boolean | 공개 여부 |
| created_at | timestamp | 생성일 |
| updated_at | timestamp | 수정일 |

## 정책

day_number는 1~20 고정

20개를 초과하지 않는다

퀴즈는 해당 Day에 연결된다

# 7. quizzes

커리큘럼별 퀴즈 문제를 저장한다.

## 주요 컬럼

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | uuid | 퀴즈 ID |
| curriculum_id | uuid | 연결 커리큘럼 |
| question | text | 문제 |
| option_1 | text | 보기 1 |
| option_2 | text | 보기 2 |
| option_3 | text | 보기 3 |
| option_4 | text | 보기 4 |
| correct_option | int | 정답 번호 |
| explanation | text nullable | 해설 |
| reward_points | int | 문제당 보상 |
| sort_order | int | 문제 순서 |
| is_published | boolean | 공개 여부 |
| created_at | timestamp | 생성일 |
| updated_at | timestamp | 수정일 |

## 정책

Day별 문제 수 변경 가능

총 문제 수는 고정하지 않는다

재도전 불가

제출 후 정답/해설 공개

# 8. attendances

출석 기록을 저장한다.

## 주요 컬럼

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | uuid | 출석 ID |
| user_id | uuid | 사용자 ID |
| attendance_date | date | 출석일 |
| reward_points | int | 지급 포인트 |
| created_at | timestamp | 생성일 |

## 정책

user_id + attendance_date unique

하루 1회만 가능

출석 즉시 포인트 지급

point_histories에 기록

# 9. learning_completions

학습 완료 기록을 저장한다.

## 주요 컬럼

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | uuid | ID |
| user_id | uuid | 사용자 ID |
| curriculum_id | uuid | 커리큘럼 ID |
| reward_points | int | 지급 포인트 |
| created_at | timestamp | 생성일 |

## 정책

user_id + curriculum_id unique

Day당 1회만 가능

하루에 1개 커리큘럼만 완료 가능

학습 완료 후 해당 Day 퀴즈 진행 가능

point_histories에 기록

# 10. quiz_submissions

퀴즈 세트 제출 단위를 저장한다.

## 주요 컬럼

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | uuid | 제출 ID |
| user_id | uuid | 사용자 ID |
| curriculum_id | uuid | 커리큘럼 ID |
| total_count | int | 총 문제 수 |
| correct_count | int | 정답 수 |
| earned_points | int | 획득 포인트 |
| submitted_at | timestamp | 제출일 |

## 정책

user_id + curriculum_id unique

동일 Day 퀴즈 재도전 불가

퀴즈 포인트는 정오답과 무관하게 제출한 문제 수 기준으로 지급

제출 완료 후 quiz_answers 생성

제출 후 정답/해설 조회 가능

# 11. quiz_answers

문제별 사용자 답변을 저장한다.

## 주요 컬럼

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | uuid | 답변 ID |
| submission_id | uuid | 제출 ID |
| quiz_id | uuid | 퀴즈 ID |
| selected_option | int | 선택한 보기 |
| is_correct | boolean | 정답 여부 |
| reward_points | int | 문제별 지급 포인트 |
| created_at | timestamp | 생성일 |

## 정책

문제당 포인트 지급

정답 여부와 관계없이 풀이 포인트 지급

correct_count는 is_correct 기준으로 누적하며 quiz_accuracy_rate 계산에 사용한다.

# 12. ax_categories

AX/DX 고정 항목을 저장한다.

## 주요 컬럼

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | uuid | AX/DX 항목 ID |
| code | text | 고정 코드 |
| type | enum | ax / dx |
| title | text | 항목명 |
| description | text | 설명 |
| example_image_url | text nullable | 예시 이미지 |
| reward_points | int | 인증 보상 |
| is_published | boolean | 공개 여부 |
| sort_order | int | 정렬 |
| created_at | timestamp | 생성일 |
| updated_at | timestamp | 수정일 |

## 정책

AX/DX 항목은 7개로 고정한다.

고정 항목:

| type | title |
| --- | --- |
| ax | AI 헬프데스크 |
| ax | 스마트CS |
| ax | U+ONE |
| ax | 요금시뮬레이터 |
| dx | 생애주기 |
| dx | 타사확보 |
| dx | 자사전환 |

관리자는 설명, 예시 이미지, 보상 포인트, 공개 여부만 수정 가능하다.

항목 추가/삭제는 불가하다.

승인 절차 없음

# 13. ax_submissions

AX 인증 업로드 기록을 저장한다.

## 주요 컬럼

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | uuid | 인증 ID |
| user_id | uuid | 사용자 ID |
| category_id | uuid | AX/DX 항목 ID |
| image_url | text | 인증 이미지 |
| reward_points | int | 지급 포인트 |
| created_at | timestamp | 제출일 |

## 정책

중복 인증 가능

사진 업로드 또는 촬영 후 즉시 완료

업로드 즉시 포인트 지급

AX 인증 횟수는 ax_submissions count 기준

# 14. badges

배지 정의를 저장한다.

## 주요 컬럼

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | uuid | 배지 ID |
| category | enum | attendance / quiz / rare |
| name | text | 배지명 |
| description | text | 설명 |
| condition_type | enum | 조건 타입 |
| condition_value | int nullable | 조건 수치 |
| reward_points | int | 보상 포인트 |
| image_key | text | 고정 이미지 키 |
| is_rare | boolean | 희귀 여부 |
| is_hidden | boolean | 획득 전 숨김 여부 |
| sort_order | int | 정렬 |
| created_at | timestamp | 생성일 |
| updated_at | timestamp | 수정일 |

## condition_type 예시

| condition_type | 의미 |
| --- | --- |
| attendance_count | 출석 횟수 |
| quiz_solved_count | 퀴즈 풀이 수 |
| quiz_tier_diamond | Diamond 달성 |
| ax_master | AX Master 달성 |
| all_attendance_badges | 모든 출석 배지 |
| all_quiz_badges | 모든 퀴즈 배지 |
| all_public_badges | 모든 공개 배지 |
| all_rare_badges | 모든 희귀 배지 |

## 정책

배지명, 설명, 보상, 조건 수치는 관리자 수정 가능

배지 개수, 구조, 이미지는 관리자 수정 불가

image_key는 고정 에셋 참조

# 15. user_badges

사용자 배지 획득 기록을 저장한다.

## 주요 컬럼

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | uuid | ID |
| user_id | uuid | 사용자 ID |
| badge_id | uuid | 배지 ID |
| reward_points | int | 지급 포인트 |
| earned_at | timestamp | 획득일 |

## 정책

user_id + badge_id unique

중복 획득 불가

획득 즉시 포인트 지급

point_histories에 기록

# 16. point_histories

모든 포인트 변동 이력을 저장한다.

## 주요 컬럼

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | uuid | 이력 ID |
| user_id | uuid | 사용자 ID |
| amount | int | 증감 포인트 |
| balance_after | int | 처리 후 잔액 |
| type | enum | 이력 유형 |
| reason | text | 사유 |
| reference_type | text nullable | 참조 타입 |
| reference_id | uuid nullable | 참조 ID |
| created_by | uuid nullable | 관리자 ID |
| created_at | timestamp | 생성일 |

## type 예시

| type | 의미 |
| --- | --- |
| attendance | 출석 |
| learning | 학습 |
| quiz | 퀴즈 |
| ax | AX |
| badge | 배지 |
| coupon_request | 쿠폰 교환 |
| coupon_cancel | 쿠폰 취소 |
| manual_add | 수동 지급 |
| manual_subtract | 수동 차감 |
| expire | 만료 |
| inactive_forfeit | 탈퇴 소멸 |

## 정책

포인트 변동은 반드시 이 테이블에 기록

잔액 계산 후 balance_after 저장

수동 지급/차감은 reason 필수

# 17. coupons

쿠폰 상품을 저장한다.

## 주요 컬럼

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | uuid | 쿠폰 ID |
| name | text | 쿠폰명 |
| description | text nullable | 설명 |
| image_url | text nullable | 쿠폰 이미지 |
| actual_price | int | 실제 금액 |
| required_points | int | 필요 포인트 |
| stock_quantity | int nullable | 재고 |
| is_published | boolean | 노출 여부 |
| created_at | timestamp | 생성일 |
| updated_at | timestamp | 수정일 |

## 정책

1P = 1원 기본

required_points는 관리자 수정 가능

수료 전 상점 이용 불가

# 18. coupon_requests

쿠폰 교환 요청을 저장한다.

## 주요 컬럼

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | uuid | 요청 ID |
| user_id | uuid | 사용자 ID |
| coupon_id | uuid | 쿠폰 ID |
| required_points | int | 신청 시 필요 포인트 |
| status | enum | requested / canceled / sent |
| requested_at | timestamp | 신청일 |
| canceled_at | timestamp nullable | 취소일 |
| sent_at | timestamp nullable | 발송 완료일 |
| processed_by | uuid nullable | 처리 관리자 |
| cancel_reason | text nullable | 취소 사유 |

## 정책

신청 즉시 포인트 차감

발송 전 취소 가능

취소 시 포인트 즉시 원복

발송 완료 후 취소 불가

# 19. notifications

본사 앱 내 알림센터에 사용한다.

## 주요 컬럼

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | uuid | 알림 ID |
| target_role | enum | admin / manager / rookie |
| target_user_id | uuid nullable | 특정 사용자 대상 |
| type | enum | 알림 유형 |
| title | text | 제목 |
| message | text | 내용 |
| reference_type | text nullable | 참조 타입 |
| reference_id | uuid nullable | 참조 ID |
| is_read | boolean | 읽음 여부 |
| created_at | timestamp | 생성일 |

## 알림 유형 예시

| type | 의미 |
| --- | --- |
| signup_pending | 가입 승인 요청 |
| coupon_requested | 쿠폰 교환 요청 |
| coupon_canceled | 쿠폰 취소 |
| onboarding_completed | 수료 발생 |
| manual_point | 수동 포인트 처리 |

# 20. 권한별 데이터 접근

## 신입

조회 가능:

| 데이터 |
| --- |
| 본인 정보 |
| 본인 출석 |
| 본인 학습 |
| 본인 퀴즈 |
| 본인 AX |
| 본인 배지 |
| 본인 포인트 |
| 본인 쿠폰 |

## 점장

조회 가능:

| 데이터 |
| --- |
| 담당 매장 신입 목록 |
| 담당 매장 신입 진행률 |
| 담당 매장 신입 성장 상태 |
| 담당 매장 신입 배지 현황 |

점장은 수정 권한 없음.

## 본사 관리자

전체 조회 및 운영 가능.

# 21. 자동 처리 로직

## 온보딩 수료

매일 또는 로그인 시 검사한다.

조건:

현재일 >= onboarding_status.end_date

처리:

| 처리 |
| --- |
| users.status = completed |
| completed_at 저장 |
| shop_opened_at 저장 |
| point_expire_at = completed_at + 3개월 |
| 수료 알림 생성 |

## 포인트 만료

조건:

현재일 > point_expire_at

처리:

| 처리 |
| --- |
| 잔여 포인트 0 처리 |
| point_histories에 expire 기록 |

## 배지 지급

행동 발생 후 조건 검사.

예시:

| 행동 | 검사 |
| --- | --- |
| 출석 | 출석 배지 |
| 퀴즈 제출 | 퀴즈 배지, 티어, 희귀 배지 |
| AX 인증 | AX 단계, 희귀 배지 |
| 배지 획득 | 모든 공개 배지, 모든 희귀 배지 |

# 22. 중복 방지 규칙

| 항목 | 중복 방지 |
| --- | --- |
| 출석 | user_id + attendance_date unique |
| 학습 완료 | user_id + curriculum_id unique |
| 퀴즈 제출 | user_id + curriculum_id unique |
| 배지 획득 | user_id + badge_id unique |
| 쿠폰 발송 완료 후 취소 | 불가 |
| 포인트 이력 | 모든 변경 기록 필수 |

AX 인증은 중복 가능하다.

# 23. 엑셀 다운로드 기준

본사 관리자만 가능.

다운로드 대상:

| 데이터 |
| --- |
| 회원 목록 |
| 진행률 |
| 포인트 이력 |
| 쿠폰 이력 |
| 퀴즈 결과 |
| AX 인증 이력 |
| 배지 획득 현황 |

점장은 다운로드 불가.

# 24. MVP에서 제외할 기능

아래 기능은 MVP에서 제외한다.

| 기능 |
| --- |
| AX 인증 승인 |
| 점장 수정 권한 |
| 배지 조건 빌더 |
| 이미지 에셋 관리자 업로드 |
| 퀴즈 재도전 |
| 실시간 쿠폰 자동 발송 |
| 온보딩 기간 연장 |
| 랭킹 시스템 |
| 복잡한 이벤트 시스템 |

# 25. 개발 시 주의사항

포인트 잔액은 point_histories와 onboarding_status.point_balance가 일치해야 한다.

포인트 지급/차감은 트랜잭션으로 처리한다.

쿠폰 신청 시 포인트 차감과 coupon_request 생성은 같은 트랜잭션으로 처리한다.

쿠폰 취소 시 포인트 원복과 상태 변경은 같은 트랜잭션으로 처리한다.

권한 검사는 API와 DB 레벨에서 모두 적용한다.

점장은 store_id 기준으로만 조회 가능하다.

본사는 모든 store_id 조회 가능하다.

이미지는 고정 에셋을 사용한다.

AX/DX 인증 사진은 Supabase Storage의 `ax-evidence` bucket에 저장한다.

운영 배포 시 `supabase/schema.sql`과 `supabase/storage.sql`을 함께 적용한다.
