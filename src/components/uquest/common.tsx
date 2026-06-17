import { formatNumber } from "@/lib/format";
import type { ReactNode } from "react";
import type { CurrencySnapshot, ScreenKey } from "@/types/uquest";

export function TopBar({
  eyebrow,
  title,
  tone = "#2563eb",
  actions
}: {
  eyebrow: string;
  title: string;
  tone?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="topbar">
      <div>
        <div className="top-sub" style={{ color: tone }}>
          <span className="dot" style={{ background: tone }} />
          {eyebrow}
        </div>
        <h1>{title}</h1>
      </div>
      {actions}
    </div>
  );
}

export function CircleButton({
  label,
  onClick,
  variant = "dark"
}: {
  label: string;
  onClick?: () => void;
  variant?: "dark" | "light";
}) {
  return (
    <button className={variant === "dark" ? "circle-btn" : "setting"} onClick={onClick} type="button">
      {label}
    </button>
  );
}

export function SectionTitle({ title, badge }: { title: string; badge?: string }) {
  return (
    <div className="section-title">
      <h2>{title}</h2>
      {badge ? <span className="pill">{badge}</span> : null}
    </div>
  );
}

export function Wallet({ currencies }: { currencies: CurrencySnapshot[] }) {
  return (
    <section className="wallet">
      <div className="wallet-title">보유 포인트</div>
      <div className="wallet-items">
        {currencies.map((currency) => (
          <span key={currency.id}>
            {currency.icon} <b>{formatNumber(currency.amount)}</b>
          </span>
        ))}
      </div>
    </section>
  );
}

export function CurrencyGrid({ currencies }: { currencies: CurrencySnapshot[] }) {
  return (
    <section className={`currency-grid${currencies.length <= 2 ? " compact" : ""}`}>
      {currencies.map((currency) => (
        <div className="currency" key={currency.id}>
          <div className={`coin-icon ${currency.tone}`}>{currency.icon}</div>
          <div>
            <label>{currency.label}</label>
            <strong>{formatNumber(currency.amount)}</strong>
          </div>
        </div>
      ))}
    </section>
  );
}

export function ProductRow({
  icon,
  title,
  description,
  actionLabel,
  hidden,
  onClick
}: {
  icon: string;
  title: string;
  description: string;
  actionLabel: string;
  hidden?: boolean;
  onClick?: () => void;
}) {
  return (
    <div className={`product${hidden ? " hidden-product" : ""}`}>
      <div className="product-icon">{icon}</div>
      <div className="product-info">
        <strong>{title}</strong>
        <span>{description}</span>
      </div>
      <button className="get-btn" onClick={onClick} type="button">
        {actionLabel}
      </button>
    </div>
  );
}

export function BottomNavigation({
  active,
  onGo,
  hidden
}: {
  active: ScreenKey;
  onGo: (screen: ScreenKey) => void;
  hidden: boolean;
}) {
  if (hidden) return null;

  const items: Array<{ screen: ScreenKey; icon: string; label: string; tree?: boolean }> = [
    { screen: "home", icon: "⌂", label: "홈" },
    { screen: "profile", icon: "👤", label: "내현황" },
    { screen: "tree", icon: "P", label: "적립", tree: true },
    { screen: "sword", icon: "↗", label: "성장" },
    { screen: "shop", icon: "▤", label: "보상" }
  ];

  return (
    <nav className="bottom-nav">
      {items.map((item) => (
        <div
          className={`nav-item${item.tree ? " nav-tree" : ""}${active === item.screen ? " active" : ""}`}
          key={item.screen}
          onClick={() => onGo(item.screen)}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") onGo(item.screen);
          }}
        >
          {item.tree ? <div className="tree-fab">{item.icon}</div> : <div className="nav-icon">{item.icon}</div>}
          <div>{item.label}</div>
        </div>
      ))}
    </nav>
  );
}
