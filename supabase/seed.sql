-- U-Quest 운영 기초 데이터 시드 (master data baseline)
-- 멱등(idempotent): 여러 번 실행해도 중복이 생기지 않도록 자연키/존재여부로 가드한다.
-- 기준 콘텐츠: src/lib/mock-data.ts
-- 주의: 신입 활동(출석/포인트 등) 데모 데이터는 넣지 않는다. 실제 운영 데이터만 쌓이게 한다.

-- 1) 매장 -------------------------------------------------------------------
insert into public.stores (name, code, is_active) values
  ('강남점', 'GN', true),
  ('잠실점', 'JS', true)
on conflict (code) do nothing;

-- 2) 운영 계정 (관리자/점장) ------------------------------------------------
-- password_hash 가 null 이면 로그인 비밀번호는 "demo" 로 동작한다(현행 인증 규칙).
insert into public.users (role, name, phone, login_id, store_id, status, hire_date)
values ('admin', '본사관리자', '010-0000-0000', 'admin.hq', null, 'active', null)
on conflict (login_id) do nothing;

insert into public.users (role, name, phone, login_id, store_id, status, hire_date)
select 'manager', '강남점장', '010-0000-0001', 'manager.gn', s.id, 'active', null
from public.stores s
where s.code = 'GN'
on conflict (login_id) do nothing;

-- 3) 커리큘럼 (Day 1~20) ----------------------------------------------------
do $$
declare
  titles text[] := array[
    '첫 출근과 기본 규칙', '매장 동선과 고객 맞이', '요금제 기본 구조', 'U+ONE 핵심 사용법',
    '스마트CS 응대 루틴', 'AI 헬프데스크 활용', '요금 시뮬레이터 실습', '생애주기 상담 이해',
    '타사 확보 대화 흐름', '자사 전환 체크포인트', '멤버십과 부가서비스', '개통 전 확인 항목',
    '클레임 1차 대응', '개인정보 보호', '피크타임 운영', '재고와 예약 관리',
    '상담 품질 점검', 'AX/DX 실전 적용', '수료 전 복습', '온보딩 마무리'
  ];
  i int;
begin
  for i in 1..20 loop
    insert into public.curriculums (day_number, title, description, learning_reward_points, is_published)
    values (i, titles[i], i || '일차에 필요한 현장 업무와 시스템 활용을 학습합니다.', 300, true)
    on conflict (day_number) do nothing;
  end loop;
end $$;

-- 4) 퀴즈 (커리큘럼별 가변 문항) -------------------------------------------
do $$
declare
  counts int[] := array[2,5,3,4,2,4,3,5,2,4,3,3,2,4,5,2,3,4,2,5];
  c record;
  q int;
  cnt int;
  correct int;
begin
  for c in select id, day_number, title from public.curriculums order by day_number loop
    -- 이미 해당 커리큘럼 퀴즈가 있으면 건너뛴다(멱등).
    if exists (select 1 from public.quizzes where curriculum_id = c.id) then
      continue;
    end if;
    cnt := counts[c.day_number];
    for q in 1..cnt loop
      correct := ((q - 1) + (c.day_number - 1)) % 4;
      insert into public.quizzes
        (curriculum_id, question, option_1, option_2, option_3, option_4,
         correct_option, explanation, reward_points, sort_order, is_published)
      values
        (c.id,
         c.title || '에서 가장 먼저 확인해야 할 항목은 무엇인가요? (' || q || ')',
         '고객 상황 확인', '임의 요금제 추천', '기록 없이 종료', '동료 계정 사용',
         correct,
         '현장 온보딩에서는 먼저 고객 상황과 시스템 기록을 확인한 뒤 다음 행동을 결정합니다.',
         300, q, true);
    end loop;
  end loop;
end $$;

-- 5) 배지 (출석/퀴즈/티어/희귀 총 20개) ------------------------------------
-- code 는 도메인 로직(isBadgeEarned)에서 사용하는 식별자이므로 절대 바꾸지 않는다.
insert into public.badges
  (code, category, name, description, condition_label, reward_points, image_key, is_rare, is_hidden, sort_order)
values
  ('attendance_1',  'attendance', '첫 출근',     '첫 출석을 완료했습니다.',     '출석 1일',  500,  'attendance_1',  false, false, 1),
  ('attendance_5',  'attendance', '성실 사원',   '5일 출석을 완료했습니다.',    '출석 5일',  1000, 'attendance_5',  false, false, 2),
  ('attendance_10', 'attendance', '꾸준 사원',   '10일 출석을 완료했습니다.',   '출석 10일', 1500, 'attendance_10', false, false, 3),
  ('attendance_15', 'attendance', '모범 사원',   '15일 출석을 완료했습니다.',   '출석 15일', 2000, 'attendance_15', false, false, 4),
  ('attendance_20', 'attendance', '출근 마스터', '20일 출석을 완료했습니다.',   '출석 20일', 3000, 'attendance_20', false, false, 5),
  ('quiz_1',  'quiz', '첫 도전',     '첫 퀴즈를 제출했습니다.',     '퀴즈 1문제 풀이',  500,  'quiz_1',  false, false, 11),
  ('quiz_10', 'quiz', '학습가',     '퀴즈 10문제를 풀이했습니다.', '퀴즈 10문제 풀이', 1000, 'quiz_10', false, false, 12),
  ('quiz_30', 'quiz', '탐구가',     '퀴즈 30문제를 풀이했습니다.', '퀴즈 30문제 풀이', 1500, 'quiz_30', false, false, 13),
  ('quiz_50', 'quiz', '지식인',     '퀴즈 50문제를 풀이했습니다.', '퀴즈 50문제 풀이', 2000, 'quiz_50', false, false, 14),
  ('quiz_60', 'quiz', '퀴즈 마스터', '퀴즈 60문제를 풀이했습니다.', '퀴즈 60문제 풀이', 3000, 'quiz_60', false, false, 15),
  ('tier_bronze',   'tier', 'Bronze',   '정답률 20% 이상을 달성했습니다.', '정답률 20% 이상', 500,  'tier_bronze',   false, false, 21),
  ('tier_silver',   'tier', 'Silver',   '정답률 40% 이상을 달성했습니다.', '정답률 40% 이상', 1000, 'tier_silver',   false, false, 22),
  ('tier_gold',     'tier', 'Gold',     '정답률 60% 이상을 달성했습니다.', '정답률 60% 이상', 2000, 'tier_gold',     false, false, 23),
  ('tier_platinum', 'tier', 'Platinum', '정답률 80% 이상을 달성했습니다.', '정답률 80% 이상', 3000, 'tier_platinum', false, false, 24),
  ('tier_diamond',  'tier', 'Diamond',  '정답률 95% 이상을 달성했습니다.', '정답률 95% 이상', 5000, 'tier_diamond',  false, false, 25),
  ('rare_attendance', 'rare', '성실의 증명',    '캐릭터 레벨 4 이상(출석·학습·퀴즈 정답 종합)에 도달했습니다.', '획득 전에는 조건 숨김', 3000,  'rare_attendance', true, true, 31),
  ('rare_quiz',       'rare', '지식의 증명',    '퀴즈 정답률 90% 이상을 달성했습니다.', '획득 전에는 조건 숨김', 3000,  'rare_quiz',       true, true, 32),
  ('rare_tier',       'rare', '실력의 증명',    'Diamond 티어를 달성했습니다.',   '획득 전에는 조건 숨김', 5000,  'rare_tier',       true, true, 33),
  ('rare_ax_master',  'rare', '혁신의 증명',    'AX Master에 도달했습니다.',      '획득 전에는 조건 숨김', 5000,  'rare_ax_master',  true, true, 34),
  ('rare_all_public', 'rare', '성장의 정점',    '모든 공개 배지를 획득했습니다.', '획득 전에는 조건 숨김', 10000, 'rare_all_public', true, true, 35),
  ('rare_legend',     'rare', 'U-Quest Legend', '모든 희귀 배지를 획득했습니다.', '획득 전에는 조건 숨김', 15000, 'rare_legend',     true, true, 36)
on conflict (code) do nothing;

-- 6) 쿠폰 (상점 기본 구성) --------------------------------------------------
-- 쿠폰은 자연키가 없으므로 테이블이 비어 있을 때만 1회 시드한다.
insert into public.coupons (name, description, actual_price, required_points, stock_quantity, is_published)
select * from (values
  ('스타벅스 모바일 쿠폰',          '아메리카노 톨 사이즈 모바일 교환권입니다.', 5000,  5000,  null::integer, true),
  ('편의점 모바일 상품권 1만원권', '편의점에서 사용 가능한 모바일 상품권입니다.', 10000, 10000, 100,           true),
  ('치킨 세트 기프티콘',           '인기 프랜차이즈 치킨 세트 교환권입니다.',     22000, 22000, 50,            true)
) as v(name, description, actual_price, required_points, stock_quantity, is_published)
where not exists (select 1 from public.coupons);
