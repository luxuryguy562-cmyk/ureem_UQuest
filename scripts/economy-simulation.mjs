const defaultScenario = {
  name: "MVP 기본 시나리오",
  activeEmployeeCount: 24,
  participationRatePct: 82,
  avgDailyTicket: 30,
  operationDays: 30,
  perUserMonthlyBaseBudgetKrw: 50000,
  perUserMonthlyMaxBudgetKrw: 100000,
  coinValueKrw: 0.1,
  hiddenRewardAvgValueKrw: 10000,
  eventMultiplier: 1,
  avgSwordMultiplier: 1.08,
  autoAdjustEnabled: true
};

const stressScenario = {
  ...defaultScenario,
  name: "스트레스 시나리오",
  participationRatePct: 100,
  avgDailyTicket: 40,
  eventMultiplier: 2,
  avgSwordMultiplier: 1.18
};

function round(value, digits = 2) {
  return Number(value.toFixed(digits));
}

function formatKrw(value) {
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

function formatNumber(value) {
  return Math.round(value).toLocaleString("ko-KR");
}

function simulate(input) {
  const epsilon = 0.000001;
  const participationRate = input.participationRatePct / 100;
  const estimatedMonthlyHits =
    input.activeEmployeeCount *
    participationRate *
    input.avgDailyTicket *
    input.operationDays;

  const monthlyBaseBudgetKrw =
    input.activeEmployeeCount * input.perUserMonthlyBaseBudgetKrw;
  const monthlyMaxBudgetKrw =
    input.activeEmployeeCount * input.perUserMonthlyMaxBudgetKrw;
  const monthlyHiddenBudgetKrw =
    monthlyMaxBudgetKrw - monthlyBaseBudgetKrw;

  const rawOneHitAverageCoin =
    estimatedMonthlyHits > 0
      ? monthlyBaseBudgetKrw / estimatedMonthlyHits / input.coinValueKrw
      : 0;

  const rawEstimatedPayoutKrw =
    estimatedMonthlyHits *
    rawOneHitAverageCoin *
    input.coinValueKrw *
    input.avgSwordMultiplier *
    input.eventMultiplier;

  const economyFactor =
    input.autoAdjustEnabled && rawEstimatedPayoutKrw > 0
      ? Math.min(1, monthlyBaseBudgetKrw / rawEstimatedPayoutKrw)
      : 1;

  const adjustedOneHitAverageCoin = rawOneHitAverageCoin * economyFactor;
  const estimatedMonthlyPayoutKrw =
    estimatedMonthlyHits *
    adjustedOneHitAverageCoin *
    input.coinValueKrw *
    input.avgSwordMultiplier *
    input.eventMultiplier;

  const hiddenProbabilityPct =
    estimatedMonthlyHits > 0 && input.hiddenRewardAvgValueKrw > 0
      ? (monthlyHiddenBudgetKrw /
          (estimatedMonthlyHits * input.hiddenRewardAvgValueKrw)) *
        100
      : 0;

  const budgetUsagePct =
    monthlyBaseBudgetKrw > 0
      ? (estimatedMonthlyPayoutKrw / monthlyBaseBudgetKrw) * 100
      : 0;

  const budgetRisk =
    budgetUsagePct <= 90 + epsilon
      ? "stable"
      : budgetUsagePct <= 100 + epsilon
        ? "watch"
        : "danger";

  return {
    ...input,
    estimatedMonthlyHits,
    monthlyBaseBudgetKrw,
    monthlyHiddenBudgetKrw,
    rawOneHitAverageCoin,
    adjustedOneHitAverageCoin,
    rawEstimatedPayoutKrw,
    estimatedMonthlyPayoutKrw,
    economyFactor,
    hiddenProbabilityPct,
    budgetUsagePct,
    budgetRisk
  };
}

function printResult(result) {
  console.log(`\n[${result.name}]`);
  console.log(`활성 직원 수: ${formatNumber(result.activeEmployeeCount)}명`);
  console.log(`참여율: ${round(result.participationRatePct, 1)}%`);
  console.log(`평균 일일 타격권: ${formatNumber(result.avgDailyTicket)}타`);
  console.log(`월 예상 타격수: ${formatNumber(result.estimatedMonthlyHits)}타`);
  console.log(`월 기본 예산: ${formatKrw(result.monthlyBaseBudgetKrw)}`);
  console.log(`월 히든 예산: ${formatKrw(result.monthlyHiddenBudgetKrw)}`);
  console.log(`보정 전 1타 평균 코인: ${formatNumber(result.rawOneHitAverageCoin)}코인`);
  console.log(`경제보정계수: ${round(result.economyFactor, 4)}`);
  console.log(`보정 후 1타 평균 코인: ${formatNumber(result.adjustedOneHitAverageCoin)}코인`);
  console.log(`예상 월 지급액: ${formatKrw(result.estimatedMonthlyPayoutKrw)}`);
  console.log(`예산 사용률: ${round(result.budgetUsagePct, 2)}%`);
  console.log(`히든 확률: ${round(result.hiddenProbabilityPct, 4)}%`);
  console.log(`예산 위험도: ${result.budgetRisk}`);
}

const results = [simulate(defaultScenario), simulate(stressScenario)];

console.log("U-Quest 보상 경제 시뮬레이션");
console.log("실제 seed 데이터가 들어가기 전, 공식이 어떻게 움직이는지 확인하는 샘플입니다.");
results.forEach(printResult);
