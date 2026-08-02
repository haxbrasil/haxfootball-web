export const CLIP_FRAME_RATE = 60;

export function clipTickNumber(value: number | string) {
  const parsed = typeof value === "number" ? value : Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatClipTime(value: number | string) {
  const totalSeconds = Math.max(0, clipTickNumber(value)) / CLIP_FRAME_RATE;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function formatClipRange(startTick: number | string, endTick: number | string) {
  return `${formatClipTime(startTick)} – ${formatClipTime(endTick)}`;
}

export function formatClipDuration(startTick: number | string, endTick: number | string) {
  const durationTicks = Math.max(0, clipTickNumber(endTick) - clipTickNumber(startTick));

  return formatClipTime(durationTicks);
}

export function clipFormatLabel(format: "hbr2" | "hbrx" | null | undefined) {
  return format === "hbrx" ? "HBRX" : "HBR2";
}

export function clipSourceLabel(sourceKind: "web" | "room_command") {
  return sourceKind === "room_command" ? "Criado na sala" : "Criado no site";
}

export function formatClipDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
