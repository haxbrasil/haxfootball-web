export function formatMatchCode(id: string) {
  const normalized = id.trim().toLocaleUpperCase("pt-BR");

  if (!/^[A-Z0-9]+$/.test(normalized) || normalized.length <= 4) {
    return normalized;
  }

  return normalized.match(/.{1,4}/g)?.join("-") ?? normalized;
}
