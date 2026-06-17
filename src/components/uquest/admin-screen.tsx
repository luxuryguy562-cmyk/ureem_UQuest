import { formatCurrencyAmount, formatNumber, formatKrw } from "@/lib/format";
import type { AdminConfig, AdminTabKey, MissionGroup, RewardProduct, ScreenKey } from "@/types/uquest";

const tabs: Array<{ id: AdminTabKey; label: string }> = [
  { id: "dashboard", label: "대시보드" },
  { id: "employees", label: "직원" },
  { id: "missions", label: "미션" },
  { id: "rewards", label: "보상" },
  { id: "economy", label: "보상설정" }
];

export function AdminScreen({
  active,
  admin,
  missionGroups,
  rewards,
  activeTab,
  onTabChange,
  onGo,
  onModal,
  onAddMissionItem,
  onAddMissionGroup
}: {
  active: boolean;
  admin: AdminConfig;
  missionGroups: MissionGroup[];
  rewards: RewardProduct[];
  activeTab: AdminTabKey;
  onTabChange: (tab: AdminTabKey) => void;
  onGo: (screen: ScreenKey) => void;
  onModal: (title: string) => void;
  onAddMissionItem: (groupId: string) => void;
  onAddMissionGroup: () => void;
}) {
  return (
    <main className={`screen admin-shell${active ? " active" : ""}`} id="adminScreen">
      <div className="topbar">
        <div>
          <div className="top-sub" style={{ color: "#111827" }}>
            <span className="dot" style={{ background: "#111827" }} />
            관리자 전용
          </div>
          <h1>운영 대시보드</h1>
        </div>
        <div className="setting" onClick={() => onGo("home")} role="button" tabIndex={0}>
          ↩
        </div>
      </div>

      <section className="admin-summary">
        {admin.kpis.map((kpi) => (
          <div className="admin-kpi" key={kpi.id}>
            <label>{kpi.label}</label>
            <strong>{kpi.value}</strong>
            <span style={{ color: kpi.tone === "warn" ? "#f97316" : undefined }}>{kpi.description}</span>
          </div>
        ))}
      </section>

      <div className="admin-tabs">
        {tabs.map((tab) => (
          <button
            className={`admin-tab${activeTab === tab.id ? " active" : ""}`}
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "dashboard" ? <DashboardPanel admin={admin} onModal={onModal} /> : null}
      {activeTab === "employees" ? <EmployeesPanel admin={admin} onModal={onModal} /> : null}
      {activeTab === "missions" ? (
        <MissionsPanel missionGroups={missionGroups} onAddMissionGroup={onAddMissionGroup} onAddMissionItem={onAddMissionItem} />
      ) : null}
      {activeTab === "rewards" ? <RewardsPanel rewards={rewards} onModal={onModal} /> : null}
      {activeTab === "economy" ? <EconomyPanel admin={admin} /> : null}
    </main>
  );
}

function DashboardPanel({ admin, onModal }: { admin: AdminConfig; onModal: (title: string) => void }) {
  return (
    <section className="admin-panel active" id="adminDashboardPanel">
      <section className="admin-table-card">
        <div className="section-title">
          <h2>직원 전체 현황</h2>
          <span className="pill">오늘 기준</span>
        </div>
        <div className="employee-board">
          {admin.employees.map((employee) => (
            <EmployeeCard employee={employee} key={employee.id} onModal={onModal} />
          ))}
        </div>
      </section>
    </section>
  );
}

function EmployeesPanel({ admin, onModal }: { admin: AdminConfig; onModal: (title: string) => void }) {
  return (
    <section className="admin-panel active" id="adminEmployeesPanel">
      <section className="admin-table-card">
        <div className="section-title">
          <h2>직원 관리</h2>
          <span className="pill">승인/권한</span>
        </div>
        {admin.actionRows.map((row) => (
          <div className="admin-row" key={row.id}>
            <div>
              <strong>{row.title}</strong>
              <span>{row.description}</span>
            </div>
            <button className={`mini-btn${row.tone === "sub" ? " sub" : ""}`} onClick={() => onModal(row.title)} type="button">
              {row.actionLabel}
            </button>
          </div>
        ))}
      </section>
    </section>
  );
}

function MissionsPanel({
  missionGroups,
  onAddMissionItem,
  onAddMissionGroup
}: {
  missionGroups: MissionGroup[];
  onAddMissionItem: (groupId: string) => void;
  onAddMissionGroup: () => void;
}) {
  return (
    <section className="admin-panel active" id="adminMissionsPanel">
      <section className="admin-table-card">
        <div className="section-title">
          <h2>온보딩 미션 관리</h2>
          <span className="pill">묶음/항목 관리</span>
        </div>
        {missionGroups.map((group) => (
          <div className="accordion" key={group.id}>
            <div className="acc-head">
              <div className="acc-name">
                {group.icon} {group.title} 묶음
              </div>
              <div className="acc-status">{group.tasks.length}개 항목</div>
            </div>
            <div className="acc-body">
              {group.tasks.map((task) => (
                <div className="reward-admin-card" key={task.id}>
                  <div className="drag-handle">☰</div>
                  <div className="reward-admin-icon">{task.icon}</div>
                  <div className="reward-admin-info">
                    <strong>{task.title}</strong>
                    <span>
                      {task.sourceLabel ? `${task.sourceLabel} · ` : ""}리워드 기회 +{task.rewardTicket} · 정렬 {task.sortOrder}
                    </span>
                  </div>
                  <div className="status-pill good">활성</div>
                </div>
              ))}
              <button className="mini-btn" onClick={() => onAddMissionItem(group.id)} style={{ width: "100%", height: 40, borderRadius: 14 }} type="button">
                + 항목 추가
              </button>
            </div>
          </div>
        ))}
        <button className="upgrade-btn" onClick={onAddMissionGroup} style={{ height: 48, fontSize: 15, marginTop: 10 }} type="button">
          + 미션 묶음 추가
        </button>
      </section>
    </section>
  );
}

function RewardsPanel({ rewards, onModal }: { rewards: RewardProduct[]; onModal: (title: string) => void }) {
  return (
    <section className="admin-panel active" id="adminRewardsPanel">
      <section className="admin-table-card">
        <div className="section-title">
          <h2>보상 카드 관리</h2>
          <span className="pill">sort_order</span>
        </div>
        {rewards
          .slice()
          .sort((left, right) => left.sortOrder - right.sortOrder)
          .map((reward) => (
            <div className="reward-admin-card" key={reward.id}>
              <div className="drag-handle">☰</div>
              <div className="reward-admin-icon">{reward.icon}</div>
              <div className="reward-admin-info">
                <strong>{reward.title}</strong>
                <span>
                  {formatNumber(reward.cost)} 포인트 · 정렬 {reward.sortOrder}
                </span>
              </div>
              <div className="status-pill good">활성</div>
            </div>
          ))}
        <button className="upgrade-btn" onClick={() => onModal("보상 추가")} style={{ height: 48, fontSize: 15, marginTop: 8 }} type="button">
          + 보상 추가
        </button>
      </section>
    </section>
  );
}

function EconomyPanel({ admin }: { admin: AdminConfig }) {
  const { economy } = admin;
  const riskLabel = economy.budgetRisk === "stable" ? "안정" : economy.budgetRisk === "watch" ? "주의" : "위험";

  return (
    <section className="admin-panel active" id="adminEconomyPanel">
      <section className="admin-table-card">
        <div className="section-title">
          <h2>보상설정</h2>
          <span className="pill">실시간 경제 반영</span>
        </div>

        {economy.settings.map((setting) => (
          <div
            key={setting.id}
            style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 22, padding: 14, marginBottom: 12 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <strong style={{ fontSize: 15 }}>{setting.title}</strong>
              <div style={{ fontSize: 18, fontWeight: 1000, color: setting.tone === "purple" ? "#7c3aed" : "#2563eb" }}>
                {formatCurrencyAmount(setting.value, setting.unit)}
              </div>
            </div>
            <input max={setting.max} min={setting.min} readOnly style={{ width: "100%" }} type="range" value={setting.value} />
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <div style={{ flex: 1, background: "white", border: "1px solid #e5e7eb", borderRadius: 14, padding: "10px 12px", fontWeight: 1000 }}>
                {formatCurrencyAmount(setting.value, setting.unit)}
              </div>
              <button className="mini-btn sub" type="button">
                자동
              </button>
            </div>
          </div>
        ))}

        <div className="section-title" style={{ marginTop: 4 }}>
          <h2>현재 운영 기준 자동 산출</h2>
          <span className="pill">실시간 변경</span>
        </div>
        <div className="employee-board">
          <div className="employee-card" style={{ background: "#eff6ff", borderColor: "#bfdbfe" }}>
            <div className="employee-top">
              <div className="employee-name">
                <strong>현재 활성 직원</strong>
                <span>최근 7일 접속 + 승인완료 기준</span>
              </div>
              <div className="status-pill">{formatNumber(economy.activeEmployeeCount)}명</div>
            </div>
            <div className="employee-progress">
              <div className="metric-box done">
                <label>참여율</label>
                <strong>{economy.participationRatePct}%</strong>
              </div>
              <div className="metric-box done">
                <label>예상 이용</label>
                <strong>{formatNumber(economy.estimatedMonthlyHits)}</strong>
              </div>
              <div className="metric-box warn">
                <label>월지급</label>
                <strong>{formatKrw(economy.estimatedMonthlyPayoutKrw)}</strong>
              </div>
              <div className="metric-box done">
                <label>안정도</label>
                <strong>{riskLabel}</strong>
              </div>
            </div>
            <div className="small-text">직원 수 증가 시 포인트 기대값과 이벤트 보상 확률이 자동 조정됩니다.</div>
          </div>
        </div>
      </section>

      <section className="admin-table-card">
        <div className="section-title">
          <h2>자동 조정 결과</h2>
          <span className="pill">현재 추천값</span>
        </div>
        <div className="setting-list">
          {economy.results.map((result) => (
            <div className="setting-row" key={result.id}>
              <div>
                <strong>{result.label}</strong>
                <span>{result.description}</span>
              </div>
              <div className="setting-value">{result.value}</div>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}

function EmployeeCard({
  employee,
  onModal
}: {
  employee: AdminConfig["employees"][number];
  onModal: (title: string) => void;
}) {
  return (
    <div className="employee-card">
      <div className="employee-top">
        <div className="employee-name">
          <strong>{employee.name}</strong>
          <span>
            {employee.branchName} · 입사 D+{employee.onboardingDay} · Lv.{employee.swordLevel}
          </span>
        </div>
        <div className={`status-pill ${employee.statusTone}`}>{employee.statusLabel}</div>
      </div>
      <div className="employee-progress">
        {employee.metrics.map((metric) => (
          <div className={`metric-box ${metric.tone}`} key={metric.label}>
            <label>{metric.label}</label>
            <strong>{metric.value}</strong>
          </div>
        ))}
      </div>
      <div className="employee-foot">
        <span className="small-text">{employee.footnote}</span>
        <button className={`mini-btn${employee.statusTone === "good" ? " sub" : ""}`} onClick={() => onModal(`${employee.name} 상세`)} type="button">
          상세
        </button>
      </div>
    </div>
  );
}
