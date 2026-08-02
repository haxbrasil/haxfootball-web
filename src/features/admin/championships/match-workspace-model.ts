import type {
  ChampionshipEvidenceCandidatesData,
  ChampionshipMatchOperationsData,
  ChampionshipSettlementPreviewData,
} from "#/server/api/championship-api";

export type MatchOperations = ChampionshipMatchOperationsData;
export type EvidenceCandidates = ChampionshipEvidenceCandidatesData;
export type SettlementPreview = ChampionshipSettlementPreviewData;
export type EvidenceRound = NonNullable<MatchOperations["evidence"]>["rounds"][number];
export type SettlementMethod = NonNullable<MatchOperations["result"]>["method"];
export type MatchOutcome = NonNullable<MatchOperations["result"]>["sideAOutcome"];

export type SettlementDraft = {
  method: SettlementMethod;
  sideAPlayedScore: number;
  sideBPlayedScore: number;
  sideAAdministrativeScore: number;
  sideBAdministrativeScore: number;
  sideAOutcome: MatchOutcome;
  sideBOutcome: MatchOutcome;
  evidenceQualityReviewed: boolean;
  programMismatchReason: string | null;
  note: string | null;
};

export type PeriodScore = {
  id: string;
  label: string;
  sideA: number;
  sideB: number;
  cumulativeSideA: number;
  cumulativeSideB: number;
  round: EvidenceRound;
};

export type EvidenceOrientation = "aligned" | "swapped";

export function numberValue(value: string | number | null | undefined): number {
  const result = Number(value ?? 0);
  return Number.isFinite(result) ? result : 0;
}

export function championshipEvidenceScore(
  score: { red?: number | null; blue?: number | null } | null | undefined,
  orientation: EvidenceOrientation,
) {
  const red = numberValue(score?.red);
  const blue = numberValue(score?.blue);

  return orientation === "aligned" ? { a: red, b: blue } : { a: blue, b: red };
}

export function evidencePeriodScores(
  evidence: MatchOperations["evidence"],
  orientation: EvidenceOrientation = "aligned",
): PeriodScore[] {
  if (!evidence) return [];

  let accumulatedA = 0;
  let accumulatedB = 0;

  return evidence.rounds.map((round, index) => {
    const normalizedScore = championshipEvidenceScore(round.normalizedScore, orientation);
    const normalizedSideA = normalizedScore.a;
    const normalizedSideB = normalizedScore.b;
    const sideA =
      evidence.scoreMode === "per-game"
        ? normalizedSideA
        : Math.max(0, normalizedSideA - accumulatedA);
    const sideB =
      evidence.scoreMode === "per-game"
        ? normalizedSideB
        : Math.max(0, normalizedSideB - accumulatedB);
    const cumulativeSideA =
      evidence.scoreMode === "per-game" ? accumulatedA + sideA : normalizedSideA;
    const cumulativeSideB =
      evidence.scoreMode === "per-game" ? accumulatedB + sideB : normalizedSideB;
    const item = {
      id: round.matchId,
      label:
        round.kind === "extra-time"
          ? "Prorrogação"
          : evidence.rounds.filter((candidate) => candidate.kind === "sequential").length === 1
            ? "Tempo único"
            : `${numberValue(round.number) || index + 1}º tempo`,
      sideA,
      sideB,
      cumulativeSideA,
      cumulativeSideB,
      round,
    };

    accumulatedA = cumulativeSideA;
    accumulatedB = cumulativeSideB;
    return item;
  });
}

export function defaultSettlementDraft(operations: MatchOperations): SettlementDraft {
  const evidenceScore = operations.evidence
    ? championshipEvidenceScore(
        operations.evidence.score,
        operations.evidenceOrientation ?? "aligned",
      )
    : null;
  const useEvidenceScore = operations.evidence !== null && operations.result?.method === "played";
  const sideA = useEvidenceScore
    ? (evidenceScore?.a ?? 0)
    : operations.result
      ? numberValue(operations.result.sideAPlayedScore)
      : (evidenceScore?.a ?? 0);
  const sideB = useEvidenceScore
    ? (evidenceScore?.b ?? 0)
    : operations.result
      ? numberValue(operations.result.sideBPlayedScore)
      : (evidenceScore?.b ?? 0);
  const outcomes = outcomeForScores(sideA, sideB);

  return {
    method: operations.result?.method ?? (operations.evidence ? "played" : "manual"),
    sideAPlayedScore: sideA,
    sideBPlayedScore: sideB,
    sideAAdministrativeScore: numberValue(operations.result?.sideAAdministrativeScore),
    sideBAdministrativeScore: numberValue(operations.result?.sideBAdministrativeScore),
    sideAOutcome: useEvidenceScore ? outcomes[0] : (operations.result?.sideAOutcome ?? outcomes[0]),
    sideBOutcome: useEvidenceScore ? outcomes[1] : (operations.result?.sideBOutcome ?? outcomes[1]),
    evidenceQualityReviewed: operations.evidence?.quality === "complete",
    programMismatchReason: null,
    note: operations.result?.note ?? null,
  };
}

export function evidenceUsesUnconfiguredProgram(
  operations: MatchOperations,
  allowedProgramUuids: readonly string[],
): boolean {
  if (!operations.evidence || allowedProgramUuids.length === 0) return false;

  const allowedPrograms = new Set(allowedProgramUuids);
  return operations.evidence.rounds.some(
    (round) => round.provenance !== null && !allowedPrograms.has(round.provenance.program.uuid),
  );
}

export function outcomeForScores(sideA: number, sideB: number): [MatchOutcome, MatchOutcome] {
  if (sideA === sideB) return ["draw", "draw"];
  return sideA > sideB ? ["win", "loss"] : ["loss", "win"];
}

export function officialScore(draft: SettlementDraft): [number, number] {
  return [
    draft.sideAPlayedScore + draft.sideAAdministrativeScore,
    draft.sideBPlayedScore + draft.sideBAdministrativeScore,
  ];
}

export function validateSettlementDraft(draft: SettlementDraft, hasEvidence: boolean): string[] {
  const issues: string[] = [];

  if (draft.method === "played" && !hasEvidence) {
    issues.push("Vincule uma partida registrada antes de usar o método jogado.");
  }
  if (draft.sideAOutcome === "win" && draft.sideBOutcome !== "loss") {
    issues.push("Uma vitória do lado A exige derrota do lado B.");
  }
  if (draft.sideBOutcome === "win" && draft.sideAOutcome !== "loss") {
    issues.push("Uma vitória do lado B exige derrota do lado A.");
  }
  if (
    (draft.sideAOutcome === "draw" || draft.sideBOutcome === "draw") &&
    (draft.sideAOutcome !== "draw" || draft.sideBOutcome !== "draw")
  ) {
    issues.push("Empate deve ser registrado para os dois lados.");
  }
  if (
    [
      draft.sideAPlayedScore,
      draft.sideBPlayedScore,
      draft.sideAAdministrativeScore,
      draft.sideBAdministrativeScore,
    ].some((score) => !Number.isInteger(score) || score < 0)
  ) {
    issues.push("Todos os placares devem ser inteiros não negativos.");
  }
  if (!draft.evidenceQualityReviewed && hasEvidence) {
    issues.push("Revise a qualidade das evidências antes de confirmar.");
  }

  return issues;
}

export function evidenceQualityLabel(quality: string): string {
  return (
    {
      complete: "Completa",
      recovered: "Recuperada",
      partial: "Parcial",
      legacy: "Proveniência indisponível",
      ineligible: "Inelegível",
    }[quality] ?? quality
  );
}

export function evidenceQualityTone(quality: string): string {
  if (quality === "complete") return "border-emerald-400/50 text-emerald-300";
  if (quality === "recovered" || quality === "legacy") {
    return "border-amber-400/50 text-amber-300";
  }
  return "border-red-400/50 text-red-300";
}

export function methodLabel(method: SettlementMethod): string {
  return {
    played: "Jogado",
    manual: "Manual",
    "full-forfeit": "W.O. integral",
    "mid-game-forfeit": "Desistência durante o jogo",
    "double-forfeit": "W.O. duplo",
    historical: "Registro histórico",
  }[method];
}

export function outcomeLabel(outcome: MatchOutcome): string {
  return { win: "Vitória", loss: "Derrota", draw: "Empate" }[outcome];
}

export function durationLabel(seconds: number | null): string {
  if (seconds === null) return "duração indisponível";
  const rounded = Math.max(0, Math.round(seconds));
  return `${String(Math.floor(rounded / 60)).padStart(2, "0")}:${String(rounded % 60).padStart(
    2,
    "0",
  )}`;
}

export function appearanceFindingLabel(finding: string): string {
  return (
    {
      unregistered: "Conta não registrada",
      "off-roster": "Fora do elenco",
      "wrong-side": "Registrado na equipe adversária",
      "ambiguous-side": "Participação observada nos dois lados",
    }[finding] ?? finding
  );
}

export function candidateSearchText(candidate: EvidenceCandidates["items"][number]): string {
  const players = candidate.evidence.rounds.flatMap((round) =>
    round.participants.items.map((participant) => participant.player.name),
  );
  return [candidate.evidence.id, ...players].join(" ").toLocaleLowerCase("pt-BR");
}

export function correctionImpactLabel(preview: SettlementPreview): string {
  const matches = preview.downstream.length;
  const linked = preview.downstream.filter((item) => item.hadEvidence).length;
  const settled = preview.downstream.filter((item) => item.hadResult).length;

  if (matches === 0) return "Nenhuma partida posterior será alterada.";
  return `${matches} partida${matches === 1 ? "" : "s"} posterior${
    matches === 1 ? "" : "es"
  }, ${settled} resultado${settled === 1 ? "" : "s"} e ${linked} vínculo${
    linked === 1 ? "" : "s"
  } de evidência serão invalidados.`;
}
