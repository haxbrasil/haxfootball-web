export type CompositionRoundDraft = {
  matchId: string;
  kind: "sequential" | "extra-time";
  orientation: "auto" | "aligned" | "swapped";
};

export type NormalizedCompositionRound =
  | {
      kind: "sequential";
      number: number;
      matchId: string;
      orientation: CompositionRoundDraft["orientation"];
    }
  | {
      kind: "extra-time";
      number: null;
      matchId: string;
      orientation: CompositionRoundDraft["orientation"];
    };

export function matchRoundLabel(
  round: { kind: "sequential"; number: string | number } | { kind: "extra-time" },
): string {
  if (round.kind === "extra-time") {
    return "Prorrogação";
  }

  return `${Number(round.number)}º tempo`;
}

export function summarizeCompositionRounds(rounds: Array<{ kind: "sequential" | "extra-time" }>): {
  sequentialRoundCount: number;
  hasExtraTime: boolean;
} {
  return {
    sequentialRoundCount: rounds.filter((round) => round.kind === "sequential").length,
    hasExtraTime: rounds.some((round) => round.kind === "extra-time"),
  };
}

const compositionErrorMessages: Record<string, string> = {
  "Round scores must be cumulative":
    "O placar não é cumulativo com a configuração de lados escolhida. Revise quais tempos mantiveram ou inverteram os lados.",
  "Round team orientation is ambiguous; choose aligned or swapped":
    "Não foi possível identificar automaticamente os lados de um dos tempos. Escolha “lados mantidos” ou “lados invertidos” nesse tempo.",
  "The first round establishes the team orientation":
    "O primeiro tempo é a referência dos times e não pode ter os lados invertidos.",
  "Only completed matches can be bound": "Somente partidas concluídas podem ser vinculadas.",
  "All rounds must use the same game mode": "Todos os tempos precisam usar o mesmo modo de jogo.",
  "All rounds must use the same event schema version":
    "Todos os tempos precisam usar a mesma versão do esquema de eventos.",
  "Completed rounds must include a score":
    "Todas as partidas concluídas precisam ter um placar registrado.",
  "Match is already bound to a composed match":
    "Uma das partidas já pertence a outra partida composta.",
  "Composed matches cannot be used as rounds":
    "Uma partida composta não pode ser usada como tempo.",
  "Physical match not found": "Uma das partidas físicas não foi encontrada.",
};

export function matchCompositionErrorMessage(message: string): string {
  return (
    compositionErrorMessages[message] ?? "Não foi possível vincular as partidas. Tente novamente."
  );
}

export function validateCompositionRoundDrafts(rounds: CompositionRoundDraft[]): string | null {
  if (rounds.length < 2) {
    return "Selecione pelo menos duas partidas.";
  }

  if (new Set(rounds.map((round) => round.matchId)).size !== rounds.length) {
    return "Uma partida não pode aparecer em mais de um tempo.";
  }

  const extraTimeIndexes = rounds
    .map((round, index) => (round.kind === "extra-time" ? index : -1))
    .filter((index) => index >= 0);

  if (extraTimeIndexes.length > 1) {
    return "A composição pode ter somente uma prorrogação.";
  }

  if (extraTimeIndexes.length === 1 && extraTimeIndexes[0] !== rounds.length - 1) {
    return "A prorrogação deve ser o último tempo.";
  }

  return null;
}

export function toMatchCompositionRounds(
  rounds: CompositionRoundDraft[],
): NormalizedCompositionRound[] {
  let sequentialNumber = 0;

  return rounds.map((round) => {
    if (round.kind === "extra-time") {
      return {
        kind: "extra-time" as const,
        number: null,
        matchId: round.matchId,
        orientation: round.orientation,
      };
    }

    sequentialNumber += 1;

    return {
      kind: "sequential" as const,
      number: sequentialNumber,
      matchId: round.matchId,
      orientation: round.orientation,
    };
  });
}

export function scoreInCompositionOrientation(
  score: { red: string | number; blue: string | number } | null,
  orientation: CompositionRoundDraft["orientation"],
): { red: string | number; blue: string | number } | null {
  if (!score || orientation === "auto" || orientation === "aligned") {
    return score;
  }

  return { red: score.blue, blue: score.red };
}
