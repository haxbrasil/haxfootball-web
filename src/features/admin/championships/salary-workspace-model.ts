function numberValue(value: string | number | null | undefined): number {
  return Number(value ?? 0);
}

export function parsePastedSalaryValues(value: string): number[] {
  return value
    .split(/[\t\r\n;]+/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map(Number)
    .filter((entry) => Number.isInteger(entry) && entry >= 0);
}

export function salaryCapPercentage(usage: string | number, cap: string | number): number {
  const normalizedCap = numberValue(cap);

  return normalizedCap > 0 ? (numberValue(usage) / normalizedCap) * 100 : 0;
}

export function simulateSalarySwap(
  currentUsage: string | number,
  outgoing: number,
  incoming: number,
  cap: number,
) {
  const usageAfter = numberValue(currentUsage) - outgoing + incoming;

  return {
    usageAfter,
    remaining: cap - usageAfter,
    overCap: usageAfter > cap,
  };
}
