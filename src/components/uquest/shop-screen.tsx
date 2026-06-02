import { formatNumber } from "@/lib/format";
import type { RewardProduct, ShopConfig, UserProfile } from "@/types/uquest";

export function ShopScreen({
  active,
  shop,
  user,
  onOpenHiddenBox,
  onRedeem
}: {
  active: boolean;
  shop: ShopConfig;
  user: UserProfile;
  onOpenHiddenBox: () => void;
  onRedeem: (reward: RewardProduct) => void;
}) {
  const featured = shop.rewards.find((reward) => reward.id === shop.featuredRewardId);
  const regularRewards = shop.rewards
    .filter((reward) => !reward.featured)
    .sort((left, right) => left.sortOrder - right.sortOrder);

  return (
    <main className={`screen${active ? " active" : ""}`} id="shopScreen">
      <div className="topbar">
        <div>
          <div className="top-sub" style={{ color: "#f59e0b" }}>
            <span className="dot" style={{ background: "#f59e0b" }} />
            보상 교환 가능
          </div>
          <h1>교환 상점</h1>
        </div>
        <div className="setting">🏪</div>
      </div>

      <section className="wallet">
        <div className="wallet-title">보유 재화</div>
        <div className="wallet-items">
          {user.wallet
            .filter((currency) => currency.id !== "scroll")
            .map((currency) => (
              <span key={currency.id}>
                {currency.icon} <b>{formatNumber(currency.amount)}</b>
              </span>
            ))}
        </div>
      </section>

      <section className="shop-hero">
        <div className="shop-topline">TODAY&apos;S SPECIAL DEAL</div>
        <h2>{shop.headline}</h2>
        <p>{shop.description}</p>
        {featured ? <FeaturedReward onRedeem={onRedeem} reward={featured} /> : null}
      </section>

      <section className="card">
        <div className="section-title">
          <h2>일반 교환</h2>
          <span className="pill">즉시 지급</span>
        </div>
        <div className="shop-grid">
          {regularRewards.map((reward) => (
            <div className="shop-item" key={reward.id}>
              <div className="shop-item-icon">{reward.icon}</div>
              <strong>{reward.title}</strong>
              <span>{formatNumber(reward.cost)} 코인</span>
              <button className="shop-buy" onClick={() => onRedeem(reward)} type="button">
                {reward.actionLabel}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="secret-zone">
        <div className="secret-top">
          <h3>SECRET BOX</h3>
          <span>히든코인 전용</span>
        </div>
        <div className="secret-box-card">
          <div className="secret-box-icon">🎁</div>
          <div className="secret-box-info">
            <strong>{shop.hiddenBox.title}</strong>
            <p>{shop.hiddenBox.description}</p>
          </div>
        </div>
        <button className="secret-open-btn" onClick={onOpenHiddenBox} type="button">
          💎 {shop.hiddenBox.costHiddenCoin}개로 박스 열기
        </button>
      </section>
    </main>
  );
}

function FeaturedReward({ reward, onRedeem }: { reward: RewardProduct; onRedeem: (reward: RewardProduct) => void }) {
  return (
    <div className="featured-item">
      <div className="featured-icon">{reward.icon}</div>
      <div className="featured-info">
        <label>오늘 인기 보상</label>
        <strong>{reward.title}</strong>
        <span>{formatNumber(reward.cost)} 코인</span>
      </div>
      <button className="featured-btn" onClick={() => onRedeem(reward)} type="button">
        {reward.actionLabel}
      </button>
    </div>
  );
}
