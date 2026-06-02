# DATABASE_SCHEMA.md

## 상태

- 기준일: 2026-05-29
- 기준 문서: `DB_DESIGN_DRAFT.md`
- SQL 파일: `supabase/schema.sql`
- 현재 단계: Supabase v2 schema migration 실행 완료

---

# 1. 핵심 원칙

U-Quest DB는 단순히 현재 잔액만 저장하지 않는다.  
리워드 서비스에서는 "현재 얼마가 있느냐"보다 "왜 늘고 줄었느냐"가 더 중요하다.

따라서 DB는 아래 구조를 기준으로 한다.

| 구분 | 역할 |
|---|---|
| 설정 테이블 | 관리자가 바꾸는 기준값 |
| 상태 테이블 | 사용자의 현재 상태 |
| 원장/로그 테이블 | 모든 보상, 차감, 승인, 교환 이력 |
| 스냅샷 테이블 | 프론트가 빠르게 읽는 최종 화면 데이터 |

---

# 2. 전체 흐름

```text
관리자 설정
→ 미션/보상/검/경제 기준 저장
→ 경제 스냅샷 계산
→ app_config_snapshots.payload 갱신
→ 사용자 화면 반영
```

사용자 행동은 아래처럼 기록한다.

```text
출석/미션 완료
→ 타격권/SXP 지급 원장 기록
→ 나무 타격
→ 코인/SXP/히든 결과 로그 기록
→ 상점 교환 또는 검 성장
→ 차감/지급 원장 기록
```

---

# 3. 테이블 그룹

## 3.1 회사/사용자/권한

### `organizations`

회사 단위. 현재는 1개 회사만 사용해도 되지만, 나중에 여러 회사나 브랜드로 확장할 수 있게 둔다.

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
| `person_level` | 사람 레벨 |
| `sxp_total` | 현재 SXP |
| `active` | 사용 여부 |
| `approved_by` | 승인 관리자 |
| `approved_at` | 승인 시간 |
| `created_at` | 생성일 |
| `updated_at` | 수정일 |

### `role_assignments`

직원, 점장, 팀장, 슈퍼관리자 권한을 저장한다.  
한 사람이 여러 매장을 관리할 수 있으므로 `profiles.role` 하나로 처리하지 않는다.

| 컬럼 | 설명 |
|---|---|
| `id` | 권한 ID |
| `user_id` | 사용자 ID |
| `role` | `employee`, `store_manager`, `team_lead`, `super_admin` |
| `scope_type` | `global`, `organization`, `store`, `team` |
| `organization_id` | 권한 범위 회사 |
| `store_id` | 권한 범위 매장 |
| `team_id` | 권한 범위 팀 |
| `active` | 사용 여부 |
| `assigned_by` | 권한 부여자 |
| `created_at` | 생성일 |
| `updated_at` | 수정일 |

---

## 3.2 미션/출석/퀴즈

### `mission_groups`

홈 화면의 미션 묶음.

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
| `title` | 미션명 |
| `icon` | 임시 아이콘 |
| `asset_key` | 이미지 교체용 키 |
| `mission_type` | `attendance`, `routine`, `quiz`, `axdx`, `event`, `manual` |
| `validation_method` | `auto`, `quiz`, `manager_approval`, `external`, `manual` |
| `source_label` | 화면에 보이는 출처 라벨 |
| `base_ticket` | 기본 타격권 |
| `base_sxp` | 기본 SXP |
| `base_scroll` | 기본 주문서 |
| `importance_factor` | 중요도 계수 |
| `daily_limit` | 일일 제한 |
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
| `status` | `pending`, `approved`, `rejected`, `auto_approved`, `cancelled` |
| `progress` | 완료율 |
| `period_date` | 일일 제한 기준 날짜 |
| `evidence_payload` | 증빙/퀴즈 답변/외부 결과 |
| `reward_ticket` | 확정 지급 타격권 |
| `reward_sxp` | 확정 지급 SXP |
| `reward_scroll` | 확정 지급 주문서 |
| `requested_at` | 요청 시간 |
| `approved_by` | 승인자 |
| `approved_at` | 승인 시간 |
| `rejected_reason` | 반려 사유 |
| `idempotency_key` | 중복 지급 방지 키 |

### `attendance_logs`

출석 전용 로그.  
`user_id + attendance_date`는 중복될 수 없다.

| 컬럼 | 설명 |
|---|---|
| `id` | 출석 ID |
| `user_id` | 사용자 |
| `attendance_date` | 출석일 |
| `streak_day` | 연속 출석일 |
| `reward_ticket` | 출석 보상 타격권 |
| `reward_sxp` | 출석 보상 SXP |
| `created_at` | 생성일 |

### `quiz_questions`, `quiz_options`, `quiz_attempts`

퀴즈를 문제은행으로 운영할 때 쓰는 확장 테이블.  
처음에는 `missions.metadata`로 간단히 시작할 수 있다.

중요: `quiz_options.is_correct`는 정답 정보이므로 일반 사용자에게 직접 노출하지 않는다.  
사용자 퀴즈 화면은 나중에 별도 서버 함수나 정답 제외 view로 제공한다.

---

## 3.3 지갑/원장

### `user_wallets`

사용자의 현재 잔액 캐시.

| 컬럼 | 설명 |
|---|---|
| `user_id` | 사용자 |
| `coin` | 일반 코인 |
| `hidden_coin` | 히든 코인 |
| `scroll` | 주문서 |
| `remaining_ticket` | 남은 타격권 |
| `lifetime_ticket_earned` | 누적 획득 타격권 |
| `lifetime_hits` | 누적 타격 수 |
| `updated_at` | 수정일 |

### `wallet_ledger`

타격권, 코인, 히든코인, 주문서의 모든 증감 기록.

| 컬럼 | 설명 |
|---|---|
| `id` | 원장 ID |
| `user_id` | 사용자 |
| `currency_type` | `ticket`, `coin`, `hidden_coin`, `scroll` |
| `amount` | 증감량. 차감은 음수 |
| `balance_after` | 변경 후 잔액 |
| `source_type` | 지급/차감 원인 |
| `source_id` | 원인이 된 기록 ID |
| `economy_snapshot_id` | 적용된 경제 스냅샷 |
| `idempotency_key` | 중복 지급 방지 키 |
| `created_at` | 생성일 |

### `sxp_ledger`

SXP 성장 경험치 원장.

| 컬럼 | 설명 |
|---|---|
| `id` | 원장 ID |
| `user_id` | 사용자 |
| `amount` | SXP 증감량 |
| `balance_after` | 변경 후 SXP |
| `source_type` | 지급 원인 |
| `source_id` | 원인이 된 기록 ID |
| `idempotency_key` | 중복 지급 방지 키 |
| `created_at` | 생성일 |

---

## 3.4 나무 타격

### `tree_hit_logs`

나무를 1번 칠 때마다 생기는 결과 로그.

| 컬럼 | 설명 |
|---|---|
| `id` | 타격 ID |
| `user_id` | 사용자 |
| `sword_level` | 타격 당시 검 레벨 |
| `ticket_spent` | 사용 타격권 |
| `base_coin` | 기본 코인 |
| `final_coin` | 최종 지급 코인 |
| `sxp_awarded` | 지급 SXP |
| `scroll_awarded` | 지급 주문서 |
| `hidden_roll_pct` | 적용 히든 확률 |
| `hidden_won` | 히든 당첨 여부 |
| `hidden_reward_id` | 당첨 히든 보상 |
| `economy_snapshot_id` | 적용 경제 스냅샷 |
| `result_payload` | 연출용 결과 JSON |
| `created_at` | 생성일 |

---

## 3.5 검/성장/수집

### `sword_levels`

검 레벨 원본. 관리자에서 수정 가능해야 한다.

| 컬럼 | 설명 |
|---|---|
| `level` | 검 레벨 |
| `label` | 화면 표시 라벨 |
| `name` | 검 이름 |
| `required_person_level` | 필요 사람 레벨 |
| `required_sxp` | 필요 SXP |
| `required_coin` | 강화 비용 코인 |
| `required_scroll` | 강화 비용 주문서 |
| `coin_multiplier` | 코인 배율 |
| `coin_cap` | 1타 최대 코인 |
| `hidden_chance_bonus_pct` | 히든 확률 보너스 |
| `extra_coin_hit` | 추가 코인 효과 |
| `asset_key` | 검 이미지 키 |
| `active` | 사용 여부 |
| `created_at` | 생성일 |
| `updated_at` | 수정일 |

### `user_sword_states`

사용자의 현재 검 상태.

| 컬럼 | 설명 |
|---|---|
| `user_id` | 사용자 |
| `sword_level` | 현재 검 레벨 |
| `upgraded_at` | 마지막 강화일 |
| `updated_at` | 수정일 |

### `sword_upgrade_logs`

검 강화 시도/성공 로그.

| 컬럼 | 설명 |
|---|---|
| `id` | 로그 ID |
| `user_id` | 사용자 |
| `from_level` | 이전 레벨 |
| `to_level` | 다음 레벨 |
| `required_coin` | 사용 코인 |
| `required_scroll` | 사용 주문서 |
| `result` | `success`, `failed`, `cancelled` |
| `created_at` | 생성일 |

### `collectibles`, `user_collectibles`, `profile_equipment`

칭호, 배지, 프로필 프레임, 아바타, 의상, 검 스킨 같은 성장/수집 요소를 관리한다.

---

## 3.6 보상/상점/인벤토리

### `rewards`

일반 보상과 히든 보상의 상품 원본.

| 컬럼 | 설명 |
|---|---|
| `id` | 보상 ID |
| `reward_kind` | `normal`, `hidden`, `event` |
| `title` | 보상명 |
| `description` | 설명 |
| `icon` | 임시 아이콘 |
| `asset_key` | 이미지 키 |
| `currency_type` | `coin`, `hidden_coin`, `free` |
| `cost_amount` | 가격 |
| `stock_total` | 총 재고 |
| `stock_remaining` | 남은 재고 |
| `external_product_code` | 외부 상품 코드 |
| `provider` | 기프티콘 등 외부 업체 |
| `active` | 사용 여부 |
| `featured` | 강조 여부 |
| `sort_order` | 정렬 순서 |
| `starts_at` | 시작 시간 |
| `ends_at` | 종료 시간 |
| `metadata` | 추가 설정 |
| `created_at` | 생성일 |
| `updated_at` | 수정일 |

### `hidden_reward_pool_items`

히든 박스 후보와 가중치.

| 컬럼 | 설명 |
|---|---|
| `id` | 히든 풀 ID |
| `reward_id` | 보상 ID |
| `rarity` | 희귀도 |
| `probability_weight` | 확률 가중치 |
| `min_sword_level` | 최소 검 레벨 |
| `stock_limit` | 풀 내 제한 재고 |
| `active` | 사용 여부 |
| `sort_order` | 정렬 순서 |
| `created_at` | 생성일 |
| `updated_at` | 수정일 |

### `reward_redemptions`

상점 교환, 히든 당첨, 관리자 지급, 이벤트 지급 기록.

| 컬럼 | 설명 |
|---|---|
| `id` | 교환 ID |
| `user_id` | 사용자 |
| `reward_id` | 보상 |
| `redemption_type` | `shop`, `hidden_box`, `admin_grant`, `event` |
| `cost_currency_type` | 차감 재화 |
| `cost_amount` | 차감 금액 |
| `status` | 요청/지급/실패/취소/환불 상태 |
| `external_order_id` | 외부 발송 주문 ID |
| `delivery_payload` | 외부 발송 결과 |
| `requested_at` | 요청일 |
| `fulfilled_at` | 지급 완료일 |
| `cancelled_at` | 취소일 |

### `inventory_items`

사용자가 가진 보상함/쿠폰함.

| 컬럼 | 설명 |
|---|---|
| `id` | 인벤토리 ID |
| `user_id` | 사용자 |
| `reward_id` | 보상 |
| `redemption_id` | 교환 기록 |
| `item_type` | `coupon`, `badge`, `ticket`, `hidden_reward`, `gifticon` |
| `title` | 표시명 |
| `icon` | 임시 아이콘 |
| `asset_key` | 이미지 키 |
| `status` | `available`, `used`, `expired`, `cancelled` |
| `issued_at` | 발급일 |
| `used_at` | 사용일 |
| `expires_at` | 만료일 |

---

## 3.7 경제 설정/스냅샷

### `economy_settings`

관리자가 직접 입력하는 경제 기준값.  
초기에는 `id = current` 한 줄만 사용한다.

| 컬럼 | 설명 |
|---|---|
| `id` | `current` |
| `per_user_monthly_base_budget_krw` | 1인 월 기본 보상 한도 |
| `per_user_monthly_max_budget_krw` | 1인 특별 포함 최대 한도 |
| `coin_value_krw` | 코인 1개 원가 |
| `daily_ticket_limit` | 일일 최대 타격권 |
| `event_multiplier` | 이벤트 배율 |
| `hidden_reward_avg_value_krw` | 히든 1회 평균 가치 |
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
| `avg_daily_ticket` | 평균 일일 타격권 |
| `estimated_monthly_hits` | 월 예상 타격 수 |
| `monthly_base_budget_krw` | 월 기본 예산 |
| `monthly_hidden_budget_krw` | 월 히든 예산 |
| `one_hit_average_coin` | 1타 평균 코인 |
| `economy_factor` | 경제보정계수 |
| `hidden_base_probability_pct` | 기본 히든 확률 |
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

PNG/WebP 이미지와 아이콘 교체를 위한 자산 목록.  
프론트 코드는 이미지 경로를 하드코딩하지 않고 `asset_key`를 기준으로 연결한다.

### `external_webhook_events`

기프티콘 API, 알림톡, 외부 시스템 콜백 로그.

---

## 3.9 시즌/랭킹/알림

### `seasons`

시즌제 운영용 테이블. MVP에서는 비활성으로 둘 수 있다.

### `leaderboard_snapshots`

랭킹은 실시간 집계보다 스냅샷 방식으로 보여준다.  
직원 화면에는 계산 완료된 순위만 노출한다.

### `notification_jobs`

알림톡, 문자, 이메일, 푸시 발송 대기열.

---

# 4. RLS 보안 정책

Supabase의 `public` 스키마 테이블은 브라우저 API로 노출될 수 있으므로 모든 테이블에 RLS를 켠다.

기본 정책:

| 대상 | 정책 |
|---|---|
| 직원 | 본인 프로필, 지갑, 로그, 인벤토리만 조회 |
| 점장/팀장 | 자신의 권한 범위에 있는 직원 데이터 조회 |
| 슈퍼관리자 | 전체 설정/운영 데이터 관리 |
| 설정 테이블 | 조회는 필요한 범위만, 수정은 슈퍼관리자 또는 서버 함수 |
| 정답/외부연동/감사로그 | 일반 사용자 직접 접근 금지 |

참고 문서:
https://supabase.com/docs/guides/database/postgres/row-level-security

---

# 5. 서버 함수로 처리할 작업

프론트에서 직접 잔액이나 보상 결과를 바꾸면 안 된다.  
아래 작업은 서버 함수 또는 Edge Function으로 처리한다.

| 함수 | 역할 |
|---|---|
| `claim_attendance` | 출석 체크 및 보상 지급 |
| `complete_mission` | 미션 완료 요청/자동 승인 |
| `approve_mission_completion` | 관리자 미션 승인 |
| `hit_tree` | 타격권 차감 및 코인/SXP/히든 결과 지급 |
| `upgrade_sword` | 검 강화 비용 차감 및 레벨 갱신 |
| `redeem_reward` | 상점 교환, 재고 차감, 보상함 발급 |
| `recalculate_economy_snapshot` | 경제 설정 기반 계산 |
| `publish_app_config_snapshot` | 프론트 화면용 JSON 갱신 |

---

# 6. MVP 필수 테이블

1차 DB에는 아래 테이블을 우선 생성한다.

```text
organizations
stores
teams
profiles
role_assignments
user_wallets
wallet_ledger
sxp_ledger
mission_groups
missions
mission_completions
attendance_logs
tree_hit_logs
sword_levels
user_sword_states
sword_upgrade_logs
collectibles
user_collectibles
profile_equipment
rewards
hidden_reward_pool_items
reward_redemptions
inventory_items
economy_settings
economy_snapshots
events
app_config_snapshots
asset_registry
admin_audit_logs
```

확장 대비 테이블:

```text
quiz_questions
quiz_options
quiz_attempts
seasons
leaderboard_snapshots
notification_jobs
external_webhook_events
```

---

# 7. 변경 이력

## 2026-05-29

- 깨진 기존 DB 문서를 v2 설계 기준으로 재작성했다.
- `users` 단일 테이블 구조를 `profiles`, `user_wallets`, `wallet_ledger`, `sxp_ledger` 구조로 분리했다.
- 미션 승인, 나무 타격, 검 강화, 보상 교환, 경제 스냅샷, 앱 설정 스냅샷 구조를 공식화했다.
- RLS 보안 기준과 서버 함수 처리 원칙을 추가했다.
- Supabase MCP로 `uquest_v2_initial_schema` migration을 실행했다.
- public 테이블 36개와 RLS 활성화 36개를 확인했다.
