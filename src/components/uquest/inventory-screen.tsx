import { CircleButton, ProductRow, SectionTitle, TopBar, Wallet } from "@/components/uquest/common";
import type { InventoryItem, UserProfile } from "@/types/uquest";

export function InventoryScreen({
  active,
  user,
  inventory
}: {
  active: boolean;
  user: UserProfile;
  inventory: InventoryItem[];
}) {
  return (
    <main className={`screen${active ? " active" : ""}`} id="inventoryScreen">
      <TopBar eyebrow="획득한 보상" title="보상함" tone="#f59e0b" actions={<CircleButton label="🎁" variant="light" />} />
      <Wallet currencies={user.wallet.filter((currency) => currency.id === "coin")} />
      <section className="card">
        <SectionTitle title="사용 가능 보상" badge={`${inventory.length}개 보유`} />
        {inventory.length ? (
          inventory.map((item) => (
            <ProductRow
              actionLabel={item.actionLabel}
              description={item.description}
              hidden={item.hidden}
              icon={item.icon}
              key={item.id}
              title={item.title}
            />
          ))
        ) : (
          <div className="small-text">아직 보유한 보상이 없어요. 미션을 완료하고 포인트를 모아보세요.</div>
        )}
      </section>
    </main>
  );
}
