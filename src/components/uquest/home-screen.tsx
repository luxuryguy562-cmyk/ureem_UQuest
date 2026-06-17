import { CircleButton, CurrencyGrid, SectionTitle, TopBar } from "@/components/uquest/common";
import { formatNumber } from "@/lib/format";
import type { AttendanceDay, MissionGroup, ScreenKey, SwordUpgradeConfig, UserProfile } from "@/types/uquest";

export function HomeScreen({
  active,
  user,
  sword,
  attendanceWeek,
  missionGroups,
  onGo,
  onAttendance,
  onMissionTask,
  onMissionGroupToggle
}: {
  active: boolean;
  user: UserProfile;
  sword: SwordUpgradeConfig;
  attendanceWeek: AttendanceDay[];
  missionGroups: MissionGroup[];
  onGo: (screen: ScreenKey) => void;
  onAttendance: () => void;
  onMissionTask: (groupId: string, taskId: string) => void;
  onMissionGroupToggle: (groupId: string) => void;
}) {
  const currentSword = sword?.current ?? { label: user.levelLabel, name: "성장 단계" };
  const pointWallet = user.wallet.filter((currency) => currency.id === "coin");
  const pointAmount = user.profileMetrics.find((metric) => metric.id === "monthly_coin")?.amount ?? 0;

  return (
    <main className={`screen${active ? " active" : ""}`} id="homeScreen">
      <TopBar
        eyebrow="오늘 온보딩"
        title={user.displayName}
        tone="#64748b"
        actions={
          <div className="top-actions">
            <CircleButton label="⚙️" onClick={() => onGo("admin")} />
            <CircleButton label="👤" onClick={() => onGo("profile")} />
            <CircleButton label="🎁" variant="light" onClick={() => onGo("inventory")} />
          </div>
        }
      />

      <section className="quest-hero-card">
        <div className="quest-avatar-stage">
          <img alt="" className="quest-avatar-img" src="/assets/onboarding-avatar-sprite.png" />
          <div className="quest-level-orb">
            <span>Lv</span>
            <strong>{currentSword.level}</strong>
          </div>
        </div>
        <div className="quest-status">
          <div className="quest-status-head">
            <div>
              <div className="quest-kicker">TODAY QUEST</div>
              <h2>{currentSword.name}</h2>
            </div>
            <button className="quest-map-btn" aria-label="성장 화면" onClick={() => onGo("sword")} type="button">
              ↗
            </button>
          </div>
          <div className="quest-meter" aria-label={`다음 레벨까지 ${user.nextLevelProgressPct}%`}>
            <span style={{ width: `${user.nextLevelProgressPct}%` }} />
          </div>
          <div className="quest-readout">
            D+{user.onboardingDay} · {formatNumber(user.sxp)} XP · {formatNumber(pointAmount)}P
          </div>
        </div>
      </section>

      <CurrencyGrid currencies={pointWallet} />

      <section className="card">
        <div className="title-row">
          <h2>이번 주 출석</h2>
          <span className="pill">현황 보기</span>
        </div>
        <div className="week">
          {attendanceWeek.map((day) => (
            <div className={`day ${day.state === "done" ? "done" : day.state === "today" ? "today" : ""}`} key={day.id}>
              {day.label}
            </div>
          ))}
        </div>
        <div className="attendance-actions">
          <button className="attendance-btn" onClick={onAttendance} style={{ width: "100%" }} type="button">
            오늘 출석하기
          </button>
        </div>
      </section>

      <section className="card">
        <div className="title-row">
          <h2>오늘의 온보딩</h2>
          <div className="progress-pill">
            {missionGroups.filter((group) => group.completedCount > 0).length} / {missionGroups.length} 묶음
          </div>
        </div>
        {missionGroups.map((group) => (
          <div className="accordion" key={group.id}>
            <div
              aria-expanded={group.expanded}
              className="acc-head"
              onClick={() => onMissionGroupToggle(group.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") onMissionGroupToggle(group.id);
              }}
              role="button"
              tabIndex={0}
            >
              <div className="acc-name">
                {group.icon} {group.title}
              </div>
              <div className="acc-status">{group.statusLabel}</div>
            </div>
            {group.expanded ? (
              <div className="acc-body">
                {group.tasks.map((task) => (
                  <div
                    className={`task${task.completed ? " done" : ""}`}
                    key={task.id}
                    onClick={() => onMissionTask(group.id, task.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") onMissionTask(group.id, task.id);
                    }}
                  >
                    <div className="check">{task.completed ? "✓" : ""}</div>
                    {task.title}
                    <div className="reward">+{task.rewardTicket}</div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </section>
    </main>
  );
}
