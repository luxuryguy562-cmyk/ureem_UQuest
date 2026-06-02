import { CircleButton, CurrencyGrid, SectionTitle, TopBar } from "@/components/uquest/common";
import { HeroAvatar } from "@/components/uquest/pixel-art";
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
  const currentSword = sword?.current ?? { label: user.levelLabel, name: "검" };
  const maxSwordLevel = sword?.maxLevel ?? 10;

  return (
    <main className={`screen${active ? " active" : ""}`} id="homeScreen">
      <TopBar
        eyebrow="오늘 검 상태"
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

      <section className="card">
        <div className="hero-box">
          <div className="sword-label">내 검 {currentSword.label}</div>
          <HeroAvatar />
        </div>
        <div className="growth-row" style={{ marginTop: 12 }}>
          <div>
            <div className="growth-title">내 검 성장</div>
            <div className="small-text">
              {currentSword.label} {currentSword.name} · 최대 Lv.{maxSwordLevel}
            </div>
            <div className="small-text">사람 성장 · {user.sxp} SXP · 진행 {user.nextLevelProgressPct}%</div>
            <div className="small-text">
              온보딩 진행 · D+{user.onboardingDay} · 코인 {formatNumber(user.profileMetrics[0]?.amount)}
            </div>
          </div>
          <button className="enhance-btn" onClick={() => onGo("sword")} style={{ width: 78, height: 58 }} type="button">
            ⚒
            <br />
            강화
          </button>
        </div>
        <div className="xp-bar" style={{ marginTop: 12 }}>
          <div style={{ width: `${user.nextLevelProgressPct}%` }} />
        </div>
      </section>

      <CurrencyGrid currencies={user.wallet} />

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
