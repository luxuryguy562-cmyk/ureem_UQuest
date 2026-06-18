-- U-Quest final Supabase schema.
-- 기준: CHANGELOG_v1.1.md > PRD.md > GAME_DESIGN.md > DATA_MODEL.md
-- 목적: 4주 온보딩, 20일 커리큘럼, 배지/티어/AX, 포인트/쿠폰, 권한 분리.

create extension if not exists pgcrypto;

create schema if not exists private;

do $$
begin
  create type public.uquest_role as enum ('rookie', 'manager', 'admin');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.uquest_user_status as enum ('pending', 'active', 'rejected', 'completed', 'inactive');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.uquest_badge_category as enum ('attendance', 'quiz', 'tier', 'rare');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.uquest_quiz_tier as enum ('Unranked', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.uquest_ax_level as enum ('Explorer', 'User', 'Expert', 'Master');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.uquest_ax_type as enum ('AX', 'DX');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.uquest_point_type as enum (
    'attendance',
    'learning',
    'quiz',
    'ax',
    'badge',
    'tier',
    'coupon_request',
    'coupon_cancel',
    'manual_add',
    'manual_subtract',
    'expire',
    'inactive_forfeit'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.uquest_coupon_request_status as enum ('requested', 'canceled', 'sent');
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

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  role public.uquest_role not null default 'rookie',
  name text not null,
  avatar_gender text check (avatar_gender in ('male', 'female')),
  phone text not null,
  login_id text not null unique,
  password_hash text,
  email text,
  employee_number text,
  store_id uuid references public.stores(id) on delete set null,
  hire_date date,
  status public.uquest_user_status not null default 'pending',
  reject_reason text,
  approved_at timestamptz,
  completed_at timestamptz,
  inactive_at timestamptz,
  exp integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_exp_nonnegative check (exp >= 0),
  constraint users_rookie_store_required check (role <> 'rookie' or store_id is not null),
  constraint users_manager_store_required check (role <> 'manager' or store_id is not null)
);

create table if not exists public.curriculums (
  id uuid primary key default gen_random_uuid(),
  day_number integer not null unique,
  title text not null,
  description text not null,
  image_url text,
  learning_reward_points integer not null default 300,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint curriculums_day_range check (day_number between 1 and 20),
  constraint curriculums_reward_nonnegative check (learning_reward_points >= 0)
);

create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  curriculum_id uuid not null references public.curriculums(id) on delete cascade,
  question text not null,
  option_1 text not null,
  option_2 text not null,
  option_3 text not null,
  option_4 text not null,
  correct_option integer not null,
  explanation text,
  reward_points integer not null default 300,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quizzes_correct_option_range check (correct_option between 0 and 3),
  constraint quizzes_reward_nonnegative check (reward_points >= 0),
  constraint quizzes_sort_nonnegative check (sort_order >= 0)
);

create table if not exists public.attendances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  attendance_date date not null default current_date,
  reward_points integer not null default 300,
  created_at timestamptz not null default now(),
  unique (user_id, attendance_date),
  constraint attendances_reward_nonnegative check (reward_points >= 0)
);

create table if not exists public.learning_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  curriculum_id uuid not null references public.curriculums(id) on delete restrict,
  completion_date date not null default current_date,
  reward_points integer not null default 300,
  created_at timestamptz not null default now(),
  unique (user_id, curriculum_id),
  unique (user_id, completion_date),
  constraint learning_reward_nonnegative check (reward_points >= 0)
);

create table if not exists public.quiz_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  curriculum_id uuid not null references public.curriculums(id) on delete restrict,
  total_count integer not null,
  correct_count integer not null,
  earned_points integer not null,
  submitted_at timestamptz not null default now(),
  unique (user_id, curriculum_id),
  constraint quiz_submission_total_positive check (total_count > 0),
  constraint quiz_submission_correct_range check (correct_count >= 0 and correct_count <= total_count),
  constraint quiz_submission_points_nonnegative check (earned_points >= 0)
);

create table if not exists public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.quiz_submissions(id) on delete cascade,
  quiz_id uuid not null references public.quizzes(id) on delete restrict,
  selected_option integer not null,
  correct_option integer not null,
  is_correct boolean not null,
  reward_points integer not null,
  created_at timestamptz not null default now(),
  unique (submission_id, quiz_id),
  constraint quiz_answers_selected_range check (selected_option between 0 and 3),
  constraint quiz_answers_correct_range check (correct_option between 0 and 3),
  constraint quiz_answers_reward_nonnegative check (reward_points >= 0)
);

create table if not exists public.ax_categories (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  type public.uquest_ax_type not null,
  title text not null,
  description text not null,
  reward_points integer not null default 500,
  example_image_url text,
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ax_categories_reward_nonnegative check (reward_points >= 0),
  constraint ax_categories_sort_nonnegative check (sort_order >= 0)
);

create table if not exists public.ax_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  category_id uuid not null references public.ax_categories(id) on delete restrict,
  image_url text not null,
  reward_points integer not null default 500,
  created_at timestamptz not null default now(),
  constraint ax_submissions_image_required check (length(trim(image_url)) > 0),
  constraint ax_submissions_reward_nonnegative check (reward_points >= 0)
);

create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  category public.uquest_badge_category not null,
  name text not null,
  description text not null,
  condition_label text not null,
  reward_points integer not null default 0,
  image_key text not null,
  is_rare boolean not null default false,
  is_hidden boolean not null default false,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint badges_reward_nonnegative check (reward_points >= 0),
  constraint badges_sort_nonnegative check (sort_order >= 0)
);

create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete restrict,
  earned_at timestamptz not null default now(),
  unique (user_id, badge_id)
);

create table if not exists public.point_histories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  amount integer not null,
  balance_after integer not null,
  type public.uquest_point_type not null,
  reason text not null,
  reference_type text,
  reference_id uuid,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint point_histories_amount_nonzero check (amount <> 0),
  constraint point_histories_balance_nonnegative check (balance_after >= 0)
);

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  actual_price integer not null,
  required_points integer not null,
  stock_quantity integer,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint coupons_price_nonnegative check (actual_price >= 0),
  constraint coupons_required_points_nonnegative check (required_points >= 0),
  constraint coupons_stock_nonnegative check (stock_quantity is null or stock_quantity >= 0)
);

create table if not exists public.coupon_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  coupon_id uuid not null references public.coupons(id) on delete restrict,
  required_points integer not null,
  status public.uquest_coupon_request_status not null default 'requested',
  requested_at timestamptz not null default now(),
  canceled_at timestamptz,
  sent_at timestamptz,
  expires_at timestamptz,
  processed_by uuid references public.users(id) on delete set null,
  cancel_reason text,
  constraint coupon_requests_points_nonnegative check (required_points >= 0),
  constraint coupon_requests_status_dates check (
    (status <> 'canceled' or canceled_at is not null)
    and (status <> 'sent' or (sent_at is not null and expires_at is not null))
  )
);

create unique index if not exists coupon_requests_open_unique
  on public.coupon_requests (user_id, coupon_id)
  where status = 'requested';

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  target_role public.uquest_role,
  target_user_id uuid references public.users(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  constraint notifications_target_required check (target_role is not null or target_user_id is not null)
);

create table if not exists public.onboarding_status (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  current_day integer not null default 1,
  progress_rate numeric(6, 2) not null default 0,
  attendance_count integer not null default 0,
  learning_count integer not null default 0,
  quiz_solved_count integer not null default 0,
  quiz_correct_count integer not null default 0,
  quiz_accuracy_rate numeric(6, 2) not null default 0,
  ax_submission_count integer not null default 0,
  character_level integer not null default 1,
  quiz_tier public.uquest_quiz_tier not null default 'Unranked',
  ax_level public.uquest_ax_level not null default 'Explorer',
  point_balance integer not null default 0,
  total_earned_points integer not null default 0,
  total_spent_points integer not null default 0,
  shop_opened_at timestamptz,
  point_expire_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint onboarding_date_order check (end_date >= start_date),
  constraint onboarding_current_day_range check (current_day between 1 and 20),
  constraint onboarding_rate_range check (progress_rate >= 0 and progress_rate <= 100),
  constraint onboarding_counts_nonnegative check (
    attendance_count >= 0
    and learning_count >= 0
    and quiz_solved_count >= 0
    and quiz_correct_count >= 0
    and ax_submission_count >= 0
  ),
  constraint onboarding_quiz_count_range check (quiz_correct_count <= quiz_solved_count),
  constraint onboarding_quiz_accuracy_range check (quiz_accuracy_rate >= 0 and quiz_accuracy_rate <= 100),
  constraint onboarding_character_range check (character_level between 1 and 5),
  constraint onboarding_points_nonnegative check (
    point_balance >= 0
    and total_earned_points >= 0
    and total_spent_points >= 0
  )
);

create table if not exists public.app_config_snapshots (
  id text primary key default 'current',
  payload jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_config_snapshots_singleton check (id = 'current'),
  constraint app_config_snapshots_version_positive check (version >= 1)
);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.users(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id uuid,
  reason text not null,
  before_value jsonb,
  after_value jsonb,
  created_at timestamptz not null default now()
);

create index if not exists users_role_status_idx on public.users (role, status);
create index if not exists users_store_idx on public.users (store_id);
create index if not exists quizzes_curriculum_sort_idx on public.quizzes (curriculum_id, sort_order);
create index if not exists attendances_user_date_idx on public.attendances (user_id, attendance_date desc);
create index if not exists learning_user_date_idx on public.learning_completions (user_id, completion_date desc);
create index if not exists quiz_submissions_user_submitted_idx on public.quiz_submissions (user_id, submitted_at desc);
create index if not exists ax_submissions_user_created_idx on public.ax_submissions (user_id, created_at desc);
create index if not exists point_histories_user_created_idx on public.point_histories (user_id, created_at desc);
create index if not exists coupon_requests_user_requested_idx on public.coupon_requests (user_id, requested_at desc);
create index if not exists admin_audit_logs_created_idx on public.admin_audit_logs (created_at desc);

drop trigger if exists set_stores_updated_at on public.stores;
create trigger set_stores_updated_at before update on public.stores
  for each row execute function public.set_updated_at();

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at before update on public.users
  for each row execute function public.set_updated_at();

drop trigger if exists set_curriculums_updated_at on public.curriculums;
create trigger set_curriculums_updated_at before update on public.curriculums
  for each row execute function public.set_updated_at();

drop trigger if exists set_quizzes_updated_at on public.quizzes;
create trigger set_quizzes_updated_at before update on public.quizzes
  for each row execute function public.set_updated_at();

drop trigger if exists set_ax_categories_updated_at on public.ax_categories;
create trigger set_ax_categories_updated_at before update on public.ax_categories
  for each row execute function public.set_updated_at();

drop trigger if exists set_badges_updated_at on public.badges;
create trigger set_badges_updated_at before update on public.badges
  for each row execute function public.set_updated_at();

drop trigger if exists set_coupons_updated_at on public.coupons;
create trigger set_coupons_updated_at before update on public.coupons
  for each row execute function public.set_updated_at();

drop trigger if exists set_onboarding_status_updated_at on public.onboarding_status;
create trigger set_onboarding_status_updated_at before update on public.onboarding_status
  for each row execute function public.set_updated_at();

drop trigger if exists set_app_config_snapshots_updated_at on public.app_config_snapshots;
create trigger set_app_config_snapshots_updated_at before update on public.app_config_snapshots
  for each row execute function public.set_updated_at();

create or replace function private.current_uquest_user_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select u.id
  from public.users u
  where u.auth_user_id = (select auth.uid())
  limit 1;
$$;

create or replace function private.current_uquest_role()
returns public.uquest_role
language sql
stable
security definer
set search_path = ''
as $$
  select u.role
  from public.users u
  where u.auth_user_id = (select auth.uid())
  limit 1;
$$;

create or replace function private.current_uquest_store_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select u.store_id
  from public.users u
  where u.auth_user_id = (select auth.uid())
  limit 1;
$$;

create or replace function private.is_uquest_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.current_uquest_role() = 'admin'::public.uquest_role, false);
$$;

create or replace function private.is_uquest_manager()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.current_uquest_role() = 'manager'::public.uquest_role, false);
$$;

create or replace function private.can_read_uquest_user(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select target_user_id = private.current_uquest_user_id()
    or private.is_uquest_admin()
    or exists (
      select 1
      from public.users target_user
      where target_user.id = target_user_id
        and target_user.role = 'rookie'::public.uquest_role
        and target_user.store_id = private.current_uquest_store_id()
        and private.is_uquest_manager()
    );
$$;

alter table public.stores enable row level security;
alter table public.users enable row level security;
alter table public.curriculums enable row level security;
alter table public.quizzes enable row level security;
alter table public.attendances enable row level security;
alter table public.learning_completions enable row level security;
alter table public.quiz_submissions enable row level security;
alter table public.quiz_answers enable row level security;
alter table public.ax_categories enable row level security;
alter table public.ax_submissions enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
alter table public.point_histories enable row level security;
alter table public.coupons enable row level security;
alter table public.coupon_requests enable row level security;
alter table public.notifications enable row level security;
alter table public.onboarding_status enable row level security;
alter table public.app_config_snapshots enable row level security;
alter table public.admin_audit_logs enable row level security;

drop policy if exists "uquest stores readable" on public.stores;
create policy "uquest stores readable"
  on public.stores for select
  to authenticated
  using (is_active = true or private.is_uquest_admin());

drop policy if exists "uquest stores admin write" on public.stores;
create policy "uquest stores admin write"
  on public.stores for all
  to authenticated
  using (private.is_uquest_admin())
  with check (private.is_uquest_admin());

drop policy if exists "uquest users scoped read" on public.users;
create policy "uquest users scoped read"
  on public.users for select
  to authenticated
  using (private.can_read_uquest_user(id));

drop policy if exists "uquest users admin write" on public.users;
create policy "uquest users admin write"
  on public.users for all
  to authenticated
  using (private.is_uquest_admin())
  with check (private.is_uquest_admin());

drop policy if exists "uquest published curriculums readable" on public.curriculums;
create policy "uquest published curriculums readable"
  on public.curriculums for select
  to authenticated
  using (is_published = true or private.is_uquest_admin());

drop policy if exists "uquest curriculums admin write" on public.curriculums;
create policy "uquest curriculums admin write"
  on public.curriculums for all
  to authenticated
  using (private.is_uquest_admin())
  with check (private.is_uquest_admin());

drop policy if exists "uquest published quizzes readable" on public.quizzes;
create policy "uquest published quizzes readable"
  on public.quizzes for select
  to authenticated
  using (is_published = true or private.is_uquest_admin());

drop policy if exists "uquest quizzes admin write" on public.quizzes;
create policy "uquest quizzes admin write"
  on public.quizzes for all
  to authenticated
  using (private.is_uquest_admin())
  with check (private.is_uquest_admin());

drop policy if exists "uquest attendances scoped read" on public.attendances;
create policy "uquest attendances scoped read"
  on public.attendances for select
  to authenticated
  using (private.can_read_uquest_user(user_id));

drop policy if exists "uquest learning scoped read" on public.learning_completions;
create policy "uquest learning scoped read"
  on public.learning_completions for select
  to authenticated
  using (private.can_read_uquest_user(user_id));

drop policy if exists "uquest quiz submissions scoped read" on public.quiz_submissions;
create policy "uquest quiz submissions scoped read"
  on public.quiz_submissions for select
  to authenticated
  using (private.can_read_uquest_user(user_id));

drop policy if exists "uquest quiz answers scoped read" on public.quiz_answers;
create policy "uquest quiz answers scoped read"
  on public.quiz_answers for select
  to authenticated
  using (
    exists (
      select 1
      from public.quiz_submissions s
      where s.id = submission_id
        and private.can_read_uquest_user(s.user_id)
    )
  );

drop policy if exists "uquest ax categories readable" on public.ax_categories;
create policy "uquest ax categories readable"
  on public.ax_categories for select
  to authenticated
  using (is_published = true or private.is_uquest_admin());

drop policy if exists "uquest ax categories admin write" on public.ax_categories;
create policy "uquest ax categories admin write"
  on public.ax_categories for update
  to authenticated
  using (private.is_uquest_admin())
  with check (private.is_uquest_admin());

drop policy if exists "uquest ax submissions scoped read" on public.ax_submissions;
create policy "uquest ax submissions scoped read"
  on public.ax_submissions for select
  to authenticated
  using (private.can_read_uquest_user(user_id));

drop policy if exists "uquest badges readable" on public.badges;
create policy "uquest badges readable"
  on public.badges for select
  to authenticated
  using (is_published = true or private.is_uquest_admin());

drop policy if exists "uquest badges admin write" on public.badges;
create policy "uquest badges admin write"
  on public.badges for all
  to authenticated
  using (private.is_uquest_admin())
  with check (private.is_uquest_admin());

drop policy if exists "uquest user badges scoped read" on public.user_badges;
create policy "uquest user badges scoped read"
  on public.user_badges for select
  to authenticated
  using (private.can_read_uquest_user(user_id));

drop policy if exists "uquest point histories scoped read" on public.point_histories;
create policy "uquest point histories scoped read"
  on public.point_histories for select
  to authenticated
  using (private.can_read_uquest_user(user_id));

drop policy if exists "uquest coupons readable" on public.coupons;
create policy "uquest coupons readable"
  on public.coupons for select
  to authenticated
  using (is_published = true or private.is_uquest_admin());

drop policy if exists "uquest coupons admin write" on public.coupons;
create policy "uquest coupons admin write"
  on public.coupons for all
  to authenticated
  using (private.is_uquest_admin())
  with check (private.is_uquest_admin());

drop policy if exists "uquest coupon requests scoped read" on public.coupon_requests;
create policy "uquest coupon requests scoped read"
  on public.coupon_requests for select
  to authenticated
  using (private.can_read_uquest_user(user_id));

drop policy if exists "uquest notifications scoped read" on public.notifications;
create policy "uquest notifications scoped read"
  on public.notifications for select
  to authenticated
  using (
    target_user_id = private.current_uquest_user_id()
    or target_role = private.current_uquest_role()
    or private.is_uquest_admin()
  );

drop policy if exists "uquest onboarding status scoped read" on public.onboarding_status;
create policy "uquest onboarding status scoped read"
  on public.onboarding_status for select
  to authenticated
  using (private.can_read_uquest_user(user_id));

drop policy if exists "uquest app snapshots admin read" on public.app_config_snapshots;
create policy "uquest app snapshots admin read"
  on public.app_config_snapshots for select
  to authenticated
  using (private.is_uquest_admin());

drop policy if exists "uquest audit admin read" on public.admin_audit_logs;
create policy "uquest audit admin read"
  on public.admin_audit_logs for select
  to authenticated
  using (private.is_uquest_admin());

insert into public.ax_categories (code, type, title, description, reward_points, sort_order)
values
  ('ax-ai-helpdesk', 'AX', 'AI 헬프데스크', 'AI 헬프데스크를 실제 상담 준비에 활용합니다.', 500, 1),
  ('ax-smart-cs', 'AX', '스마트CS', '스마트CS로 고객 응대 정보를 확인합니다.', 500, 2),
  ('ax-rate-simulator', 'AX', '요금 시뮬레이터', '요금 시뮬레이터로 상담 시나리오를 실습합니다.', 500, 3)
on conflict (code) do nothing;
