import { useEffect, useState } from "react";

import type { HiddenRewardCandidate, SwordLevelPreview } from "@/types/uquest";

export function AdminModal({
  title,
  body,
  onClose
}: {
  title: string | null;
  body?: string;
  onClose: () => void;
}) {
  return (
    <div className={`modal${title ? " show" : ""}`} id="adminModal">
      <div className="modal-card">
        <h2>{title ?? "상세"}</h2>
        <p>{body ?? "실제 서비스에서는 이 영역에서 상세 데이터 조회, 수정, 승인, 드래그 정렬, API 재전송 기능이 연결됩니다."}</p>
        <button className="modal-close" onClick={onClose} type="button">
          닫기
        </button>
      </div>
    </div>
  );
}

export function SuccessOverlay({
  current,
  next,
  onClose
}: {
  current: SwordLevelPreview | null;
  next: SwordLevelPreview | null;
  onClose: () => void;
}) {
  return (
    <div className={`success-overlay${current && next ? " show" : ""}`} id="successOverlay">
      <div className="success-card">
        <div className="success-icon">⚔️</div>
        <h2>강화 성공!</h2>
        {current && next ? (
          <>
            <p>
              {next.name}으로 성장했어요.
              <br />
              코인 경제에는 영향을 주지 않아요.
            </p>
            <div className="success-result">
              <div>
                <label>레벨</label>
                <strong>
                  {current.label} → {next.label}
                </strong>
              </div>
              <div>
                <label>외형</label>
                <strong>{next.name}</strong>
              </div>
              <div>
                <label>경제 영향</label>
                <strong>없음</strong>
              </div>
            </div>
          </>
        ) : null}
        <button className="success-btn" onClick={onClose} type="button">
          확인
        </button>
      </div>
    </div>
  );
}

export function HiddenRewardOverlay({
  open,
  rolling,
  reward,
  onClose,
  onRoll
}: {
  open: boolean;
  rolling: boolean;
  reward: HiddenRewardCandidate | null;
  onClose: () => void;
  onRoll: () => void;
}) {
  return (
    <div className={`hidden-overlay${open ? " show" : ""}`} id="hiddenOverlay">
      <div className="box-card">
        <div className="box-top">HIDDEN REWARD BOX</div>
        <div className="mystery-box-wrap">
          <div className={`mystery-box${rolling ? " shake" : ""}${reward ? " open" : ""}`} id="mysteryBox">
            <div className="box-lid" />
            <div className="box-body">
              <div className="box-ribbon-v" />
              <div className="box-ribbon-h" />
            </div>
            <div className="reward-burst">{reward?.icon ?? "☕"}</div>
          </div>
        </div>
        <div className="box-result">
          <label>획득 보상</label>
          <strong>{reward?.title ?? "???"}</strong>
          <div className="box-rarity">{reward?.rarity ?? "SPECIAL REWARD"}</div>
        </div>
        <div className="box-actions">
          <button className="box-close" onClick={onClose} type="button">
            닫기
          </button>
          <button className="box-open" disabled={rolling} onClick={onRoll} type="button">
            박스 열기
          </button>
        </div>
      </div>
    </div>
  );
}

export function MissionItemModal({
  groupTitle,
  open,
  onClose,
  onSubmit
}: {
  groupTitle: string;
  open: boolean;
  onClose: () => void;
  onSubmit: (mission: { title: string; rewardTicket: number; icon: string }) => void;
}) {
  const [title, setTitle] = useState("");
  const [rewardTicket, setRewardTicket] = useState(10);
  const [icon, setIcon] = useState("✅");

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setRewardTicket(10);
    setIcon("✅");
  }, [open]);

  function submit() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    onSubmit({
      title: trimmedTitle,
      rewardTicket,
      icon
    });
  }

  return (
    <div className={`modal${open ? " show" : ""}`}>
      <div className="modal-card">
        <h2>{groupTitle} 항목 추가</h2>
        <p>로컬 테스트용 미션을 추가합니다. 저장하면 홈 온보딩과 관리자 미션 목록에 바로 반영됩니다.</p>
        <div style={{ display: "grid", gap: 10, marginTop: 14, textAlign: "left" }}>
          <label className="small-text" htmlFor="missionIcon">
            아이콘
          </label>
          <input
            id="missionIcon"
            onChange={(event) => setIcon(event.target.value)}
            style={fieldStyle}
            value={icon}
          />
          <label className="small-text" htmlFor="missionTitle">
            미션명
          </label>
          <input
            id="missionTitle"
            onChange={(event) => setTitle(event.target.value)}
            placeholder="예: 유니폼 착용 확인"
            style={fieldStyle}
            value={title}
          />
          <label className="small-text" htmlFor="missionReward">
            지급 타격권
          </label>
          <input
            id="missionReward"
            max={100}
            min={1}
            onChange={(event) => setRewardTicket(Number(event.target.value))}
            style={fieldStyle}
            type="number"
            value={rewardTicket}
          />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16 }}>
          <button className="modal-close" onClick={onClose} type="button">
            닫기
          </button>
          <button className="modal-close" disabled={!title.trim()} onClick={submit} type="button">
            추가
          </button>
        </div>
      </div>
    </div>
  );
}

export function MissionGroupModal({
  open,
  onClose,
  onSubmit
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (group: { title: string; icon: string }) => void;
}) {
  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState("📌");

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setIcon("📌");
  }, [open]);

  function submit() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    onSubmit({
      title: trimmedTitle,
      icon
    });
  }

  return (
    <div className={`modal${open ? " show" : ""}`}>
      <div className="modal-card">
        <h2>미션 묶음 추가</h2>
        <p>홈 온보딩에 새 미션 묶음을 추가합니다. 정식 저장은 추후 Supabase 관리자 저장 기능으로 연결됩니다.</p>
        <div style={{ display: "grid", gap: 10, marginTop: 14, textAlign: "left" }}>
          <label className="small-text" htmlFor="groupIcon">
            아이콘
          </label>
          <input id="groupIcon" onChange={(event) => setIcon(event.target.value)} style={fieldStyle} value={icon} />
          <label className="small-text" htmlFor="groupTitle">
            묶음명
          </label>
          <input
            id="groupTitle"
            onChange={(event) => setTitle(event.target.value)}
            placeholder="예: 첫날 필수 교육"
            style={fieldStyle}
            value={title}
          />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16 }}>
          <button className="modal-close" onClick={onClose} type="button">
            닫기
          </button>
          <button className="modal-close" disabled={!title.trim()} onClick={submit} type="button">
            추가
          </button>
        </div>
      </div>
    </div>
  );
}

const fieldStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  fontSize: 16,
  fontWeight: 800,
  padding: "12px 14px",
  width: "100%"
};
