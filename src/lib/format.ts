export function formatNumber(value: number | null | undefined): string {
  return (value ?? 0).toLocaleString("ko-KR");
}

export function formatKrw(value: number | null | undefined): string {
  return `₩${(value ?? 0).toLocaleString("ko-KR")}`;
}

export function formatCompactKrw(value: number): string {
  if (value >= 1_000_000) {
    return `₩${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 2)}M`;
  }

  return formatKrw(value);
}

export function formatCurrencyAmount(value: number, unit: "krw" | "number" | "pct"): string {
  if (unit === "krw") return formatKrw(value);
  if (unit === "pct") return `${value}%`;
  return formatNumber(value);
}
