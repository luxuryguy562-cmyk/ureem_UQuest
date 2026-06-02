import { useState } from "react";

import { PixelSword } from "@/components/uquest/pixel-art";
import { formatNumber } from "@/lib/format";
import type { SwordUpgradeConfig, UserProfile } from "@/types/uquest";

export function SwordScreen({
  active,
  sword,
  user,
  onUpgrade
}: {
  active: boolean;
  sword: SwordUpgradeConfig;
  user: UserProfile;
  onUpgrade: () => void;
}) {
  const [upgrading, setUpgrading] = useState(false);
  const current = sword.current;
  const next = sword.next;
  const coin = user.wallet.find((currency) => currency.id === "coin")?.amount ?? 0;
  const isMaxLevel = current.level >= sword.maxLevel;
  const hasMaterials = coin >= sword.requiredCoin;
  const hasSxp = user.sxp >= sword.requiredSxp;
  const canUpgrade = !isMaxLevel && hasMaterials && hasSxp;

  function upgrade() {
    if (!canUpgrade) return;

    setUpgrading(true);
    window.setTimeout(() => {
      setUpgrading(false);
      onUpgrade();
    }, 900);
  }

  return (
    <main className={`screen${active ? " active" : ""}`} id="swordScreen">
      <div className="topbar">
        <div>
          <div className="top-sub">
            <span className="dot" />
            외형 성장
          </div>
          <h1>검 성장</h1>
        </div>
        <div className="setting">⚙️</div>
      </div>

      <section className="wallet">
        <div className="wallet-title">보유 재화</div>
        <div className="wallet-items">
          {user.wallet.map((currency) => (
            <span key={currency.id}>
              {currency.icon} <b>{formatNumber(currency.amount)}</b>
            </span>
          ))}
        </div>
      </section>

      <section className="stage">
        <div className="level-panel">
          <div className="level-card before">
            <label>현재</label>
            <strong>{current.label}</strong>
          </div>
          <div className="arrow">→</div>
          <div className="level-card after">
            <label>강화 후</label>
            <strong>{next.label}</strong>
          </div>
        </div>
        <div className="sword-zone">
          <div className="glow" />
          <PixelSword upgrading={upgrading} />
        </div>
            <div className="sword-name">
          <h2>{current.name}</h2>
          <p>검은 보상 경제와 분리된 외형 성장입니다</p>
        </div>
        <div className="effect-grid">
          <div className="effect-main">
            <label>✨ 외형 변화</label>
            <strong>
              {current.name} → {next.name}
            </strong>
          </div>
          <div className="effect-sub-row">
            <div className="effect-sub">
              <label>⚡ 타격 연출</label>
              <strong>강화</strong>
            </div>
            <div className="effect-sub">
              <label>🪙 코인 영향</label>
              <strong>없음</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="upgrade-card">
        <div className="upgrade-head">
          <h2>강화 준비</h2>
          <div className="safe-badge">{sword.noFailLabel}</div>
        </div>
        <div className="cost-row">
          <div className="cost">
            <label>필요 골드</label>
            <strong>🪙 {formatNumber(sword.requiredCoin)}</strong>
          </div>
          <div className="cost">
            <label>필요 SXP</label>
            <strong>{formatNumber(sword.requiredSxp)}</strong>
          </div>
          <div className="cost">
            <label>성공률</label>
            <strong>{sword.successRatePct}%</strong>
          </div>
        </div>
        <button className="upgrade-btn" disabled={upgrading || !canUpgrade} onClick={upgrade} type="button">
          {isMaxLevel ? "최대 레벨" : upgrading ? "강화 중..." : canUpgrade ? "⚔️ 강화하기" : hasMaterials ? "SXP 부족" : "재료 부족"}
        </button>
      </section>
    </main>
  );
}
