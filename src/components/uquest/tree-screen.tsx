import { useState } from "react";

import { MiniAvatar, RewardBoardArt } from "@/components/uquest/pixel-art";
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
  const lastRewardLabel = tree.lastRewardLabel === "아직 이용 전" ? "없음" : tree.lastRewardLabel;
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

    let history = addHistory("P", "포인트", `+${result.coin}`, hitKey);
    if (result.hiddenDropped) history = [{ id: `hidden-${hitKey}`, icon: "★", title: "스페셜", amountLabel: "+1" }, ...history];
    if (result.scrollDropped) history = [{ id: `scroll-${hitKey}`, icon: "↗", title: "성장권", amountLabel: "+1" }, ...history];

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
            리워드 기회 사용
          </div>
          <h1>포인트 적립</h1>
        </div>
        <div className="setting">⚙️</div>
      </div>

      <section className="tree-hud">
        <div className="hud-main">
          <MiniAvatar />
          <div>
            <div className="weapon-line">
              <strong>보유 포인트</strong>
              <div className="hidden-badge">랜덤 적립</div>
            </div>
            <div className="wallet-line">
              <div className="wallet-title-small">현재 교환 가능 포인트</div>
              <div className="wallet-items-line">
                <span>
                  P <b>{formatNumber(tree.totalCoin)}</b>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="tree-card">
        <div className="tree-card-head">
          <div className="ticket-pill">
            <label>남은 기회</label>
            <strong>{tree.remainingTicket}회</strong>
          </div>
          <div className="today-inline">
            <strong>오늘 포인트</strong>
            <div className="today-inline-right">
              <div className="today-chip">
                <label>P</label>
                <strong>+{formatNumber(tree.todayCoin)}</strong>
              </div>
            </div>
          </div>
          <div className="last-inline" onClick={() => setDrawerOpen((current) => !current)} role="button" tabIndex={0}>
            <span>마지막 적립</span>
            <strong>{lastRewardLabel}</strong>
          </div>
        </div>
        <div className="tree-stage">
          <div className={`coin-pop c1${runtime.hitKey % 3 === 1 ? " show" : ""}`} key={`coin1-${runtime.hitKey}`}>
            P
          </div>
          <div className={`coin-pop c2${runtime.hitKey % 3 === 2 ? " show" : ""}`} key={`coin2-${runtime.hitKey}`}>
            P
          </div>
          <div className={`coin-pop c3${runtime.hitKey % 3 === 0 ? " show" : ""}`} key={`coin3-${runtime.hitKey}`}>
            P
          </div>
          <div className={`floating-reward${runtime.hitKey ? " show" : ""}`} key={`reward-${runtime.hitKey}`}>
            {lastRewardLabel}
          </div>
          <div className={`sword-swipe${runtime.hitKey ? " show" : ""}`} key={`swipe-${runtime.hitKey}`} />
          <RewardBoardArt hitKey={runtime.hitKey} />
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
            {tree.remainingTicket <= 0 ? "남은 기회 없음" : "기회 1회 사용"}
          </button>
        </div>
      </section>
    </main>
  );
}
