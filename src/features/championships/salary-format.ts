export function formatSalaryUnits(value: number | string, displayLabel: string) {
  const label = displayLabel.trim();

  return label.toLowerCase() === "m" ? `${value}M` : `${value} ${label}`;
}
