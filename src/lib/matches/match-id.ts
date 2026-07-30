export function normalizeMatchIdInput(value: string) {
  return value.replaceAll("-", "").trim().toLowerCase();
}
