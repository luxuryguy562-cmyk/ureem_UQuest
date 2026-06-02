-- U-Quest Supabase schema v2.
-- Designed for a new/empty Supabase project.
-- Run as a migration after reviewing DATABASE_SCHEMA.md and DB_DESIGN_DRAFT.md.

create extension if not exists pgcrypto;

create schema if not exists private;

do $$
begin
  create type public.app_role as enum ('employee', 'store_manager', 'team_lead', 'super_admin');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.role_scope_type as enum ('global', 'organization', 'store', 'team');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.mission_type as enum ('attendance', 'routine', 'quiz', 'axdx', 'event', 'manual');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.mission_validation_method as enum ('auto', 'quiz', 'manager_approval', 'external', 'manual');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.mission_completion_status as enum ('pending', 'approved', 'rejected', 'auto_approved', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.wallet_currency_type as enum ('ticket', 'coin', 'hidden_coin', 'scroll');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.ledger_source_type as enum ('mission', 'attendance', 'tree_hit', 'sword_upgrade', 'reward_redeem', 'admin_adjust', 'event', 'hidden_reward', 'seed');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.upgrade_result as enum ('success', 'failed', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.collectible_type as enum ('title', 'badge', 'frame', 'avatar', 'outfit', 'sword_skin');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.reward_kind as enum ('normal', 'hidden', 'event');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.reward_currency_type as enum ('coin', 'hidden_coin', 'free');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.redemption_type as enum ('shop', 'hidden_box', 'admin_grant', 'event');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.redemption_status as enum ('requested', 'paid', 'fulfilled', 'failed', 'cancelled', 'refunded');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.inventory_item_type as enum ('coupon', 'badge', 'ticket', 'hidden_reward', 'gifticon');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.inventory_status as enum ('available', 'used', 'expired', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.budget_risk_level as enum ('stable', 'watch', 'danger');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.app_config_source as enum ('admin', 'system', 'seed');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.quiz_question_type as enum ('single_choice', 'multiple_choice', 'short_answer');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.leaderboard_scope_type as enum ('global', 'organization', 'store', 'team');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.leaderboard_metric as enum ('sxp', 'mission_count', 'hit_count', 'attendance_streak');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.notification_channel as enum ('kakao', 'sms', 'email', 'push');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.notification_status as enum ('pending', 'sent', 'failed', 'cancelled');
exception when duplicate_object then null;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  code text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stores_sort_order_nonnegative check (sort_order >= 0)
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint teams_sort_order_nonnegative check (sort_order >= 0)
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  store_id uuid references public.stores(id) on delete set null,
  team_id uuid references public.teams(id) on delete set null,
  display_name text not null,
  employee_no text,
  phone text,
  onboarding_day integer not null default 0,
  person_level integer not null default 1,
  sxp_total integer not null default 0,
  active boolean not null default true,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_onboarding_day_nonnegative check (onboarding_day >= 0),
  constraint profiles_person_level_positive check (person_level >= 1),
  constraint profiles_sxp_total_nonnegative check (sxp_total >= 0)
);

create table if not exists public.role_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null default 'employee',
  scope_type public.role_scope_type not null default 'global',
  organization_id uuid references public.organizations(id) on delete cascade,
  store_id uuid references public.stores(id) on delete cascade,
  team_id uuid references public.teams(id) on delete cascade,
  active boolean not null default true,
  assigned_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint role_assignments_scope_target_check check (
    (scope_type = 'global' and organization_id is null and store_id is null and team_id is null)
    or (scope_type = 'organization' and organization_id is not null and store_id is null and team_id is null)
    or (scope_type = 'store' and organization_id is null and store_id is not null and team_id is null)
    or (scope_type = 'team' and organization_id is null and store_id is null and team_id is not null)
  )
);

create table if not exists public.economy_settings (
  id text primary key default 'current',
  per_user_monthly_base_budget_krw integer not null,
  per_user_monthly_max_budget_krw integer not null,
  coin_value_krw numeric(12, 4) not null,
  daily_ticket_limit integer not null,
  event_multiplier numeric(8, 4) not null default 1,
  hidden_reward_avg_value_krw integer not null default 0,
  auto_adjust_enabled boolean not null default true,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint economy_settings_singleton check (id = 'current'),
  constraint economy_settings_budget_nonnegative check (
    per_user_monthly_base_budget_krw >= 0
    and per_user_monthly_max_budget_krw >= per_user_monthly_base_budget_krw
  ),
  constraint economy_settings_coin_value_positive check (coin_value_krw > 0),
  constraint economy_settings_daily_ticket_limit_nonnegative check (daily_ticket_limit >= 0),
  constraint economy_settings_event_multiplier_nonnegative check (event_multiplier >= 0),
  constraint economy_settings_hidden_avg_nonnegative check (hidden_reward_avg_value_krw >= 0)
);

create table if not exists public.economy_snapshots (
  id uuid primary key default gen_random_uuid(),
  setting_id text references public.economy_settings(id) on delete set null,
  active_employee_count integer not null,
  participation_rate_pct numeric(8, 4) not null,
  avg_daily_ticket numeric(12, 4) not null,
  estimated_monthly_hits integer not null,
  monthly_base_budget_krw integer not null,
  monthly_hidden_budget_krw integer not null,
  one_hit_average_coin numeric(12, 4) not null,
  economy_factor numeric(8, 4) not null,
  hidden_base_probability_pct numeric(8, 4) not null,
  estimated_monthly_payout_krw integer not null,
  budget_risk public.budget_risk_level not null default 'stable',
  input_payload jsonb not null default '{}'::jsonb,
  output_payload jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint economy_snapshots_count_nonnegative check (active_employee_count >= 0),
  constraint economy_snapshots_participation_range check (participation_rate_pct >= 0 and participation_rate_pct <= 100),
  constraint economy_snapshots_avg_ticket_nonnegative check (avg_daily_ticket >= 0),
  constraint economy_snapshots_hits_nonnegative check (estimated_monthly_hits >= 0),
  constraint economy_snapshots_budget_nonnegative check (monthly_base_budget_krw >= 0 and monthly_hidden_budget_krw >= 0),
  constraint economy_snapshots_coin_nonnegative check (one_hit_average_coin >= 0),
  constraint economy_snapshots_factor_nonnegative check (economy_factor >= 0),
  constraint economy_snapshots_hidden_range check (hidden_base_probability_pct >= 0 and hidden_base_probability_pct <= 100),
  constraint economy_snapshots_payout_nonnegative check (estimated_monthly_payout_krw >= 0)
);

create table if not exists public.mission_groups (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  icon text,
  asset_key text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mission_groups_sort_order_nonnegative check (sort_order >= 0)
);

create table if not exists public.missions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.mission_groups(id) on delete cascade,
  title text not null,
  icon text,
  asset_key text,
  mission_type public.mission_type not null default 'routine',
  validation_method public.mission_validation_method not null default 'manual',
  source_label text,
  base_ticket integer not null default 0,
  base_sxp integer not null default 0,
  base_scroll integer not null default 0,
  importance_factor numeric(8, 4) not null default 1,
  daily_limit integer not null default 1,
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean not null default true,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint missions_base_ticket_nonnegative check (base_ticket >= 0),
  constraint missions_base_sxp_nonnegative check (base_sxp >= 0),
  constraint missions_base_scroll_nonnegative check (base_scroll >= 0),
  constraint missions_importance_factor_nonnegative check (importance_factor >= 0),
  constraint missions_daily_limit_positive check (daily_limit >= 1),
  constraint missions_sort_order_nonnegative check (sort_order >= 0),
  constraint missions_valid_period check (starts_at is null or ends_at is null or starts_at <= ends_at)
);

create table if not exists public.mission_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  mission_id uuid not null references public.missions(id) on delete restrict,
  status public.mission_completion_status not null default 'pending',
  progress numeric(8, 4) not null default 1,
  period_date date not null default current_date,
  evidence_payload jsonb not null default '{}'::jsonb,
  reward_ticket integer not null default 0,
  reward_sxp integer not null default 0,
  reward_scroll integer not null default 0,
  requested_at timestamptz not null default now(),
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  rejected_reason text,
  idempotency_key text,
  constraint mission_completions_progress_range check (progress >= 0 and progress <= 1),
  constraint mission_completions_rewards_nonnegative check (reward_ticket >= 0 and reward_sxp >= 0 and reward_scroll >= 0)
);

create table if not exists public.attendance_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  attendance_date date not null,
  streak_day integer not null default 1,
  reward_ticket integer not null default 0,
  reward_sxp integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, attendance_date),
  constraint attendance_logs_streak_positive check (streak_day >= 1),
  constraint attendance_logs_rewards_nonnegative check (reward_ticket >= 0 and reward_sxp >= 0)
);

create table if not exists public.user_wallets (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  coin integer not null default 0,
  hidden_coin integer not null default 0,
  scroll integer not null default 0,
  remaining_ticket integer not null default 0,
  lifetime_ticket_earned integer not null default 0,
  lifetime_hits integer not null default 0,
  updated_at timestamptz not null default now(),
  constraint user_wallets_nonnegative check (
    coin >= 0
    and hidden_coin >= 0
    and scroll >= 0
    and remaining_ticket >= 0
    and lifetime_ticket_earned >= 0
    and lifetime_hits >= 0
  )
);

create table if not exists public.wallet_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  currency_type public.wallet_currency_type not null,
  amount integer not null,
  balance_after integer not null,
  source_type public.ledger_source_type not null,
  source_id uuid,
  economy_snapshot_id uuid references public.economy_snapshots(id) on delete set null,
  idempotency_key text,
  created_at timestamptz not null default now(),
  constraint wallet_ledger_amount_nonzero check (amount <> 0),
  constraint wallet_ledger_balance_after_nonnegative check (balance_after >= 0)
);

create table if not exists public.sxp_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null,
  balance_after integer not null,
  source_type public.ledger_source_type not null,
  source_id uuid,
  idempotency_key text,
  created_at timestamptz not null default now(),
  constraint sxp_ledger_amount_nonzero check (amount <> 0),
  constraint sxp_ledger_balance_after_nonnegative check (balance_after >= 0)
);

create table if not exists public.sword_levels (
  level integer primary key,
  label text not null,
  name text not null,
  required_person_level integer not null default 1,
  required_sxp integer not null default 0,
  required_coin integer not null default 0,
  required_scroll integer not null default 0,
  coin_multiplier numeric(8, 4) not null default 1,
  coin_cap integer not null,
  hidden_chance_bonus_pct numeric(8, 4) not null default 0,
  extra_coin_hit integer not null default 0,
  asset_key text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sword_levels_level_positive check (level >= 1),
  constraint sword_levels_required_nonnegative check (
    required_person_level >= 1
    and required_sxp >= 0
    and required_coin >= 0
    and required_scroll >= 0
  ),
  constraint sword_levels_multiplier_positive check (coin_multiplier > 0),
  constraint sword_levels_coin_cap_nonnegative check (coin_cap >= 0),
  constraint sword_levels_hidden_bonus_range check (hidden_chance_bonus_pct >= 0 and hidden_chance_bonus_pct <= 100),
  constraint sword_levels_extra_coin_hit_nonnegative check (extra_coin_hit >= 0)
);

create table if not exists public.user_sword_states (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  sword_level integer not null references public.sword_levels(level) on delete restrict,
  upgraded_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sword_upgrade_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  from_level integer not null references public.sword_levels(level) on delete restrict,
  to_level integer not null references public.sword_levels(level) on delete restrict,
  required_coin integer not null default 0,
  required_scroll integer not null default 0,
  result public.upgrade_result not null default 'success',
  created_at timestamptz not null default now(),
  constraint sword_upgrade_logs_cost_nonnegative check (required_coin >= 0 and required_scroll >= 0),
  constraint sword_upgrade_logs_level_direction check (to_level >= from_level)
);

create table if not exists public.collectibles (
  id uuid primary key default gen_random_uuid(),
  collectible_type public.collectible_type not null,
  name text not null,
  description text,
  asset_key text,
  unlock_condition jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint collectibles_sort_order_nonnegative check (sort_order >= 0)
);

create table if not exists public.user_collectibles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  collectible_id uuid not null references public.collectibles(id) on delete cascade,
  earned_from_type public.ledger_source_type,
  earned_from_id uuid,
  earned_at timestamptz not null default now(),
  unique (user_id, collectible_id)
);

create table if not exists public.profile_equipment (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  title_id uuid references public.collectibles(id) on delete set null,
  badge_id uuid references public.collectibles(id) on delete set null,
  frame_id uuid references public.collectibles(id) on delete set null,
  avatar_id uuid references public.collectibles(id) on delete set null,
  outfit_id uuid references public.collectibles(id) on delete set null,
  sword_skin_id uuid references public.collectibles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.rewards (
  id uuid primary key default gen_random_uuid(),
  reward_kind public.reward_kind not null default 'normal',
  title text not null,
  description text,
  icon text,
  asset_key text,
  currency_type public.reward_currency_type not null default 'coin',
  cost_amount integer not null default 0,
  stock_total integer,
  stock_remaining integer,
  external_product_code text,
  provider text,
  active boolean not null default true,
  featured boolean not null default false,
  sort_order integer not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rewards_cost_nonnegative check (cost_amount >= 0),
  constraint rewards_stock_nonnegative check (
    (stock_total is null or stock_total >= 0)
    and (stock_remaining is null or stock_remaining >= 0)
  ),
  constraint rewards_stock_remaining_limit check (
    stock_total is null
    or stock_remaining is null
    or stock_remaining <= stock_total
  ),
  constraint rewards_sort_order_nonnegative check (sort_order >= 0),
  constraint rewards_valid_period check (starts_at is null or ends_at is null or starts_at <= ends_at)
);

create table if not exists public.hidden_reward_pool_items (
  id uuid primary key default gen_random_uuid(),
  reward_id uuid not null references public.rewards(id) on delete cascade,
  rarity text not null,
  probability_weight integer not null,
  min_sword_level integer not null default 1 references public.sword_levels(level) on delete restrict,
  stock_limit integer,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (reward_id),
  constraint hidden_pool_probability_weight_positive check (probability_weight > 0),
  constraint hidden_pool_stock_limit_nonnegative check (stock_limit is null or stock_limit >= 0),
  constraint hidden_pool_sort_order_nonnegative check (sort_order >= 0)
);

create table if not exists public.reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  reward_id uuid not null references public.rewards(id) on delete restrict,
  redemption_type public.redemption_type not null default 'shop',
  cost_currency_type public.reward_currency_type not null default 'coin',
  cost_amount integer not null default 0,
  status public.redemption_status not null default 'requested',
  external_order_id text,
  delivery_payload jsonb not null default '{}'::jsonb,
  requested_at timestamptz not null default now(),
  fulfilled_at timestamptz,
  cancelled_at timestamptz,
  constraint reward_redemptions_cost_nonnegative check (cost_amount >= 0)
);

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  reward_id uuid references public.rewards(id) on delete set null,
  redemption_id uuid references public.reward_redemptions(id) on delete set null,
  item_type public.inventory_item_type not null default 'coupon',
  title text not null,
  icon text,
  asset_key text,
  status public.inventory_status not null default 'available',
  issued_at timestamptz not null default now(),
  used_at timestamptz,
  expires_at timestamptz
);

create table if not exists public.tree_hit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  sword_level integer not null references public.sword_levels(level) on delete restrict,
  ticket_spent integer not null default 1,
  base_coin integer not null default 0,
  final_coin integer not null default 0,
  sxp_awarded integer not null default 0,
  scroll_awarded integer not null default 0,
  hidden_roll_pct numeric(8, 4) not null default 0,
  hidden_won boolean not null default false,
  hidden_reward_id uuid references public.rewards(id) on delete set null,
  economy_snapshot_id uuid references public.economy_snapshots(id) on delete set null,
  result_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint tree_hit_logs_ticket_positive check (ticket_spent >= 1),
  constraint tree_hit_logs_rewards_nonnegative check (
    base_coin >= 0
    and final_coin >= 0
    and sxp_awarded >= 0
    and scroll_awarded >= 0
  ),
  constraint tree_hit_logs_hidden_roll_range check (hidden_roll_pct >= 0 and hidden_roll_pct <= 100)
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_multiplier numeric(8, 4) not null default 1,
  bonus_ticket integer not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean not null default true,
  config_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_multiplier_nonnegative check (event_multiplier >= 0),
  constraint events_bonus_ticket_nonnegative check (bonus_ticket >= 0),
  constraint events_valid_period check (starts_at is null or ends_at is null or starts_at <= ends_at)
);

create table if not exists public.app_config_snapshots (
  id text primary key default 'current',
  payload jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  economy_snapshot_id uuid references public.economy_snapshots(id) on delete set null,
  generated_from public.app_config_source not null default 'admin',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_config_snapshots_singleton check (id = 'current'),
  constraint app_config_snapshots_version_positive check (version >= 1)
);

create table if not exists public.asset_registry (
  id uuid primary key default gen_random_uuid(),
  asset_key text not null unique,
  bucket text not null,
  path text not null,
  alt_text text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_table text not null,
  target_id text,
  before_value jsonb,
  after_value jsonb,
  request_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.missions(id) on delete cascade,
  question_text text not null,
  question_type public.quiz_question_type not null default 'single_choice',
  explanation text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quiz_questions_sort_order_nonnegative check (sort_order >= 0)
);

create table if not exists public.quiz_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.quiz_questions(id) on delete cascade,
  option_text text not null,
  is_correct boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quiz_options_sort_order_nonnegative check (sort_order >= 0)
);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  mission_completion_id uuid references public.mission_completions(id) on delete set null,
  score_pct numeric(8, 4) not null default 0,
  passed boolean not null default false,
  answer_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint quiz_attempts_score_range check (score_pct >= 0 and score_pct <= 100)
);

create table if not exists public.seasons (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  active boolean not null default true,
  reward_policy jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint seasons_valid_period check (starts_at <= ends_at)
);

create table if not exists public.leaderboard_snapshots (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references public.seasons(id) on delete cascade,
  scope_type public.leaderboard_scope_type not null default 'global',
  scope_id uuid,
  metric public.leaderboard_metric not null default 'sxp',
  payload jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.notification_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  channel public.notification_channel not null,
  template_key text not null,
  payload jsonb not null default '{}'::jsonb,
  status public.notification_status not null default 'pending',
  scheduled_at timestamptz not null default now(),
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.external_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_type text not null,
  external_id text,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists stores_organization_code_uniq
  on public.stores (organization_id, lower(code))
  where code is not null;

create unique index if not exists profiles_organization_employee_no_uniq
  on public.profiles (organization_id, lower(employee_no))
  where employee_no is not null;

create unique index if not exists mission_completions_idempotency_key_uniq
  on public.mission_completions (idempotency_key)
  where idempotency_key is not null;

create unique index if not exists wallet_ledger_idempotency_key_uniq
  on public.wallet_ledger (idempotency_key)
  where idempotency_key is not null;

create unique index if not exists sxp_ledger_idempotency_key_uniq
  on public.sxp_ledger (idempotency_key)
  where idempotency_key is not null;

create index if not exists profiles_organization_idx on public.profiles (organization_id);
create index if not exists profiles_store_idx on public.profiles (store_id);
create index if not exists profiles_team_idx on public.profiles (team_id);
create index if not exists role_assignments_user_role_active_idx on public.role_assignments (user_id, role, active);
create index if not exists role_assignments_scope_idx on public.role_assignments (scope_type, organization_id, store_id, team_id);
create index if not exists mission_groups_active_sort_idx on public.mission_groups (active, sort_order);
create index if not exists missions_group_active_sort_idx on public.missions (group_id, active, sort_order);
create index if not exists mission_completions_user_period_idx on public.mission_completions (user_id, period_date);
create index if not exists mission_completions_mission_period_idx on public.mission_completions (mission_id, period_date);
create index if not exists attendance_logs_user_date_idx on public.attendance_logs (user_id, attendance_date desc);
create index if not exists wallet_ledger_user_created_idx on public.wallet_ledger (user_id, created_at desc);
create index if not exists sxp_ledger_user_created_idx on public.sxp_ledger (user_id, created_at desc);
create index if not exists tree_hit_logs_user_created_idx on public.tree_hit_logs (user_id, created_at desc);
create index if not exists sword_upgrade_logs_user_created_idx on public.sword_upgrade_logs (user_id, created_at desc);
create index if not exists rewards_active_sort_idx on public.rewards (active, sort_order);
create index if not exists hidden_pool_active_sort_idx on public.hidden_reward_pool_items (active, sort_order);
create index if not exists reward_redemptions_user_requested_idx on public.reward_redemptions (user_id, requested_at desc);
create index if not exists inventory_items_user_status_idx on public.inventory_items (user_id, status);
create index if not exists economy_snapshots_created_idx on public.economy_snapshots (created_at desc);
create index if not exists events_active_period_idx on public.events (active, starts_at, ends_at);
create index if not exists quiz_questions_mission_sort_idx on public.quiz_questions (mission_id, active, sort_order);
create index if not exists quiz_options_question_sort_idx on public.quiz_options (question_id, sort_order);
create index if not exists quiz_attempts_user_created_idx on public.quiz_attempts (user_id, created_at desc);
create index if not exists leaderboard_snapshots_scope_metric_idx on public.leaderboard_snapshots (scope_type, scope_id, metric, created_at desc);
create index if not exists notification_jobs_user_status_idx on public.notification_jobs (user_id, status, scheduled_at);
create index if not exists external_webhook_events_provider_external_idx on public.external_webhook_events (provider, external_id);
create index if not exists admin_audit_logs_created_idx on public.admin_audit_logs (created_at desc);

drop trigger if exists set_organizations_updated_at on public.organizations;
create trigger set_organizations_updated_at before update on public.organizations
  for each row execute function public.set_updated_at();

drop trigger if exists set_stores_updated_at on public.stores;
create trigger set_stores_updated_at before update on public.stores
  for each row execute function public.set_updated_at();

drop trigger if exists set_teams_updated_at on public.teams;
create trigger set_teams_updated_at before update on public.teams
  for each row execute function public.set_updated_at();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_role_assignments_updated_at on public.role_assignments;
create trigger set_role_assignments_updated_at before update on public.role_assignments
  for each row execute function public.set_updated_at();

drop trigger if exists set_economy_settings_updated_at on public.economy_settings;
create trigger set_economy_settings_updated_at before update on public.economy_settings
  for each row execute function public.set_updated_at();

drop trigger if exists set_mission_groups_updated_at on public.mission_groups;
create trigger set_mission_groups_updated_at before update on public.mission_groups
  for each row execute function public.set_updated_at();

drop trigger if exists set_missions_updated_at on public.missions;
create trigger set_missions_updated_at before update on public.missions
  for each row execute function public.set_updated_at();

drop trigger if exists set_user_wallets_updated_at on public.user_wallets;
create trigger set_user_wallets_updated_at before update on public.user_wallets
  for each row execute function public.set_updated_at();

drop trigger if exists set_sword_levels_updated_at on public.sword_levels;
create trigger set_sword_levels_updated_at before update on public.sword_levels
  for each row execute function public.set_updated_at();

drop trigger if exists set_user_sword_states_updated_at on public.user_sword_states;
create trigger set_user_sword_states_updated_at before update on public.user_sword_states
  for each row execute function public.set_updated_at();

drop trigger if exists set_collectibles_updated_at on public.collectibles;
create trigger set_collectibles_updated_at before update on public.collectibles
  for each row execute function public.set_updated_at();

drop trigger if exists set_profile_equipment_updated_at on public.profile_equipment;
create trigger set_profile_equipment_updated_at before update on public.profile_equipment
  for each row execute function public.set_updated_at();

drop trigger if exists set_rewards_updated_at on public.rewards;
create trigger set_rewards_updated_at before update on public.rewards
  for each row execute function public.set_updated_at();

drop trigger if exists set_hidden_reward_pool_items_updated_at on public.hidden_reward_pool_items;
create trigger set_hidden_reward_pool_items_updated_at before update on public.hidden_reward_pool_items
  for each row execute function public.set_updated_at();

drop trigger if exists set_events_updated_at on public.events;
create trigger set_events_updated_at before update on public.events
  for each row execute function public.set_updated_at();

drop trigger if exists set_app_config_snapshots_updated_at on public.app_config_snapshots;
create trigger set_app_config_snapshots_updated_at before update on public.app_config_snapshots
  for each row execute function public.set_updated_at();

drop trigger if exists set_asset_registry_updated_at on public.asset_registry;
create trigger set_asset_registry_updated_at before update on public.asset_registry
  for each row execute function public.set_updated_at();

drop trigger if exists set_quiz_questions_updated_at on public.quiz_questions;
create trigger set_quiz_questions_updated_at before update on public.quiz_questions
  for each row execute function public.set_updated_at();

drop trigger if exists set_quiz_options_updated_at on public.quiz_options;
create trigger set_quiz_options_updated_at before update on public.quiz_options
  for each row execute function public.set_updated_at();

drop trigger if exists set_seasons_updated_at on public.seasons;
create trigger set_seasons_updated_at before update on public.seasons
  for each row execute function public.set_updated_at();

create or replace function private.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.role_assignments ra
      where ra.user_id = (select auth.uid())
        and ra.role = 'super_admin'::public.app_role
        and ra.active = true
    );
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.role_assignments ra
      where ra.user_id = (select auth.uid())
        and ra.role in ('store_manager'::public.app_role, 'team_lead'::public.app_role, 'super_admin'::public.app_role)
        and ra.active = true
    );
$$;

create or replace function private.can_manage_user(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and (
      private.is_super_admin()
      or exists (
        select 1
        from public.role_assignments ra
        join public.profiles p on p.id = target_user_id
        where ra.user_id = (select auth.uid())
          and ra.active = true
          and ra.role in ('store_manager'::public.app_role, 'team_lead'::public.app_role)
          and (
            (ra.scope_type = 'organization'::public.role_scope_type and ra.organization_id = p.organization_id)
            or (ra.scope_type = 'store'::public.role_scope_type and ra.store_id = p.store_id)
            or (ra.scope_type = 'team'::public.role_scope_type and ra.team_id = p.team_id)
          )
      )
    );
$$;

create or replace function private.can_access_user(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select target_user_id = (select auth.uid())
    or private.can_manage_user(target_user_id);
$$;

alter table public.organizations enable row level security;
alter table public.stores enable row level security;
alter table public.teams enable row level security;
alter table public.profiles enable row level security;
alter table public.role_assignments enable row level security;
alter table public.economy_settings enable row level security;
alter table public.economy_snapshots enable row level security;
alter table public.mission_groups enable row level security;
alter table public.missions enable row level security;
alter table public.mission_completions enable row level security;
alter table public.attendance_logs enable row level security;
alter table public.user_wallets enable row level security;
alter table public.wallet_ledger enable row level security;
alter table public.sxp_ledger enable row level security;
alter table public.sword_levels enable row level security;
alter table public.user_sword_states enable row level security;
alter table public.sword_upgrade_logs enable row level security;
alter table public.collectibles enable row level security;
alter table public.user_collectibles enable row level security;
alter table public.profile_equipment enable row level security;
alter table public.rewards enable row level security;
alter table public.hidden_reward_pool_items enable row level security;
alter table public.reward_redemptions enable row level security;
alter table public.inventory_items enable row level security;
alter table public.tree_hit_logs enable row level security;
alter table public.events enable row level security;
alter table public.app_config_snapshots enable row level security;
alter table public.asset_registry enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_options enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.seasons enable row level security;
alter table public.leaderboard_snapshots enable row level security;
alter table public.notification_jobs enable row level security;
alter table public.external_webhook_events enable row level security;

drop policy if exists "Read active organizations" on public.organizations;
create policy "Read active organizations"
  on public.organizations for select
  to authenticated
  using (active = true or private.is_super_admin());

drop policy if exists "Super admins manage organizations" on public.organizations;
create policy "Super admins manage organizations"
  on public.organizations for all
  to authenticated
  using (private.is_super_admin())
  with check (private.is_super_admin());

drop policy if exists "Read active stores" on public.stores;
create policy "Read active stores"
  on public.stores for select
  to authenticated
  using (active = true or private.is_super_admin());

drop policy if exists "Super admins manage stores" on public.stores;
create policy "Super admins manage stores"
  on public.stores for all
  to authenticated
  using (private.is_super_admin())
  with check (private.is_super_admin());

drop policy if exists "Read active teams" on public.teams;
create policy "Read active teams"
  on public.teams for select
  to authenticated
  using (active = true or private.is_super_admin());

drop policy if exists "Super admins manage teams" on public.teams;
create policy "Super admins manage teams"
  on public.teams for all
  to authenticated
  using (private.is_super_admin())
  with check (private.is_super_admin());

drop policy if exists "Users read scoped profiles" on public.profiles;
create policy "Users read scoped profiles"
  on public.profiles for select
  to authenticated
  using (private.can_access_user(id));

drop policy if exists "Super admins manage profiles" on public.profiles;
create policy "Super admins manage profiles"
  on public.profiles for all
  to authenticated
  using (private.is_super_admin())
  with check (private.is_super_admin());

drop policy if exists "Users read own role assignments" on public.role_assignments;
create policy "Users read own role assignments"
  on public.role_assignments for select
  to authenticated
  using (user_id = (select auth.uid()) or private.is_super_admin());

drop policy if exists "Super admins manage role assignments" on public.role_assignments;
create policy "Super admins manage role assignments"
  on public.role_assignments for all
  to authenticated
  using (private.is_super_admin())
  with check (private.is_super_admin());

drop policy if exists "Super admins read economy settings" on public.economy_settings;
create policy "Super admins read economy settings"
  on public.economy_settings for select
  to authenticated
  using (private.is_super_admin());

drop policy if exists "Super admins manage economy settings" on public.economy_settings;
create policy "Super admins manage economy settings"
  on public.economy_settings for all
  to authenticated
  using (private.is_super_admin())
  with check (private.is_super_admin());

drop policy if exists "Super admins read economy snapshots" on public.economy_snapshots;
create policy "Super admins read economy snapshots"
  on public.economy_snapshots for select
  to authenticated
  using (private.is_super_admin());

drop policy if exists "Super admins manage economy snapshots" on public.economy_snapshots;
create policy "Super admins manage economy snapshots"
  on public.economy_snapshots for all
  to authenticated
  using (private.is_super_admin())
  with check (private.is_super_admin());

drop policy if exists "Read active mission groups" on public.mission_groups;
create policy "Read active mission groups"
  on public.mission_groups for select
  to authenticated
  using (active = true or private.is_super_admin());

drop policy if exists "Super admins manage mission groups" on public.mission_groups;
create policy "Super admins manage mission groups"
  on public.mission_groups for all
  to authenticated
  using (private.is_super_admin())
  with check (private.is_super_admin());

drop policy if exists "Read active missions" on public.missions;
create policy "Read active missions"
  on public.missions for select
  to authenticated
  using (active = true or private.is_super_admin());

drop policy if exists "Super admins manage missions" on public.missions;
create policy "Super admins manage missions"
  on public.missions for all
  to authenticated
  using (private.is_super_admin())
  with check (private.is_super_admin());

drop policy if exists "Users read scoped mission completions" on public.mission_completions;
create policy "Users read scoped mission completions"
  on public.mission_completions for select
  to authenticated
  using (private.can_access_user(user_id));

drop policy if exists "Managers update scoped mission completions" on public.mission_completions;
create policy "Managers update scoped mission completions"
  on public.mission_completions for update
  to authenticated
  using (private.can_manage_user(user_id))
  with check (private.can_manage_user(user_id));

drop policy if exists "Users read scoped attendance logs" on public.attendance_logs;
create policy "Users read scoped attendance logs"
  on public.attendance_logs for select
  to authenticated
  using (private.can_access_user(user_id));

drop policy if exists "Users read scoped wallets" on public.user_wallets;
create policy "Users read scoped wallets"
  on public.user_wallets for select
  to authenticated
  using (private.can_access_user(user_id));

drop policy if exists "Users read scoped wallet ledger" on public.wallet_ledger;
create policy "Users read scoped wallet ledger"
  on public.wallet_ledger for select
  to authenticated
  using (private.can_access_user(user_id));

drop policy if exists "Users read scoped sxp ledger" on public.sxp_ledger;
create policy "Users read scoped sxp ledger"
  on public.sxp_ledger for select
  to authenticated
  using (private.can_access_user(user_id));

drop policy if exists "Read active sword levels" on public.sword_levels;
create policy "Read active sword levels"
  on public.sword_levels for select
  to authenticated
  using (active = true or private.is_super_admin());

drop policy if exists "Super admins manage sword levels" on public.sword_levels;
create policy "Super admins manage sword levels"
  on public.sword_levels for all
  to authenticated
  using (private.is_super_admin())
  with check (private.is_super_admin());

drop policy if exists "Users read scoped sword states" on public.user_sword_states;
create policy "Users read scoped sword states"
  on public.user_sword_states for select
  to authenticated
  using (private.can_access_user(user_id));

drop policy if exists "Users read scoped sword upgrade logs" on public.sword_upgrade_logs;
create policy "Users read scoped sword upgrade logs"
  on public.sword_upgrade_logs for select
  to authenticated
  using (private.can_access_user(user_id));

drop policy if exists "Read active collectibles" on public.collectibles;
create policy "Read active collectibles"
  on public.collectibles for select
  to authenticated
  using (active = true or private.is_super_admin());

drop policy if exists "Super admins manage collectibles" on public.collectibles;
create policy "Super admins manage collectibles"
  on public.collectibles for all
  to authenticated
  using (private.is_super_admin())
  with check (private.is_super_admin());

drop policy if exists "Users read scoped user collectibles" on public.user_collectibles;
create policy "Users read scoped user collectibles"
  on public.user_collectibles for select
  to authenticated
  using (private.can_access_user(user_id));

drop policy if exists "Users read scoped profile equipment" on public.profile_equipment;
create policy "Users read scoped profile equipment"
  on public.profile_equipment for select
  to authenticated
  using (private.can_access_user(user_id));

drop policy if exists "Read active rewards" on public.rewards;
create policy "Read active rewards"
  on public.rewards for select
  to authenticated
  using (active = true or private.is_super_admin());

drop policy if exists "Super admins manage rewards" on public.rewards;
create policy "Super admins manage rewards"
  on public.rewards for all
  to authenticated
  using (private.is_super_admin())
  with check (private.is_super_admin());

drop policy if exists "Read active hidden reward pool" on public.hidden_reward_pool_items;
create policy "Read active hidden reward pool"
  on public.hidden_reward_pool_items for select
  to authenticated
  using (active = true or private.is_super_admin());

drop policy if exists "Super admins manage hidden reward pool" on public.hidden_reward_pool_items;
create policy "Super admins manage hidden reward pool"
  on public.hidden_reward_pool_items for all
  to authenticated
  using (private.is_super_admin())
  with check (private.is_super_admin());

drop policy if exists "Users read scoped reward redemptions" on public.reward_redemptions;
create policy "Users read scoped reward redemptions"
  on public.reward_redemptions for select
  to authenticated
  using (private.can_access_user(user_id));

drop policy if exists "Users read scoped inventory" on public.inventory_items;
create policy "Users read scoped inventory"
  on public.inventory_items for select
  to authenticated
  using (private.can_access_user(user_id));

drop policy if exists "Users read scoped tree hits" on public.tree_hit_logs;
create policy "Users read scoped tree hits"
  on public.tree_hit_logs for select
  to authenticated
  using (private.can_access_user(user_id));

drop policy if exists "Read active events" on public.events;
create policy "Read active events"
  on public.events for select
  to authenticated
  using (active = true or private.is_super_admin());

drop policy if exists "Super admins manage events" on public.events;
create policy "Super admins manage events"
  on public.events for all
  to authenticated
  using (private.is_super_admin())
  with check (private.is_super_admin());

-- The current app config must not contain sensitive admin-only data
-- if it is read directly by authenticated clients.
drop policy if exists "Authenticated users read current app config" on public.app_config_snapshots;
create policy "Authenticated users read current app config"
  on public.app_config_snapshots for select
  to authenticated
  using (id = 'current');

drop policy if exists "Super admins manage app config" on public.app_config_snapshots;
create policy "Super admins manage app config"
  on public.app_config_snapshots for all
  to authenticated
  using (private.is_super_admin())
  with check (private.is_super_admin());

drop policy if exists "Read active assets" on public.asset_registry;
create policy "Read active assets"
  on public.asset_registry for select
  to authenticated
  using (active = true or private.is_super_admin());

drop policy if exists "Super admins manage assets" on public.asset_registry;
create policy "Super admins manage assets"
  on public.asset_registry for all
  to authenticated
  using (private.is_super_admin())
  with check (private.is_super_admin());

drop policy if exists "Super admins read audit logs" on public.admin_audit_logs;
create policy "Super admins read audit logs"
  on public.admin_audit_logs for select
  to authenticated
  using (private.is_super_admin());

drop policy if exists "Super admins insert audit logs" on public.admin_audit_logs;
create policy "Super admins insert audit logs"
  on public.admin_audit_logs for insert
  to authenticated
  with check (private.is_super_admin());

drop policy if exists "Read active quiz questions" on public.quiz_questions;
create policy "Read active quiz questions"
  on public.quiz_questions for select
  to authenticated
  using (active = true or private.is_super_admin());

drop policy if exists "Super admins manage quiz questions" on public.quiz_questions;
create policy "Super admins manage quiz questions"
  on public.quiz_questions for all
  to authenticated
  using (private.is_super_admin())
  with check (private.is_super_admin());

-- quiz_options contains is_correct. Users should get options through an RPC/view
-- that omits the answer flag.
drop policy if exists "Super admins manage quiz options" on public.quiz_options;
create policy "Super admins manage quiz options"
  on public.quiz_options for all
  to authenticated
  using (private.is_super_admin())
  with check (private.is_super_admin());

drop policy if exists "Users read scoped quiz attempts" on public.quiz_attempts;
create policy "Users read scoped quiz attempts"
  on public.quiz_attempts for select
  to authenticated
  using (private.can_access_user(user_id));

drop policy if exists "Read active seasons" on public.seasons;
create policy "Read active seasons"
  on public.seasons for select
  to authenticated
  using (active = true or private.is_super_admin());

drop policy if exists "Super admins manage seasons" on public.seasons;
create policy "Super admins manage seasons"
  on public.seasons for all
  to authenticated
  using (private.is_super_admin())
  with check (private.is_super_admin());

drop policy if exists "Authenticated users read leaderboards" on public.leaderboard_snapshots;
create policy "Authenticated users read leaderboards"
  on public.leaderboard_snapshots for select
  to authenticated
  using (true);

drop policy if exists "Super admins manage leaderboards" on public.leaderboard_snapshots;
create policy "Super admins manage leaderboards"
  on public.leaderboard_snapshots for all
  to authenticated
  using (private.is_super_admin())
  with check (private.is_super_admin());

drop policy if exists "Users read scoped notifications" on public.notification_jobs;
create policy "Users read scoped notifications"
  on public.notification_jobs for select
  to authenticated
  using (user_id is not null and private.can_access_user(user_id));

drop policy if exists "Super admins manage notifications" on public.notification_jobs;
create policy "Super admins manage notifications"
  on public.notification_jobs for all
  to authenticated
  using (private.is_super_admin())
  with check (private.is_super_admin());

drop policy if exists "Super admins manage external webhook events" on public.external_webhook_events;
create policy "Super admins manage external webhook events"
  on public.external_webhook_events for all
  to authenticated
  using (private.is_super_admin())
  with check (private.is_super_admin());
