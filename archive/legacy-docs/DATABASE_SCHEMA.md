# DATABASE_SCHEMA.md

## 상태

- 기준일: 2026-06-11
- 기준 방향: 챕터 기반 온보딩, 포인트/경험치 분리, 배지/칭호/프레임 컬렉션
- 현재 단계: 문서 기준 전환 완료, SQL migration 추가 필요
- 이전 기준: `DB_DESIGN_DRAFT.md`와 기존 `supabase/schema.sql`에는 타격권/나무/검 구조가 남아 있을 수 있다.

---

# 1. 핵심 원칙

U-Quest DB는 단순 잔액 저장소가 아니라 온보딩 행동, 보상, 성장, 자랑 요소의 이력을 추적하는 구조다.

| 구분 | 역할 |
|---|---|
| 설정 테이블 | 관리자가 바꾸는 미션, 챕터, 보상, 컬렉션 기준값 |
| 상태 테이블 | 사용자의 현재 온보딩 진행 상태 |
| 원장/로그 테이블 | 포인트, 경험치, 쿠폰, 장착 변경 이력 |
| 스냅샷 테이블 | 프론트가 빠르게 읽는 최종 화면 JSON |

프론트에서 직접 잔액, 경험치, 배지, 쿠폰을 변경하면 안 된다. 지급과 차감은 서버 함수 또는 API를 통해 처리한다.

---

# 2. 전체 흐름

관리자 설정 흐름:

```text
관리자 설정
→ 미션/챕터/배지/칭호/프레임/보상 기준 저장
→ 경제 스냅샷 계산
→ app_config_snapshots.payload 갱신
→ 사용자 화면 반영
```

사용자 행동 흐름:

```text
출석/미션 완료
→ 포인트 원장 기록
→ 경험치 원장 기록
→ 챕터 진행 갱신
→ 배지/칭호/프레임 지급 조건 평가
→ 프로필/캐릭터 진행도 갱신
→ 쿠폰 교환 시 포인트 차감 및 쿠폰 발급
```

---

# 3. 테이블 그룹

## 3.1 회사/사용자/권한

### `organizations`

회사 단위.

| 컬럼 | 설명 |
|---|---|
| `id` | 회사 ID |
| `name` | 회사명 |
| `active` | 사용 여부 |
| `created_at` | 생성일 |
| `updated_at` | 수정일 |

### `stores`

매장/지점 단위.

| 컬럼 | 설명 |
|---|---|
| `id` | 매장 ID |
| `organization_id` | 회사 ID |
| `name` | 매장명 |
| `code` | 내부 코드 |
| `active` | 사용 여부 |
| `sort_order` | 정렬 순서 |
| `created_at` | 생성일 |
| `updated_at` | 수정일 |

### `teams`

매장 안의 팀, 파트, 교육조.

| 컬럼 | 설명 |
|---|---|
| `id` | 팀 ID |
| `store_id` | 매장 ID |
| `name` | 팀명 |
| `active` | 사용 여부 |
| `sort_order` | 정렬 순서 |
| `created_at` | 생성일 |
| `updated_at` | 수정일 |

### `profiles`

Supabase Auth 사용자와 연결되는 서비스 사용자 정보.

| 컬럼 | 설명 |
|---|---|
| `id` | `auth.users.id`와 같은 값 |
| `organization_id` | 회사 ID |
| `store_id` | 소속 매장 |
| `team_id` | 소속 팀 |
| `display_name` | 표시 이름 |
| `employee_no` | 사번 또는 내부 식별값 |
| `phone` | 연락처 |
| `onboarding_day` | 온보딩 진행 일차 |
| `current_chapter_id` | 현재 챕터 |
| `level` | 표시용 성장 레벨 |
| `exp_total` | 누적 경험치 |
| `active` | 사용 여부 |
| `approved_by` | 승인 관리자 |
| `approved_at` | 승인 시간 |
| `created_at` | 생성일 |
| `updated_at` | 수정일 |

### `role_assignments`

직원, 점장, 팀장, 슈퍼관리자 권한을 저장한다.

| 컬럼 | 설명 |
|---|---|
| `id` | 권한 ID |
| `user_id` | 사용자 |
| `role` | `employee`, `manager`, `team_lead`, `super_admin` |
| `scope_type` | `organization`, `store`, `team` |
| `scope_id` | 권한 범위 ID |
| `created_at` | 생성일 |

---

## 3.2 미션/출석/퀴즈

### `mission_groups`

홈/미션 화면의 미션 묶음.

| 컬럼 | 설명 |
|---|---|
| `id` | 그룹 ID |
| `title` | 그룹명 |
| `icon` | 임시 아이콘 |
| `asset_key` | 이미지 교체용 키 |
| `active` | 노출 여부 |
| `sort_order` | 정렬 순서 |
| `created_at` | 생성일 |
| `updated_at` | 수정일 |

### `missions`

관리자가 수정하는 미션 원본.

| 컬럼 | 설명 |
|---|---|
| `id` | 미션 ID |
| `group_id` | 미션 그룹 |
| `chapter_id` | 연결 챕터 |
| `title` | 미션명 |
| `description` | 미션 설명 |
| `icon` | 임시 아이콘 |
| `asset_key` | 이미지 교체용 키 |
| `mission_type` | `attendance`, `routine`, `quiz`, `axdx`, `mentor`, `event`, `manual` |
| `validation_method` | `auto`, `quiz`, `manager_approval`, `external`, `manual` |
| `source_label` | 화면에 보이는 출처 라벨 |
| `base_point` | 기본 포인트 |
| `base_exp` | 기본 경험치 |
| `daily_limit` | 일일 제한 |
| `required` | 챕터 필수 여부 |
| `starts_at` | 시작 시간 |
| `ends_at` | 종료 시간 |
| `active` | 사용 여부 |
| `sort_order` | 정렬 순서 |
| `metadata` | 퀴즈/외부 연동용 추가 설정 |
| `created_at` | 생성일 |
| `updated_at` | 수정일 |

### `mission_completions`

미션 수행/승인 이력.

| 컬럼 | 설명 |
|---|---|
| `id` | 완료 ID |
| `user_id` | 사용자 |
| `mission_id` | 미션 |
| `chapter_id` | 연결 챕터 |
| `status` | `pending`, `approved`, `rejected`, `auto_approved`, `cancelled` |
| `progress` | 완료율 |
| `period_date` | 일일 제한 기준 날짜 |
| `evidence_payload` | 증빙/퀴즈 답변/외부 결과 |
| `reward_point` | 확정 지급 포인트 |
| `reward_exp` | 확정 지급 경험치 |
| `requested_at` | 요청 시간 |
| `approved_by` | 승인자 |
| `approved_at` | 승인 시간 |
| `rejected_reason` | 반려 사유 |
| `idempotency_key` | 중복 지급 방지 키 |

### `attendance_logs`

출석 전용 로그. `user_id + attendance_date`는 중복될 수 없다.

| 컬럼 | 설명 |
|---|---|
| `id` | 출석 ID |
| `user_id` | 사용자 |
| `attendance_date` | 출석일 |
| `streak_day` | 연속 출석일 |
| `reward_point` | 출석 보상 포인트 |
| `reward_exp` | 출석 보상 경험치 |
| `created_at` | 생성일 |

### `quiz_questions`, `quiz_options`, `quiz_attempts`

퀴즈를 문제은행으로 운영할 때 쓰는 확장 테이블. 처음에는 `missions.metadata`로 간단히 시작할 수 있다.

정답 정보는 일반 사용자에게 직접 노출하지 않는다.

---

## 3.3 챕터

### `chapters`

2개월 온보딩 여정을 단계로 나눈 원본.

| 컬럼 | 설명 |
|---|---|
| `id` | 챕터 ID |
| `title` | 챕터명 |
| `subtitle` | 짧은 설명 |
| `description` | 상세 설명 |
| `chapter_no` | 순서 |
| `starts_day` | 권장 시작 일차 |
| `ends_day` | 권장 종료 일차 |
| `required_exp` | 권장 경험치 기준 |
| `completion_policy` | 완료 조건 JSON |
| `reward_point` | 챕터 완료 보너스 포인트 |
| `reward_badge_id` | 완료 배지 |
| `reward_title_id` | 완료 칭호 |
| `reward_frame_id` | 완료 프레임 |
| `asset_key` | 대표 이미지 키 |
| `active` | 사용 여부 |
| `created_at` | 생성일 |
| `updated_at` | 수정일 |

### `chapter_progress`

사용자별 챕터 진행 상태.

| 컬럼 | 설명 |
|---|---|
| `id` | 진행 ID |
| `user_id` | 사용자 |
| `chapter_id` | 챕터 |
| `status` | `locked`, `active`, `completed` |
| `progress_pct` | 진행률 |
| `required_missions_done` | 필수 미션 완료 수 |
| `optional_missions_done` | 선택 미션 완료 수 |
| `started_at` | 시작 시간 |
| `completed_at` | 완료 시간 |
| `updated_at` | 수정일 |

---

## 3.4 지갑/원장

### `user_wallets`

사용자의 현재 포인트 잔액 캐시.

| 컬럼 | 설명 |
|---|---|
| `user_id` | 사용자 |
| `point` | 쿠폰 교환용 포인트 |
| `lifetime_point_earned` | 누적 획득 포인트 |
| `lifetime_point_spent` | 누적 사용 포인트 |
| `updated_at` | 수정일 |

### `point_ledger`

포인트의 모든 증감 기록.

| 컬럼 | 설명 |
|---|---|
| `id` | 원장 ID |
| `user_id` | 사용자 |
| `amount` | 증감량. 차감은 음수 |
| `balance_after` | 변경 후 포인트 |
| `source_type` | `attendance`, `mission`, `chapter`, `admin_bonus`, `reward_redeem`, `adjustment` |
| `source_id` | 원인이 된 기록 ID |
| `economy_snapshot_id` | 적용된 경제 스냅샷 |
| `idempotency_key` | 중복 지급 방지 키 |
| `created_at` | 생성일 |

### `exp_ledger`

경험치의 모든 증감 기록.

| 컬럼 | 설명 |
|---|---|
| `id` | 원장 ID |
| `user_id` | 사용자 |
| `amount` | 경험치 증감량 |
| `balance_after` | 변경 후 경험치 |
| `source_type` | `attendance`, `mission`, `chapter`, `admin_adjustment` |
| `source_id` | 원인이 된 기록 ID |
| `idempotency_key` | 중복 지급 방지 키 |
| `created_at` | 생성일 |

---

## 3.5 컬렉션/프로필 장착

### `badges`

배지 원본.

| 컬럼 | 설명 |
|---|---|
| `id` | 배지 ID |
| `title` | 배지명 |
| `description` | 설명 |
| `rarity` | 희귀도 |
| `condition_payload` | 획득 조건 JSON |
| `asset_key` | 이미지 키 |
| `active` | 사용 여부 |
| `sort_order` | 정렬 순서 |
| `created_at` | 생성일 |
| `updated_at` | 수정일 |

### `titles`

칭호 원본.

| 컬럼 | 설명 |
|---|---|
| `id` | 칭호 ID |
| `label` | 칭호 문구 |
| `description` | 설명 |
| `condition_payload` | 획득 조건 JSON |
| `active` | 사용 여부 |
| `sort_order` | 정렬 순서 |
| `created_at` | 생성일 |
| `updated_at` | 수정일 |

### `profile_frames`

프로필 프레임 원본.

| 컬럼 | 설명 |
|---|---|
| `id` | 프레임 ID |
| `title` | 프레임명 |
| `description` | 설명 |
| `rarity` | 희귀도 |
| `condition_payload` | 획득 조건 JSON |
| `asset_key` | 이미지 키 |
| `active` | 사용 여부 |
| `sort_order` | 정렬 순서 |
| `created_at` | 생성일 |
| `updated_at` | 수정일 |

### `user_badges`, `user_titles`, `user_profile_frames`

사용자가 획득한 배지, 칭호, 프레임.

| 컬럼 | 설명 |
|---|---|
| `id` | 획득 ID |
| `user_id` | 사용자 |
| `item_id` | 배지/칭호/프레임 ID |
| `source_type` | 획득 원인 |
| `source_id` | 원인이 된 기록 |
| `earned_at` | 획득 시간 |

### `profile_equipment`

사용자가 현재 대표로 장착한 자랑 요소.

| 컬럼 | 설명 |
|---|---|
| `user_id` | 사용자 |
| `title_id` | 대표 칭호 |
| `badge_id` | 대표 배지 |
| `frame_id` | 프로필 프레임 |
| `avatar_stage_id` | 캐릭터 진행 단계 |
| `updated_at` | 수정일 |

### `avatar_stages`, `avatar_progress`

캐릭터 진행도 시각화를 위한 단계.

| 컬럼 | 설명 |
|---|---|
| `id` | 단계 ID |
| `level` | 표시 순서 |
| `title` | 단계명 |
| `description` | 설명 |
| `required_exp` | 필요 경험치 |
| `required_chapter_id` | 필요 챕터 |
| `asset_key` | 캐릭터 이미지 키 |
| `active` | 사용 여부 |

---

## 3.6 보상/상점/인벤토리

### `rewards`

일반 보상과 이벤트 보상의 상품 원본.

| 컬럼 | 설명 |
|---|---|
| `id` | 보상 ID |
| `reward_kind` | `normal`, `event` |
| `title` | 보상명 |
| `description` | 설명 |
| `icon` | 임시 아이콘 |
| `asset_key` | 이미지 키 |
| `currency_type` | `point`, `free` |
| `cost_amount` | 가격 |
| `stock_total` | 총 재고 |
| `stock_remaining` | 남은 재고 |
| `external_product_code` | 외부 상품 코드 |
| `active` | 사용 여부 |
| `sort_order` | 정렬 순서 |
| `created_at` | 생성일 |
| `updated_at` | 수정일 |

### `reward_redemptions`

쿠폰 교환 이력.

| 컬럼 | 설명 |
|---|---|
| `id` | 교환 ID |
| `user_id` | 사용자 |
| `reward_id` | 보상 |
| `cost_point` | 사용 포인트 |
| `status` | `pending`, `issued`, `failed`, `cancelled`, `refunded` |
| `external_payload` | 외부 발급 결과 |
| `created_at` | 생성일 |
| `issued_at` | 발급 시간 |

### `inventory_items`

사용자가 가진 쿠폰함.

| 컬럼 | 설명 |
|---|---|
| `id` | 인벤토리 ID |
| `user_id` | 사용자 |
| `reward_id` | 보상 |
| `redemption_id` | 교환 이력 |
| `status` | `available`, `used`, `expired`, `cancelled` |
| `coupon_code` | 내부 테스트 코드 또는 외부 발급 코드 |
| `expires_at` | 만료일 |
| `created_at` | 생성일 |
| `used_at` | 사용일 |

---

## 3.7 경제 설정/스냅샷

### `economy_settings`

관리자가 직접 입력하는 경제 기준값. 초기에는 `id = current` 한 줄만 사용한다.

| 컬럼 | 설명 |
|---|---|
| `id` | `current` |
| `per_user_monthly_base_budget_krw` | 1인 월 기본 보상 한도 |
| `per_user_monthly_max_budget_krw` | 1인 월 최대 보상 한도 |
| `point_value_krw` | 포인트 1개 원가 |
| `event_multiplier` | 이벤트 배율 |
| `admin_bonus_limit` | 관리자 보너스 상한 |
| `auto_adjust_enabled` | 자동 보정 사용 여부 |
| `updated_by` | 수정 관리자 |
| `created_at` | 생성일 |
| `updated_at` | 수정일 |

### `economy_snapshots`

경제 계산 결과를 저장한다.

| 컬럼 | 설명 |
|---|---|
| `id` | 스냅샷 ID |
| `setting_id` | 기준 설정 ID |
| `active_employee_count` | 활성 직원 수 |
| `participation_rate_pct` | 참여율 |
| `avg_daily_point` | 1인 일일 평균 포인트 |
| `estimated_monthly_points` | 월 예상 포인트 지급량 |
| `monthly_base_budget_krw` | 월 기본 예산 |
| `point_value_krw` | 포인트 원가 |
| `economy_factor` | 경제보정계수 |
| `estimated_monthly_payout_krw` | 예상 월 지급액 |
| `budget_risk` | `stable`, `watch`, `danger` |
| `input_payload` | 계산 입력 |
| `output_payload` | 계산 결과 |
| `created_by` | 계산 실행자 |
| `created_at` | 생성일 |

### `events`

기간 한정 이벤트, 보너스, 배율.

### `app_config_snapshots`

프론트가 읽는 최종 화면 JSON.

| 컬럼 | 설명 |
|---|---|
| `id` | `current` |
| `payload` | `UQuestAppConfig` 형태의 화면 JSON |
| `version` | 스냅샷 버전 |
| `economy_snapshot_id` | 기준 경제 스냅샷 |
| `generated_from` | `admin`, `system`, `seed` |
| `created_at` | 생성일 |
| `updated_at` | 수정일 |

---

## 3.8 관리자/자산/연동

### `admin_audit_logs`

관리자가 바꾼 모든 설정 변경 이력.

### `asset_registry`

PNG/WebP 이미지와 아이콘 교체를 위한 자산 목록. 프론트 코드는 이미지 경로를 하드코딩하지 않고 `asset_key`를 기준으로 연결한다.

### `external_webhook_events`

기프티콘 API, 알림톡, 외부 시스템 콜백 로그.

---

## 3.9 시즌/랭킹/알림

### `seasons`

시즌제 운영용 테이블. MVP에서는 비활성으로 둘 수 있다.

### `leaderboard_snapshots`

랭킹은 실시간 집계보다 스냅샷 방식으로 보여준다. 직원 화면에는 계산 완료된 순위만 노출한다.

### `notification_jobs`

알림톡, 문자, 이메일, 푸시 발송 대기열.

---

# 4. RLS 보안 정책

Supabase `public` 스키마 테이블은 브라우저 API로 노출될 수 있으므로 모든 테이블에 RLS를 켠다.

| 대상 | 정책 |
|---|---|
| 직원 | 본인 프로필, 포인트, 경험치, 챕터 진행, 컬렉션, 쿠폰함만 조회 |
| 점장/팀장 | 자신의 권한 범위에 있는 직원 데이터 조회 |
| 슈퍼관리자 | 전체 설정/운영 데이터 관리 |
| 설정 테이블 | 조회는 필요한 범위만, 수정은 슈퍼관리자 또는 서버 함수 |
| 정답/외부연동/감사로그 | 일반 사용자 직접 접근 금지 |

---

# 5. 서버 함수로 처리할 작업

| 함수 | 역할 |
|---|---|
| `claim_attendance` | 출석 체크 및 포인트/경험치 지급 |
| `complete_mission` | 미션 완료 요청/자동 승인 |
| `approve_mission_completion` | 관리자 미션 승인 |
| `apply_mission_rewards` | 포인트/경험치 원장 기록 및 챕터 진행 갱신 |
| `evaluate_collection_unlocks` | 배지/칭호/프레임 획득 조건 평가 |
| `equip_profile_item` | 대표 배지/칭호/프레임 장착 |
| `redeem_reward` | 쿠폰 교환, 포인트 차감, 재고 차감, 쿠폰함 발급 |
| `recalculate_economy_snapshot` | 경제 설정 기반 계산 |
| `publish_app_config_snapshot` | 프론트 화면용 JSON 갱신 |

---

# 6. MVP 필수 테이블

1차 DB 재정비에는 아래 테이블을 우선 반영한다.

```text
organizations
stores
teams
profiles
role_assignments
mission_groups
missions
mission_completions
attendance_logs
chapters
chapter_progress
user_wallets
point_ledger
exp_ledger
badges
titles
profile_frames
user_badges
user_titles
user_profile_frames
profile_equipment
avatar_stages
rewards
reward_redemptions
inventory_items
economy_settings
economy_snapshots
app_config_snapshots
admin_audit_logs
asset_registry
```

---

# 7. 폐기 또는 보류 테이블

아래 테이블/개념은 이전 기획 기준이며 최신 MVP에서는 사용하지 않는다.

| 이전 항목 | 처리 |
|---|---|
| `tree_hit_logs` | 폐기 또는 보류 |
| `sword_levels` | 폐기 또는 캐릭터 단계로 재해석 |
| `user_sword_states` | 폐기 |
| `sword_upgrade_logs` | 폐기 |
| `remaining_ticket` | 포인트/미션 보상 구조로 대체 |
| `hidden_coin` | MVP 보류 |
| `scroll` | MVP 보류 |
| `coin_multiplier` | 사용 금지 |

---

# 8. 변경 이력

## 2026-06-11

- DB 문서 기준을 타격권/나무/검 구조에서 챕터/포인트/경험치/컬렉션 구조로 전환했다.
- `chapters`, `chapter_progress`, `badges`, `titles`, `profile_frames`, `avatar_stages` 계열을 핵심 테이블로 추가했다.
- 이전 타격/검 관련 테이블은 폐기 또는 보류 항목으로 이동했다.
