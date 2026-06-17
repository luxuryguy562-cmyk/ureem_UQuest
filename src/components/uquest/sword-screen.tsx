import { useState } from "react";

import { formatNumber } from "@/lib/format";
import type { SwordUpgradeConfig, UserProfile } from "@/types/uquest";

const growthRoadmap = [
  { level: 1, name: "입장 완료", week: "1일차", sxp: 0 },
  { level: 2, name: "명찰 장착", week: "1주차", sxp: 20 },
  { level: 3, name: "루틴 러너", week: "2주차", sxp: 45 },
  { level: 4, name: "매장 탐험가", week: "3주차", sxp: 80 },
  { level: 5, name: "응대 견습", week: "4주차", sxp: 130 },
  { level: 6, name: "AX/DX 파일럿", week: "5주차", sxp: 200 },
  { level: 7, name: "피크타임 생존자", week: "6주차", sxp: 300 },
  { level: 8, name: "세일즈 메이커", week: "7주차", sxp: 420 },
  { level: 9, name: "실전 에이스", week: "8주차", sxp: 560 },
  { level: 10, name: "온보딩 클리어", week: "2개월", sxp: 720 }
];

export function SwordScreen({
  active,
  sword,
  user
}: {
  active: boolean;
  sword: SwordUpgradeConfig;
  user: UserProfile;
}) {
  const [roadmapOpen, setRoadmapOpen] = useState(false);
  const current = sword.current;
  const next = sword.next;
  const isMaxLevel = current.level >= sword.maxLevel;
  const requiredSxp = Math.max(1, sword.requiredSxp);
  const progressPct = isMaxLevel ? 100 : Math.min(100, Math.round((user.sxp / requiredSxp) * 100));
  const remainingSxp = Math.max(0, sword.requiredSxp - user.sxp);

  return (
    <main className={`screen${active ? " active" : ""}`} id="swordScreen">
      <div className="topbar">
        <div>
          <div className="top-sub">
            <span className="dot" />
            온보딩 성장
          </div>
          <h1>성장 단계</h1>
        </div>
        <div className="setting">⚙️</div>
      </div>

      <section className="growth-card">
        <div className="growth-compact">
          <div className="growth-rank">
            <span>Lv.</span>
            <strong>{current.level}</strong>
          </div>
          <div className="growth-summary">
            <label>{current.name}</label>
            <strong>{isMaxLevel ? "온보딩 클리어" : `${formatNumber(remainingSxp)} XP to ${next.name}`}</strong>
          </div>
          <button className="roadmap-button" onClick={() => setRoadmapOpen((open) => !open)} type="button">
            {roadmapOpen ? "접기" : "로드맵"}
          </button>
        </div>
        <div className="growth-meter">
          <span style={{ width: `${progressPct}%` }} />
        </div>
        <div className="growth-meta-row">
          <span>{formatNumber(user.sxp)} / {formatNumber(sword.requiredSxp)} XP</span>
          <span>2개월 플랜</span>
          <span>자동 성장</span>
        </div>
        {roadmapOpen ? (
          <div className="roadmap-list">
            {growthRoadmap.map((stage) => {
              const reached = user.sxp >= stage.sxp;
              const currentStage = current.level === stage.level;

              return (
                <div className={`roadmap-item${reached ? " reached" : ""}${currentStage ? " current" : ""}`} key={stage.level}>
                  <div className="roadmap-level">Lv.{stage.level}</div>
                  <div className="roadmap-info">
                    <strong>{stage.name}</strong>
                    <span>
                      {stage.week} · {formatNumber(stage.sxp)} XP
                    </span>
                  </div>
                  <div className="roadmap-state">{currentStage ? "NOW" : reached ? "OK" : "LOCK"}</div>
                </div>
              );
            })}
          </div>
        ) : null}
      </section>
    </main>
  );
}
