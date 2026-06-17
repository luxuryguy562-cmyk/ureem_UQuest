export function MiniAvatar() {
  return (
    <div className="avatar-mini">
      <div className="mini-head" />
      <div className="mini-body" />
      <div className="mini-badge" />
    </div>
  );
}

export function RewardBoardArt({ hitKey }: { hitKey: number }) {
  return (
    <div className={`reward-board-art${hitKey ? " pulse" : ""}`} key={`reward-board-${hitKey}`}>
      <div className="reward-board-top">
        <span>오늘 적립</span>
        <strong>POINT</strong>
      </div>
      <div className="reward-board-meter">
        <div />
      </div>
      <div className="reward-board-list">
        <span />
        <span />
        <span />
      </div>
      <div className="reward-board-badge">P</div>
    </div>
  );
}
