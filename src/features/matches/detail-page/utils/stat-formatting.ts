import { humanizeStatKey } from "#/lib/stats-metrics/labels";

const orderedStatValueKeys = [
  "yards",
  "airYards",
  "yardsAfterCatch",
  "team",
  "down",
  "distance",
  "startFieldPosition",
  "endFieldPosition",
  "touchdown",
  "passer",
  "receiver",
  "runner",
  "returner",
  "kicker",
  "tackled",
  "tackler",
  "tacklers",
  "fumbler",
  "forcedBy",
  "blocker",
  "sacker",
  "sackers",
  "sacked",
  "interceptor",
];

const statValueLabels: Record<string, string> = {
  airYards: "jardas aéreas",
  blocker: "bloqueador",
  distance: "distância",
  down: "descida",
  endFieldPosition: "fim",
  forcedBy: "forçado por",
  fumbler: "fumble de",
  interceptor: "interceptador",
  kicker: "kicker",
  passer: "passador",
  receiver: "recebedor",
  returner: "retornador",
  runner: "corredor",
  sacked: "sofreu sack",
  sacker: "sack de",
  sackers: "sacks de",
  startFieldPosition: "início",
  tackled: "tackleado",
  tackler: "tackle de",
  tacklers: "tackles de",
  team: "time",
  touchdown: "touchdown",
  yards: "jardas",
  yardsAfterCatch: "jardas após recepção",
};

export function formatStatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "-";
  }

  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }

  if (typeof value === "string" || typeof value === "boolean") {
    return formatScalar(value);
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? value.map(formatStatValue).join(", ") : "-";
  }

  if (isRecord(value)) {
    return formatStatObject(value);
  }

  return String(value);
}

function formatStatObject(value: Record<string, unknown>) {
  if (isFieldPosition(value)) {
    return formatFieldPosition(value);
  }

  const keys = [
    ...orderedStatValueKeys.filter((key) => key in value),
    ...Object.keys(value)
      .filter((key) => key !== "source" && !orderedStatValueKeys.includes(key))
      .sort(),
  ];

  const parts = keys
    .map((key) => formatStatObjectEntry(key, value[key]))
    .filter((part): part is string => Boolean(part));

  return parts.length > 0 ? parts.join(" · ") : "-";
}

function formatStatObjectEntry(key: string, value: unknown) {
  if (value === null || value === undefined || key === "source") {
    return null;
  }

  if (key === "yards" && typeof value === "number") {
    return formatYards(value);
  }

  if (key === "down" && typeof value === "number") {
    return `${value}ª descida`;
  }

  if (key === "team" && typeof value === "number") {
    return `time: ${formatStatTeam(value)}`;
  }

  const label = statValueLabels[key] ?? humanizeStatKey(key).toLowerCase();

  if (isRecord(value) && isFieldPosition(value)) {
    return `${label}: ${formatFieldPosition(value)}`;
  }

  if (Array.isArray(value)) {
    return `${label}: ${value.map(formatStatValue).join(", ")}`;
  }

  return `${label}: ${formatStatValue(value)}`;
}

function formatFieldPosition(position: { side: unknown; yards: unknown }) {
  const side = typeof position.side === "number" ? `lado ${position.side}` : null;
  const yards = typeof position.yards === "number" ? formatYards(position.yards) : null;

  return [side, yards].filter(Boolean).join(", ");
}

function formatYards(value: number) {
  return `${formatNumber(value)} ${value === 1 ? "jarda" : "jardas"}`;
}

function formatStatTeam(value: number) {
  if (value === 1) {
    return "vermelho";
  }

  if (value === 2) {
    return "azul";
  }

  return String(value);
}

function formatScalar(value: string | boolean) {
  if (typeof value === "boolean") {
    return value ? "Sim" : "Não";
  }

  return value;
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isFieldPosition(
  value: Record<string, unknown>,
): value is { side: unknown; yards: unknown } {
  return "side" in value && "yards" in value;
}
