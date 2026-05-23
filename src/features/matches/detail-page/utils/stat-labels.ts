import { formatMetricLabel, humanizeStatKey } from "#/lib/stats-metrics/labels";

const eventLabels: Record<string, string> = {
  "accumulated-invasion": "Invasão acumulada",
  carry: "Corrida",
  "extra-point-made": "Extra point feito",
  "extra-point-missed": "Extra point errado",
  "field-goal-made": "Field goal feito",
  "field-goal-missed": "Field goal errado",
  "forced-fumble": "Fumble forçado",
  "fumble-lost": "Fumble perdido",
  foul: "Falta",
  interception: "Interceptação",
  "interception-thrown": "Interceptação lançada",
  invasion: "Invasão",
  "pass-attempt": "Tentativa de passe",
  "pass-blocked": "Passe bloqueado",
  "pass-completion": "Passe completo",
  "passing-touchdown": "Touchdown passado",
  "pick-six": "Pick-six",
  "quarterback-carry": "Corrida do quarterback",
  reception: "Recepção",
  "receiving-touchdown": "Touchdown recebido",
  return: "Retorno",
  "return-touchdown": "Touchdown de retorno",
  "rushing-touchdown": "Touchdown corrido",
  sack: "Sack",
  "sack-taken": "Sack sofrido",
  "strip-sack-taken": "Strip sack sofrido",
  tackle: "Tackle",
  "thrown-fumble": "Fumble lançado",
};

export { formatMetricLabel };

export function formatStatEventLabel(type: string) {
  return eventLabels[type] ?? humanizeStatKey(type);
}
