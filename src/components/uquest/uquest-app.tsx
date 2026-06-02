"use client";

import { useState } from "react";

import { AdminScreen } from "@/components/uquest/admin-screen";
import { BottomNavigation } from "@/components/uquest/common";
import { HomeScreen } from "@/components/uquest/home-screen";
import { InventoryScreen } from "@/components/uquest/inventory-screen";
import { AdminModal, HiddenRewardOverlay, MissionGroupModal, MissionItemModal, SuccessOverlay } from "@/components/uquest/overlays";
import { ProfileScreen } from "@/components/uquest/profile-screen";
import { ShopScreen } from "@/components/uquest/shop-screen";
import { SwordScreen } from "@/components/uquest/sword-screen";
import { TreeScreen } from "@/components/uquest/tree-screen";
import type {
  AdminTabKey,
  AttendanceDay,
  CurrencySnapshot,
  HiddenRewardCandidate,
  InventoryItem,
  MissionGroup,
  RewardProduct,
  ScreenKey,
  SwordLevelPreview,
  UQuestAppConfig
} from "@/types/uquest";

export function UQuestApp({ config }: { config: UQuestAppConfig }) {
  const [data, setData] = useState<UQuestAppConfig>(() => cloneConfig(config));
  const [screen, setScreen] = useState<ScreenKey>("home");
  const [adminTab, setAdminTab] = useState<AdminTabKey>("dashboard");
  const [modal, setModal] = useState<{ title: string; body?: string } | null>(null);
  const [success, setSuccess] = useState<{ current: SwordLevelPreview; next: SwordLevelPreview } | null>(null);
  const [hiddenBoxOpen, setHiddenBoxOpen] = useState(false);
  const [hiddenRolling, setHiddenRolling] = useState(false);
  const [hiddenReward, setHiddenReward] = useState<HiddenRewardCandidate | null>(null);
  const [missionItemGroupId, setMissionItemGroupId] = useState<string | null>(null);
  const [missionGroupModalOpen, setMissionGroupModalOpen] = useState(false);

  function go(nextScreen: ScreenKey) {
    setScreen(nextScreen);
  }

  function showInfo(title: string, body?: string) {
    setModal({ title, body });
  }

  function claimAttendance() {
    const todayId = getTodayWeekdayId();

    if (data.attendanceWeek.some((day) => day.id === todayId && day.state === "done")) {
      showInfo("이미 출석 완료", "오늘 출석 보상은 이미 받았어요.");
      return;
    }

    const rewardTicket = 10;
    const rewardSxp = 5;

    setData((current) => {
      const nextSxp = current.user.sxp + rewardSxp;
      return {
        ...current,
        user: {
          ...current.user,
          sxp: nextSxp,
          nextLevelProgressPct: Math.min(100, nextSxp),
          onboardingProgressPct: Math.max(current.user.onboardingProgressPct, 5)
        },
        attendanceWeek: current.attendanceWeek.map((day) => (day.id === todayId ? { ...day, state: "done" } : day)),
        tree: {
          ...current.tree,
          remainingTicket: current.tree.remainingTicket + rewardTicket,
          lastRewardLabel: `🎟 +${rewardTicket}`
        },
        activities: addActivity(current.activities, {
          id: `attendance-${Date.now()}`,
          icon: "✅",
          title: "출석 완료",
          description: `타격권 ${rewardTicket}개와 SXP ${rewardSxp}를 받았어요.`,
          actionLabel: "확인"
        })
      };
    });

    showInfo("출석 완료", `타격권 ${rewardTicket}개와 SXP ${rewardSxp}를 받았어요. 이제 나무를 칠 수 있어요.`);
  }

  function completeMissionTask(groupId: string, taskId: string) {
    const targetGroup = data.missionGroups.find((group) => group.id === groupId);
    const targetTask = targetGroup?.tasks.find((task) => task.id === taskId);

    if (!targetGroup || !targetTask) return;

    if (targetTask.completed) {
      showInfo("이미 완료한 미션", "이 미션의 보상은 이미 받았어요.");
      return;
    }

    const rewardSxp = Math.max(3, Math.round(targetTask.rewardTicket / 5));

    setData((current) => {
      const missionGroups = current.missionGroups.map((group) => {
        if (group.id !== groupId) return group;

        const tasks = group.tasks.map((task) => (task.id === taskId ? { ...task, completed: true } : task));
        return summarizeMissionGroup({ ...group, tasks });
      });
      const nextSxp = current.user.sxp + rewardSxp;
      const totalTasks = missionGroups.reduce((sum, group) => sum + group.tasks.length, 0);
      const completedTasks = missionGroups.reduce((sum, group) => sum + group.tasks.filter((task) => task.completed).length, 0);

      return {
        ...current,
        user: {
          ...current.user,
          sxp: nextSxp,
          nextLevelProgressPct: Math.min(100, nextSxp),
          onboardingProgressPct: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : current.user.onboardingProgressPct,
          profileMetrics: incrementMetric(current.user.profileMetrics, "completed_mission", 1)
        },
        missionGroups,
        tree: {
          ...current.tree,
          remainingTicket: current.tree.remainingTicket + targetTask.rewardTicket,
          lastRewardLabel: `🎟 +${targetTask.rewardTicket}`
        },
        activities: addActivity(current.activities, {
          id: `mission-${taskId}-${Date.now()}`,
          icon: targetTask.icon,
          title: `${targetTask.title} 완료`,
          description: `타격권 ${targetTask.rewardTicket}개와 SXP ${rewardSxp}를 받았어요.`,
          actionLabel: "확인"
        })
      };
    });

    showInfo("미션 완료", `${targetTask.title} 완료. 타격권 ${targetTask.rewardTicket}개를 받았어요.`);
  }

  function hitTree() {
    if (data.tree.remainingTicket <= 0) {
      return { ok: false as const, message: "타격권이 없어요." };
    }

    const { coinMin, coinMax, hiddenDropChancePct, scrollDropChancePct } = data.tree.rewardRule;
    const coin = Math.floor(Math.random() * (coinMax - coinMin + 1)) + coinMin;
    const hiddenDropped = Math.random() * 100 < hiddenDropChancePct;
    const scrollDropped = Math.random() * 100 < scrollDropChancePct;
    const result = { ok: true as const, coin, hiddenDropped, scrollDropped };

    setData((current) => {
      if (current.tree.remainingTicket <= 0) return current;

      const nextWallet = updateWallet(
        updateWallet(updateWallet(current.user.wallet, "coin", coin), "hidden_coin", hiddenDropped ? 1 : 0),
        "scroll",
        scrollDropped ? 1 : 0
      );

      return {
        ...current,
        user: {
          ...current.user,
          sxp: current.user.sxp + 1,
          nextLevelProgressPct: Math.min(100, current.user.nextLevelProgressPct + 1),
          wallet: nextWallet,
          profileMetrics: incrementMetric(incrementMetric(current.user.profileMetrics, "monthly_coin", coin), "total_hits", 1)
        },
        tree: {
          ...current.tree,
          remainingTicket: current.tree.remainingTicket - 1,
          totalCoin: current.tree.totalCoin + coin,
          hiddenCoin: current.tree.hiddenCoin + (hiddenDropped ? 1 : 0),
          scroll: current.tree.scroll + (scrollDropped ? 1 : 0),
          todayCoin: current.tree.todayCoin + coin,
          todayHiddenCoin: current.tree.todayHiddenCoin + (hiddenDropped ? 1 : 0),
          todayScroll: current.tree.todayScroll + (scrollDropped ? 1 : 0),
          lastRewardLabel: `🪙 +${coin}`
        }
      };
    });

    return result;
  }

  function openHiddenBox() {
    const hiddenCoin = walletAmount(data.user.wallet, "hidden_coin");
    if (hiddenCoin < data.shop.hiddenBox.costHiddenCoin) {
      showInfo("히든코인 부족", `히든박스를 열려면 히든코인 ${data.shop.hiddenBox.costHiddenCoin}개가 필요해요.`);
      return;
    }

    setHiddenReward(null);
    setHiddenRolling(false);
    setHiddenBoxOpen(true);
  }

  function rollHiddenBox() {
    setHiddenRolling(true);
    window.setTimeout(() => {
      const reward = pickWeighted(data.shop.hiddenBox.candidates);
      setHiddenReward(reward);
      if (reward) {
        setData((current) => ({
          ...current,
          user: {
            ...current.user,
            wallet: updateWallet(current.user.wallet, "hidden_coin", -current.shop.hiddenBox.costHiddenCoin)
          },
          tree: {
            ...current.tree,
            hiddenCoin: Math.max(0, current.tree.hiddenCoin - current.shop.hiddenBox.costHiddenCoin)
          },
          inventory: addInventoryItem(current.inventory, {
            id: `hidden-${reward.id}-${Date.now()}`,
            icon: reward.icon,
            title: reward.title,
            description: `${reward.rarity} 히든 보상`,
            actionLabel: "보기",
            hidden: true
          })
        }));
      }
      setHiddenRolling(false);
    }, 900);
  }

  function upgradeSword() {
    const currentSword = data.sword.current;
    const nextSword = data.sword.next;
    const coin = walletAmount(data.user.wallet, "coin");
    const scroll = walletAmount(data.user.wallet, "scroll");

    if (currentSword.level >= data.sword.maxLevel) {
      showInfo("최대 레벨", `검은 현재 MVP 기준 Lv.${data.sword.maxLevel}까지 성장할 수 있어요.`);
      return;
    }

    if (data.user.sxp < data.sword.requiredSxp) {
      showInfo("SXP 부족", `강화 해금에는 SXP ${data.sword.requiredSxp}가 필요해요. 현재 SXP는 ${data.user.sxp}예요.`);
      return;
    }

    if (coin < data.sword.requiredCoin || scroll < data.sword.requiredScroll) {
      const scrollText = data.sword.requiredScroll > 0 ? `와 주문서 ${data.sword.requiredScroll}개` : "";
      showInfo("재료 부족", `강화에는 골드 ${data.sword.requiredCoin}개${scrollText}가 필요해요.`);
      return;
    }

    setData((current) => {
      const upgradedSword = current.sword.next;
      const followingLevel = Math.min(current.sword.maxLevel, upgradedSword.level + 1);
      const followingRequirement = getSwordRequirement(followingLevel);
      const followingNext = createSwordPreview(followingLevel);

      return {
        ...current,
        user: {
          ...current.user,
          wallet: updateWallet(updateWallet(current.user.wallet, "coin", -current.sword.requiredCoin), "scroll", -current.sword.requiredScroll)
        },
        tree: {
          ...current.tree,
          totalCoin: Math.max(0, current.tree.totalCoin - current.sword.requiredCoin),
          scroll: Math.max(0, current.tree.scroll - current.sword.requiredScroll),
          swordLevelLabel: `${upgradedSword.label} 검`
        },
        sword: {
          ...current.sword,
          current: upgradedSword,
          next: followingNext,
          requiredCoin: followingRequirement.coin,
          requiredScroll: followingRequirement.scroll,
          requiredSxp: followingRequirement.sxp
        },
        activities: addActivity(current.activities, {
          id: `sword-${Date.now()}`,
          icon: "⚔️",
          title: `${upgradedSword.label} 달성`,
          description: `${upgradedSword.name}으로 강화했어요.`,
          actionLabel: "상세"
        })
      };
    });

    setSuccess({ current: currentSword, next: nextSword });
  }

  function redeemReward(reward: RewardProduct) {
    const balance = walletAmount(data.user.wallet, reward.currencyId);
    if (balance < reward.cost) {
      showInfo("코인이 부족해요", `${reward.title} 교환에는 ${reward.cost.toLocaleString("ko-KR")} 코인이 필요해요.`);
      return;
    }

    setData((current) => ({
      ...current,
      user: {
        ...current.user,
        wallet: updateWallet(current.user.wallet, reward.currencyId, -reward.cost)
      },
      tree: {
        ...current.tree,
        totalCoin: reward.currencyId === "coin" ? Math.max(0, current.tree.totalCoin - reward.cost) : current.tree.totalCoin,
        hiddenCoin: reward.currencyId === "hidden_coin" ? Math.max(0, current.tree.hiddenCoin - reward.cost) : current.tree.hiddenCoin
      },
      inventory: addInventoryItem(current.inventory, {
        id: `reward-${reward.id}-${Date.now()}`,
        icon: reward.icon,
        title: reward.title,
        description: "교환 완료 · 사용 가능",
        actionLabel: "보기"
      })
    }));

    showInfo("교환 완료", `${reward.title}이 보상함에 들어갔어요.`);
  }

  function toggleMissionGroup(groupId: string) {
    setData((current) => ({
      ...current,
      missionGroups: current.missionGroups.map((group) =>
        group.id === groupId ? summarizeMissionGroup({ ...group, expanded: !group.expanded }) : group
      )
    }));
  }

  function addMissionItem(mission: { title: string; rewardTicket: number; icon: string }) {
    const targetGroup = data.missionGroups.find((group) => group.id === missionItemGroupId);
    if (!targetGroup) return;

    const rewardTicket = Math.max(1, Math.round(mission.rewardTicket || 1));
    const task = {
      id: `custom-task-${Date.now()}`,
      icon: mission.icon.trim() || "✅",
      title: mission.title,
      completed: false,
      rewardTicket,
      sortOrder: targetGroup.tasks.length + 1,
      sourceLabel: "로컬 테스트"
    };

    setData((current) => ({
      ...current,
      missionGroups: current.missionGroups.map((group) => {
        if (group.id !== targetGroup.id) return group;

        return summarizeMissionGroup({
          ...group,
          expanded: true,
          tasks: [...group.tasks, task]
        });
      })
    }));
    setMissionItemGroupId(null);
    showInfo("미션 항목 추가", `${targetGroup.title} 묶음에 "${mission.title}" 미션을 추가했어요.`);
  }

  function addMissionGroup(group: { title: string; icon: string }) {
    const missionGroup: MissionGroup = {
      id: `custom-group-${Date.now()}`,
      icon: group.icon.trim() || "📌",
      title: group.title,
      completedCount: 0,
      totalCount: 0,
      statusLabel: "0 / 0 ▲",
      expanded: true,
      tasks: []
    };

    setData((current) => ({
      ...current,
      missionGroups: [...current.missionGroups, missionGroup]
    }));
    setMissionGroupModalOpen(false);
    showInfo("미션 묶음 추가", `"${group.title}" 묶음을 추가했어요. 이제 이 묶음에 항목을 넣을 수 있어요.`);
  }

  const activeMissionGroup = missionItemGroupId ? data.missionGroups.find((group) => group.id === missionItemGroupId) ?? null : null;

  return (
    <div className="phone" data-config-source={data.source}>
      <HomeScreen
        active={screen === "home"}
        attendanceWeek={data.attendanceWeek}
        missionGroups={data.missionGroups}
        onGo={go}
        onAttendance={claimAttendance}
        onMissionGroupToggle={toggleMissionGroup}
        onMissionTask={completeMissionTask}
        sword={data.sword}
        user={data.user}
      />
      <ProfileScreen
        active={screen === "profile"}
        activities={data.activities}
        calendarDays={data.calendarDays}
        inventory={data.inventory}
        monthLabel={data.calendarMonthLabel}
        onGo={go}
        sword={data.sword}
        user={data.user}
      />
      <InventoryScreen active={screen === "inventory"} inventory={data.inventory} user={data.user} />
      <TreeScreen active={screen === "tree"} onHit={hitTree} tree={data.tree} />
      <SwordScreen
        active={screen === "sword"}
        onUpgrade={upgradeSword}
        sword={data.sword}
        user={data.user}
      />
      <ShopScreen active={screen === "shop"} onOpenHiddenBox={openHiddenBox} onRedeem={redeemReward} shop={data.shop} user={data.user} />
      <AdminScreen
        active={screen === "admin"}
        activeTab={adminTab}
        admin={data.admin}
        missionGroups={data.missionGroups}
        onGo={go}
        onModal={(title) => showInfo(title)}
        onAddMissionGroup={() => setMissionGroupModalOpen(true)}
        onAddMissionItem={(groupId) => setMissionItemGroupId(groupId)}
        onTabChange={setAdminTab}
        rewards={data.shop.rewards}
      />

      <BottomNavigation active={screen} hidden={screen === "admin"} onGo={go} />
      <SuccessOverlay current={success?.current ?? null} next={success?.next ?? null} onClose={() => setSuccess(null)} />
      <AdminModal body={modal?.body} onClose={() => setModal(null)} title={modal?.title ?? null} />
      <MissionItemModal
        groupTitle={activeMissionGroup?.title ?? "미션"}
        onClose={() => setMissionItemGroupId(null)}
        onSubmit={addMissionItem}
        open={Boolean(activeMissionGroup)}
      />
      <MissionGroupModal
        onClose={() => setMissionGroupModalOpen(false)}
        onSubmit={addMissionGroup}
        open={missionGroupModalOpen}
      />
      <HiddenRewardOverlay
        onClose={() => {
          setHiddenBoxOpen(false);
          setHiddenRolling(false);
        }}
        onRoll={rollHiddenBox}
        open={hiddenBoxOpen}
        reward={hiddenReward}
        rolling={hiddenRolling}
      />
    </div>
  );
}

function pickWeighted(candidates: HiddenRewardCandidate[]) {
  const total = candidates.reduce((sum, candidate) => sum + candidate.probabilityWeight, 0);
  let cursor = Math.random() * total;

  for (const candidate of candidates) {
    cursor -= candidate.probabilityWeight;
    if (cursor <= 0) return candidate;
  }

  return candidates[candidates.length - 1] ?? null;
}

function cloneConfig(config: UQuestAppConfig): UQuestAppConfig {
  const cloned = JSON.parse(JSON.stringify(config)) as UQuestAppConfig;

  return {
    ...cloned,
    attendanceWeek: normalizeAttendanceWeek(cloned.attendanceWeek),
    missionGroups: cloned.missionGroups.map((group) => summarizeMissionGroup({ ...group, expanded: true }))
  };
}

const weekdayOrder: AttendanceDay[] = [
  { id: "mon", label: "월", state: "idle" },
  { id: "tue", label: "화", state: "idle" },
  { id: "wed", label: "수", state: "idle" },
  { id: "thu", label: "목", state: "idle" },
  { id: "fri", label: "금", state: "idle" },
  { id: "sat", label: "토", state: "idle" },
  { id: "sun", label: "일", state: "idle" }
];

function normalizeAttendanceWeek(attendanceWeek: AttendanceDay[]) {
  const todayId = getTodayWeekdayId();
  const legacyToday = attendanceWeek.find((day) => day.id === "today");

  return weekdayOrder.map((weekday) => {
    const source = attendanceWeek.find((day) => day.id === weekday.id || day.label === weekday.label);
    const state = weekday.id === todayId ? (source?.state === "done" || legacyToday?.state === "done" ? "done" : "today") : source?.state ?? "idle";

    return {
      ...weekday,
      state
    };
  });
}

function getTodayWeekdayId() {
  const day = new Date().getDay();

  return ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][day];
}

function createSwordPreview(level: number): SwordLevelPreview {
  const names: Record<number, string> = {
    1: "나무검",
    2: "수습검",
    3: "수습검+",
    4: "단련검",
    5: "단련검+",
    6: "유림검",
    7: "유림검+",
    8: "명검",
    9: "명검+",
    10: "전설검"
  };
  return {
    level,
    label: `Lv.${level}`,
    name: names[level] ?? "전설검",
    coinCap: 10,
    hiddenChancePct: 0.8,
    extraCoinHit: 0
  };
}

function getSwordRequirement(level: number) {
  const requirements: Record<number, { coin: number; scroll: number; sxp: number }> = {
    1: { coin: 0, scroll: 0, sxp: 0 },
    2: { coin: 50, scroll: 0, sxp: 20 },
    3: { coin: 120, scroll: 0, sxp: 45 },
    4: { coin: 240, scroll: 0, sxp: 80 },
    5: { coin: 400, scroll: 0, sxp: 130 },
    6: { coin: 650, scroll: 0, sxp: 200 },
    7: { coin: 900, scroll: 0, sxp: 300 },
    8: { coin: 1200, scroll: 0, sxp: 420 },
    9: { coin: 1600, scroll: 0, sxp: 560 },
    10: { coin: 2200, scroll: 0, sxp: 720 }
  };

  return requirements[level] ?? requirements[10];
}

function walletAmount(wallet: CurrencySnapshot[], id: string) {
  return wallet.find((currency) => currency.id === id)?.amount ?? 0;
}

function updateWallet(wallet: CurrencySnapshot[], id: string, delta: number) {
  if (!delta) return wallet;

  return wallet.map((currency) => (currency.id === id ? { ...currency, amount: Math.max(0, currency.amount + delta) } : currency));
}

function incrementMetric(metrics: CurrencySnapshot[], id: string, delta: number) {
  return metrics.map((metric) => (metric.id === id ? { ...metric, amount: Math.max(0, metric.amount + delta) } : metric));
}

function summarizeMissionGroup(group: MissionGroup): MissionGroup {
  const completedCount = group.tasks.filter((task) => task.completed).length;
  const totalCount = group.tasks.length;
  const arrow = group.expanded ? "▲" : "▼";

  return {
    ...group,
    completedCount,
    totalCount,
    statusLabel: `${completedCount} / ${totalCount} ${arrow}`
  };
}

function addActivity(activities: UQuestAppConfig["activities"], activity: UQuestAppConfig["activities"][number]) {
  return [activity, ...activities].slice(0, 8);
}

function addInventoryItem(inventory: InventoryItem[], item: InventoryItem) {
  return [item, ...inventory];
}
