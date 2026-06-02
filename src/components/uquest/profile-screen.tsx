import { CircleButton, CurrencyGrid, ProductRow, SectionTitle, TopBar } from "@/components/uquest/common";
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
  const currentSword = sword?.current ?? { label: user.levelLabel, name: "검" };

  return (
    <main className={`screen${active ? " active" : ""}`} id="profileScreen">
      <TopBar
        eyebrow="개인 성장 현황"
        title="내 대시보드"
        actions={<CircleButton label="🎁" variant="light" onClick={() => onGo("inventory")} />}
      />

      <section className="card">
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: 22,
              background: "linear-gradient(135deg,#dbeafe,#dcfce7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 34
            }}
          >
            ⚔️
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 1000 }}>{user.displayName}</div>
            <div className="small-text">
              {user.branchName} · 입사 D+{user.onboardingDay} · {currentSword.label} {currentSword.name}
            </div>
            <div className="small-text">SXP {user.sxp} · 온보딩 진행률 {user.onboardingProgressPct}%</div>
          </div>
          <div className="pill">{user.rankLabel}</div>
        </div>
      </section>

      <CurrencyGrid currencies={user.profileMetrics} />

      <section className="card">
        <SectionTitle title="검 성장 기록" badge="최근 활동" />
        {activities.map((activity) => (
          <ProductRow
            actionLabel={activity.actionLabel}
            description={activity.description}
            icon={activity.icon}
            key={activity.id}
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
        <AttendanceCalendar days={calendarDays} defaultDetail={defaultDetail} monthLabel={monthLabel} />
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
    </main>
  );
}

function AttendanceCalendar({
  days,
  defaultDetail,
  monthLabel
}: {
  days: CalendarDay[];
  defaultDetail?: MissionDayDetail;
  monthLabel: string;
}) {
  const activeDetail = defaultDetail ?? {
    title: "상세",
    earnedTicket: 0,
    maxTicket: 0,
    tasks: []
  };

  return (
    <div className="onboarding-calendar">
      <div className="calendar-head">
        <strong>{monthLabel}</strong>
        <span className="small-text">날짜를 누르면 상세 확인</span>
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
        {days.map((day) => (
          <div className={`cal-day ${day.state}`} key={day.id}>
            <span className="cal-date">{day.label}</span>
            {day.state !== "empty" ? (
              <>
                <strong className="ticket-score">
                  {day.state === "future" ? "예정" : `${day.earnedTicket}/${day.maxTicket}`}
                </strong>
                <div className="ticket-bar">
                  <span style={{ width: `${day.maxTicket ? (day.earnedTicket / day.maxTicket) * 100 : 0}%` }} />
                </div>
              </>
            ) : null}
          </div>
        ))}
      </div>
      <div className="calendar-legend">
        <span style={{ color: "#16a34a" }}>초록 = 전부 획득</span>
        <span style={{ color: "#f97316" }}>주황 = 일부 획득</span>
        <span style={{ color: "#dc2626" }}>빨강 = 0개</span>
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
