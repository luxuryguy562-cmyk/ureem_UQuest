import { useState } from "react";

import { MiniAvatar, TreeArt } from "@/components/uquest/pixel-art";
import { formatNumber } from "@/lib/format";
import type { TreeStateConfig } from "@/types/uquest";

type TreeRuntime = {
  hitKey: number;
  history: Array<{ id: string; icon: string; title: string; amountLabel: string }>;
};

type TreeHitResult =
  | { ok: true; coin: number; hiddenDropped: boolean; scrollDropped: boolean }
  | { ok: false; message: string };

export function TreeScreen({
  active,
  tree,
  onHit
}: {
  active: boolean;
  tree: TreeStateConfig;
  onHit: () => TreeHitResult;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [runtime, setRuntime] = useState<TreeRuntime>({
    hitKey: 0,
    history: []
  });

  function addHistory(icon: string, title: string, amountLabel: string, hitKey: number) {
    return [
      { id: `${title}-${hitKey}-${Date.now()}`, icon, title, amountLabel },
      ...runtime.history
    ].slice(0, 10);
  }

  function hitTree() {
    const result = onHit();

    if (!result.ok) {
      setRuntime((current) => ({
        ...current,
        history: [{ id: `notice-${Date.now()}`, icon: "!", title: "안내", amountLabel: result.message }, ...current.history].slice(0, 10)
      }));
      return;
    }

    const hitKey = runtime.hitKey + 1;

    let history = addHistory("🪙", "코인", `+${result.coin}`, hitKey);
    if (result.hiddenDropped) history = [{ id: `hidden-${hitKey}`, icon: "💎", title: "히든", amountLabel: "+1" }, ...history];
    if (result.scrollDropped) history = [{ id: `scroll-${hitKey}`, icon: "📜", title: "주문서", amountLabel: "+1" }, ...history];

    setRuntime({
      hitKey,
      history
    });
  }

  return (
    <main className={`screen${active ? " active" : ""}`} id="treeScreen">
      <div className="topbar">
        <div>
          <div className="top-sub" style={{ color: "#10b981" }}>
            <span className="dot" style={{ background: "#10b981" }} />
            보상 연타 가능
          </div>
          <h1>나무 때리기</h1>
        </div>
        <div className="setting">⚙️</div>
      </div>

      <section className="tree-hud">
        <div className="hud-main">
          <MiniAvatar />
          <div>
            <div className="weapon-line">
              <strong>{tree.swordLevelLabel}</strong>
              <div className="hidden-badge">히든확률 {tree.hiddenChancePct}%</div>
            </div>
            <div className="wallet-line">
              <div className="wallet-title-small">보유 재화</div>
              <div className="wallet-items-line">
                <span>
                  🪙 <b>{formatNumber(tree.totalCoin)}</b>
                </span>
                <span>
                  💎 <b>{tree.hiddenCoin}</b>
                </span>
                <span>
                  📜 <b>{tree.scroll}</b>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="tree-card">
        <div className="tree-card-head">
          <div className="ticket-pill">
            <label>타격권</label>
            <strong>{tree.remainingTicket}</strong>
          </div>
          <div className="today-inline">
            <strong>오늘 획득</strong>
            <div className="today-inline-right">
              <div className="today-chip">
                <label>🪙</label>
                <strong>+{formatNumber(tree.todayCoin)}</strong>
              </div>
              <div className="today-chip">
                <label>💎</label>
                <strong>{tree.todayHiddenCoin}</strong>
              </div>
              <div className="today-chip">
                <label>📜</label>
                <strong>{tree.todayScroll}</strong>
              </div>
            </div>
          </div>
          <div className="last-inline" onClick={() => setDrawerOpen((current) => !current)} role="button" tabIndex={0}>
            <span>방금 획득</span>
            <strong>{tree.lastRewardLabel}</strong>
          </div>
        </div>
        <div className="tree-stage">
          <div className={`coin-pop c1${runtime.hitKey % 3 === 1 ? " show" : ""}`} key={`coin1-${runtime.hitKey}`}>
            🪙
          </div>
          <div className={`coin-pop c2${runtime.hitKey % 3 === 2 ? " show" : ""}`} key={`coin2-${runtime.hitKey}`}>
            🪙
          </div>
          <div className={`coin-pop c3${runtime.hitKey % 3 === 0 ? " show" : ""}`} key={`coin3-${runtime.hitKey}`}>
            🪙
          </div>
          <div className={`floating-reward${runtime.hitKey ? " show" : ""}`} key={`reward-${runtime.hitKey}`}>
            {tree.lastRewardLabel}
          </div>
          <div className={`sword-swipe${runtime.hitKey ? " show" : ""}`} key={`swipe-${runtime.hitKey}`} />
          <TreeArt hitKey={runtime.hitKey} />
          <div className="ground-tree" />
        </div>
        <div className="tree-card-bottom">
          <div className={`history-drawer${drawerOpen ? " open" : ""}`}>
            {runtime.history.map((item) => (
              <div className="log-item" key={item.id}>
                {item.icon} {item.title} <b>{item.amountLabel}</b>
              </div>
            ))}
          </div>
          <button className="tap-btn" disabled={tree.remainingTicket <= 0} onClick={hitTree} type="button">
            {tree.remainingTicket <= 0 ? "타격권 없음" : "🌲 TAP! TAP! TAP!"}
          </button>
        </div>
      </section>
    </main>
  );
}
