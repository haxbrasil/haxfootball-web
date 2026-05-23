const metricLabels: Record<string, string> = {
  "accumulated-invasions": "Invasões acumuladas",
  carries: "Corridas",
  "extra-points-made": "Extra points feitos",
  "extra-points-missed": "Extra points errados",
  "fantasy-points": "Pontos",
  "field-goal-yards": "Jardas de field goal",
  "field-goals-made": "Field goals feitos",
  "field-goals-missed": "Field goals errados",
  "forced-fumbles": "Fumbles forçados",
  "fumbles-lost": "Fumbles perdidos",
  fouls: "Faltas",
  interceptions: "Interceptações",
  "interceptions-thrown": "Interceptações lançadas",
  invasions: "Invasões",
  "pass-attempts": "Tentativas de passe",
  "pass-completions": "Passes completos",
  "passes-blocked": "Passes bloqueados",
  "passing-touchdowns": "Touchdowns passados",
  "passing-yards": "Jardas passadas",
  "pick-sixes": "Pick-sixes",
  "quarterback-carries": "Corridas do quarterback",
  receptions: "Recepções",
  "receiving-touchdowns": "Touchdowns recebidos",
  "receiving-yards": "Jardas recebidas",
  returns: "Retornos",
  "return-touchdowns": "Touchdowns de retorno",
  "return-yards": "Jardas de retorno",
  "rushing-touchdowns": "Touchdowns corridos",
  "rushing-yards": "Jardas corridas",
  "sack-yards-lost": "Jardas perdidas em sack",
  sacks: "Sacks",
  "sacks-taken": "Sacks sofridos",
  "strip-sacks-taken": "Strip sacks sofridos",
  tackles: "Tackles",
  "thrown-fumbles": "Fumbles lançados",
  "yards-after-catch": "Jardas após recepção",
};

export function formatMetricLabel(key: string, label?: string | null) {
  if (label && !label.startsWith("metric.")) {
    return label;
  }

  const normalizedKey = label?.startsWith("metric.") ? label.slice("metric.".length) : key;

  return metricLabels[normalizedKey] ?? humanizeStatKey(normalizedKey);
}

export function humanizeStatKey(key: string) {
  return key
    .split(/[-_]/)
    .filter(Boolean)
    .map((part, index) => (index === 0 ? capitalize(part) : part))
    .join(" ");
}

function capitalize(value: string) {
  return value.length > 0 ? `${value[0]?.toUpperCase()}${value.slice(1)}` : value;
}
