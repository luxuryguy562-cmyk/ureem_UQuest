import { useState } from "react";

import { CircleButton, CurrencyGrid, ProductRow, SectionTitle, TopBar } from "@/components/uquest/common";
import { formatNumber } from "@/lib/format";
import type { ActivityRecord, CalendarDay, InventoryItem, MissionDayDetail, ScreenKey, SwordUpgradeConfig, UserProfile } from "@/types/uquest";

export function ProfileScreen({
  active,
  user,
  sword,
  monthLabel,
  calendarDays,
  activities,
  inventory,
  onGo
}: {
  active: boolean;
  user: UserProfile;
  sword: SwordUpgradeConfig;
  monthLabel: string;
  calendarDays: CalendarDay[];
  activities: ActivityRecord[];
  inventory: InventoryItem[];
  onGo: (screen: ScreenKey) => void;
}) {
  const defaultDetail = calendarDays.find((day) => day.state === "today")?.detail;
  const currentSword = sword?.current ?? { label: user.levelLabel, name: "성장 단계" };
  const [selectedActivity, setSelectedActivity] = useState<ActivityRecord | null>(null);

  return (
    <main className={`screen${active ? " active" : ""}`} id="profileScreen">
      <TopBar
        eyebrow="개인 성장 현황"
        title="내 대시보드"
        actions={<CircleButton label="🎁" variant="light" onClick={() => onGo("inventory")} />}
      />

      <section className="player-card">
        <div className="player-portrait">
          <img alt="" src="/assets/onboarding-avatar-sprite.png" />
          <div className="player-level-mark">
            <span>Lv</span>
            <strong>{currentSword.level}</strong>
          </div>
        </div>
        <div className="player-info">
          <div className="player-title-row">
            <div>
              <strong>{user.displayName}</strong>
              <span>{currentSword.name}</span>
            </div>
            <em>{user.rankLabel}</em>
          </div>
          <div className="player-meter">
            <span style={{ width: `${user.onboardingProgressPct}%` }} />
          </div>
          <div className="player-readout">
            {user.branchName} · D+{user.onboardingDay} 온보딩 중
          </div>
        </div>
      </section>

      <CurrencyGrid currencies={user.profileMetrics} />

      <section className="card">
        <SectionTitle title="온보딩 활동 기록" badge="최근 활동" />
        {activities.map((activity) => (
          <ProductRow
            actionLabel={activity.actionLabel}
            description={activity.description}
            icon={activity.icon}
            key={activity.id}
            onClick={() => setSelectedActivity(activity)}
            title={activity.title}
          />
        ))}
      </section>

      <section className="card">
        <div className="title-row">
          <h2>온보딩 진행</h2>
          <div className="progress-pill">{user.onboardingProgressPct}%</div>
        </div>
        <div className="xp-bar">
          <div style={{ width: `${user.onboardingProgressPct}%` }} />
        </div>
        <AttendanceCalendar defaultDetail={defaultDetail} user={user} />
      </section>

      <section className="card">
        <SectionTitle title="내 쿠폰함" badge={`${inventory.length}개 보유`} />
        {inventory.slice(0, 2).map((item) => (
          <ProductRow
            actionLabel={item.actionLabel}
            description={item.description}
            icon={item.icon}
            key={item.id}
            title={item.title}
          />
        ))}
      </section>
      <div className={`modal${selectedActivity ? " show" : ""}`}>
        <div className="modal-card">
          <h2>{selectedActivity?.title ?? "활동 상세"}</h2>
          <p>{selectedActivity?.description ?? ""}</p>
          <button className="modal-close" onClick={() => setSelectedActivity(null)} type="button">
            닫기
          </button>
        </div>
      </div>
    </main>
  );
}

function AttendanceCalendar({
  defaultDetail,
  user
}: {
  defaultDetail?: MissionDayDetail;
  user: UserProfile;
}) {
  const today = getDateOnly(new Date());
  const planStart = addDays(today, -(user.onboardingDay - 1));
  const planEnd = addDays(planStart, 59);
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(today));
  const [selectedDate, setSelectedDate] = useState(today);
  const cells = buildMonthCells(visibleMonth);
  const canPrev = monthKey(addMonths(visibleMonth, -1)) >= monthKey(startOfMonth(planStart));
  const canNext = monthKey(addMonths(visibleMonth, 1)) <= monthKey(startOfMonth(planEnd));
  const selectedDay = getPlanDay(selectedDate, planStart);
  const selectedInPlan = selectedDay >= 1 && selectedDay <= 60;
  const selectedIsToday = isSameDay(selectedDate, today);
  const activeDetail = selectedIsToday && defaultDetail
    ? defaultDetail
    : createDayDetail(selectedDay, selectedInPlan, selectedDate < today);

  return (
    <div className="onboarding-calendar">
      <div className="calendar-head">
        <button className="month-nav" disabled={!canPrev} onClick={() => setVisibleMonth(addMonths(visibleMonth, -1))} type="button">
          ‹
        </button>
        <strong>{formatMonthLabel(visibleMonth)}</strong>
        <button className="month-nav" disabled={!canNext} onClick={() => setVisibleMonth(addMonths(visibleMonth, 1))} type="button">
          ›
        </button>
      </div>
      <div className="calendar-runway">
        <span>D+1</span>
        <div><i style={{ width: `${Math.min(100, Math.round((user.onboardingDay / 60) * 100))}%` }} /></div>
        <span>D+60</span>
      </div>
      <div className="calendar-weekdays">
        <div>일</div>
        <div>월</div>
        <div>화</div>
        <div>수</div>
        <div>목</div>
        <div>금</div>
        <div>토</div>
      </div>
      <div className="calendar-grid">
        {cells.map((day, index) => {
          if (!day) return <div className="cal-day empty" key={`blank-${visibleMonth.toISOString()}-${index}`} />;

          const planDay = getPlanDay(day, planStart);
          const inPlan = planDay >= 1 && planDay <= 60;
          const state = !inPlan ? "outside" : isSameDay(day, today) ? "today" : day < today ? "full" : "future";

          return (
            <button className={`cal-day ${state}${isSameDay(day, selectedDate) ? " selected" : ""}`} disabled={!inPlan} key={day.toISOString()} onClick={() => setSelectedDate(day)} type="button">
              <span className="cal-date">{day.getDate()}</span>
              {inPlan ? (
              <>
                <strong className="ticket-score">
                  {state === "future" ? `D+${planDay}` : state === "today" ? "오늘" : "완료"}
                </strong>
                <div className="ticket-bar">
                  <span style={{ width: state === "full" ? "100%" : state === "today" ? `${user.onboardingProgressPct}%` : "0%" }} />
                </div>
              </>
            ) : null}
            </button>
          );
        })}
      </div>
      <div className="day-detail" id="dayDetail">
        <div className="day-detail-title">
          <strong>{activeDetail.title}</strong>
          <span className="pill" style={{ color: "#f97316", background: "#fff7ed" }}>
            {activeDetail.earnedTicket}/{activeDetail.maxTicket} 획득
          </span>
        </div>
        {activeDetail.tasks.map((task) => (
          <div className="detail-task" key={task.label}>
            <span>{task.label}</span>
            <span className={task.earnedTicket >= task.maxTicket ? "ok" : "no"}>
              {task.earnedTicket}/{task.maxTicket}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function createDayDetail(planDay: number, inPlan: boolean, past: boolean): MissionDayDetail {
  if (!inPlan) {
    return {
      title: "온보딩 기간 밖",
      earnedTicket: 0,
      maxTicket: 0,
      tasks: []
    };
  }

  return {
    title: `D+${planDay} 온보딩`,
    earnedTicket: past ? 30 : 0,
    maxTicket: 30,
    tasks: [
      { label: "출석 체크", earnedTicket: past ? 10 : 0, maxTicket: 10 },
      { label: "오늘 미션", earnedTicket: past ? 10 : 0, maxTicket: 10 },
      { label: "포인트 적립", earnedTicket: past ? 10 : 0, maxTicket: 10 }
    ]
  };
}

function buildMonthCells(month: Date) {
  const first = startOfMonth(month);
  const blanks = Array.from<null>({ length: first.getDay() }).fill(null);
  const days = Array.from({ length: new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate() }, (_, index) => new Date(first.getFullYear(), first.getMonth(), index + 1));

  return [...blanks, ...days];
}

function getPlanDay(date: Date, start: Date) {
  return Math.floor((getDateOnly(date).getTime() - getDateOnly(start).getTime()) / 86400000) + 1;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return getDateOnly(next);
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getDateOnly(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameDay(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
}

function monthKey(date: Date) {
  return date.getFullYear() * 12 + date.getMonth();
}

function formatMonthLabel(date: Date) {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
}
