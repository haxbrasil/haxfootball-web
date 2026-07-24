export type CompositionRoundDraft = {
  matchId: string;
  kind: "sequential" | "extra-time";
};

export type NormalizedCompositionRound =
  | {
      kind: "sequential";
      number: number;
      matchId: string;
    }
  | {
      kind: "extra-time";
      number: null;
      matchId: string;
    };

export function matchRoundLabel(
  round: { kind: "sequential"; number: string | number } | { kind: "extra-time" },
): string {
  if (round.kind === "extra-time") {
    return "Prorrogação";
  }

  return `${Number(round.number)}º tempo`;
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
      };
    }

    sequentialNumber += 1;

    return {
      kind: "sequential" as const,
      number: sequentialNumber,
      matchId: round.matchId,
    };
  });
}
