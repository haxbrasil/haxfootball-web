import type {
  Championship,
  ChampionshipCompetitionType,
  ChampionshipDetail,
} from "@haxbrasil/haxfootball-api-sdk";

export function championshipLifecycleLabel(lifecycle: Championship["lifecycle"]) {
  return {
    setup: "Em preparação",
    active: "Em andamento",
    completed: "Concluído",
    archived: "Arquivado",
    canceled: "Cancelado",
  }[lifecycle];
}

export function championshipLifecycleTone(lifecycle: Championship["lifecycle"]) {
  return {
    setup: "border-amber-400/40 bg-amber-400/10 text-amber-100",
    active: "border-emerald-400/40 bg-emerald-400/10 text-emerald-100",
    completed: "border-sky-400/40 bg-sky-400/10 text-sky-100",
    archived: "border-border bg-muted/60 text-muted-foreground",
    canceled: "border-red-400/40 bg-red-400/10 text-red-100",
  }[lifecycle];
}

export function registrationLabel(state: Championship["registrationState"]) {
  return {
    "not-open": "Inscrições ainda não abertas",
    open: "Inscrições abertas",
    closed: "Inscrições encerradas",
  }[state];
}

export function cadenceLabel(cadence: ChampionshipCompetitionType["cadence"]) {
  if (!cadence) return null;

  return {
    "long-running": "Competição contínua",
    "multi-day": "Competição de vários dias",
    "single-event": "Competição em um evento",
  }[cadence];
}

export function matchFormatLabel(rules: ChampionshipDetail["rules"]) {
  const periods = Number(rules.match.sequentialRoundCount);
  const base = periods === 1 ? "1 tempo" : `${periods} tempos`;

  if (rules.match.overtimePolicy === "disabled") return base;

  return `${base} + prorrogação`;
}

export function formatChampionshipDate(value: string | null) {
  if (!value) return null;

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

export function championshipDateRange(startsAt: string | null, endsAt: string | null) {
  const start = formatChampionshipDate(startsAt);
  const end = formatChampionshipDate(endsAt);

  if (start && end) return `${start} – ${end}`;
  if (start) return `A partir de ${start}`;
  if (end) return `Até ${end}`;
  return "Datas a definir";
}

export function championshipContextLabel(contextType: string | null | undefined) {
  if (!contextType) return "Visão geral";

  return (
    {
      setup: "Configuração",
      teams: "Equipes",
      salary: "Elencos e teto",
      draft: "Draft e trocas",
      format: "Formato",
      matches: "Jogos",
      statistics: "Estatísticas",
      archive: "Títulos e prêmios",
      activity: "Atividade",
      championship: "Campeonato",
      "championship-match": "Jogo",
      thread: "Discussão",
    }[contextType] ?? "Visão geral"
  );
}

export function championshipTargetLabel(targetType: string) {
  return (
    {
      account: "Conta",
      assignment: "Responsabilidade",
      championship: "Campeonato",
      "championship-award": "Premiação",
      "championship-match": "Jogo",
      "championship-placements": "Classificação final",
      "championship-statistics": "Estatísticas",
      "classification-run": "Classificação",
      comment: "Comentário",
      "competition-round": "Período da competição",
      draft: "Draft",
      "draft-turn": "Escolha do draft",
      group: "Grupo",
      "historical-import": "Importação histórica",
      "historical-player": "Jogador histórico",
      "late-play-authorization": "Autorização de jogo atrasado",
      participant: "Participante",
      "permission-grant": "Permissão",
      registration: "Inscrição",
      "room-program": "Programa de sala",
      "roster-membership": "Vínculo de elenco",
      route: "Rota",
      "salary-prices": "Valores salariais",
      "schedule-proposal": "Proposta de horário",
      spot: "Vaga",
      stage: "Etapa",
      team: "Equipe",
      "team-identity": "Identidade de equipe",
      thread: "Discussão",
      trade: "Troca",
      "trade-set": "Conjunto de trocas",
    }[targetType] ?? "Registro relacionado"
  );
}
