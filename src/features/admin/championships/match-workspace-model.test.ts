import { describe, expect, it } from "vitest";
import {
  appearanceFindingLabel,
  correctionImpactLabel,
  durationLabel,
  evidenceUsesUnconfiguredProgram,
  evidenceQualityLabel,
  evidencePeriodScores,
  numberValue,
  officialScore,
  outcomeForScores,
  validateSettlementDraft,
} from "./match-workspace-model";

describe("championship match workspace model", () => {
  it.each([
    [0, 0, "draw", "draw"],
    [1, 0, "win", "loss"],
    [0, 1, "loss", "win"],
    [12, 4, "win", "loss"],
  ] as const)("derives outcomes for %d-%d", (a, b, outcomeA, outcomeB) => {
    expect(outcomeForScores(a, b)).toEqual([outcomeA, outcomeB]);
  });

  it.each(Array.from({ length: 51 }, (_, score) => score))(
    "keeps nonnegative score %d stable",
    (score) => {
      expect(numberValue(score)).toBe(score);
      expect(outcomeForScores(score, score)).toEqual(["draw", "draw"]);
    },
  );

  it("turns cumulative switched-half scores into period layers", () => {
    const scores = evidencePeriodScores({
      scoreMode: "cumulative",
      rounds: [
        {
          matchId: "first",
          kind: "sequential",
          number: 1,
          normalizedScore: { red: 2, blue: 1 },
        },
        {
          matchId: "second",
          kind: "sequential",
          number: 2,
          normalizedScore: { red: 3, blue: 4 },
        },
        {
          matchId: "overtime",
          kind: "extra-time",
          number: null,
          normalizedScore: { red: 4, blue: 4 },
        },
      ],
    } as never);

    expect(scores.map(({ label, sideA, sideB }) => ({ label, sideA, sideB }))).toEqual([
      { label: "1º tempo", sideA: 2, sideB: 1 },
      { label: "2º tempo", sideA: 1, sideB: 3 },
      { label: "Prorrogação", sideA: 1, sideB: 0 },
    ]);
  });

  it("sums independent room-game scores into period layers", () => {
    const scores = evidencePeriodScores({
      scoreMode: "per-game",
      rounds: [
        {
          matchId: "first",
          kind: "sequential",
          number: 1,
          normalizedScore: { red: 3, blue: 1 },
        },
        {
          matchId: "second",
          kind: "sequential",
          number: 2,
          normalizedScore: { red: 4, blue: 2 },
        },
        {
          matchId: "overtime",
          kind: "extra-time",
          number: null,
          normalizedScore: { red: 1, blue: 0 },
        },
      ],
    } as never);

    expect(
      scores.map(({ label, sideA, sideB, cumulativeSideA, cumulativeSideB }) => ({
        label,
        sideA,
        sideB,
        cumulativeSideA,
        cumulativeSideB,
      })),
    ).toEqual([
      {
        label: "1º tempo",
        sideA: 3,
        sideB: 1,
        cumulativeSideA: 3,
        cumulativeSideB: 1,
      },
      {
        label: "2º tempo",
        sideA: 4,
        sideB: 2,
        cumulativeSideA: 7,
        cumulativeSideB: 3,
      },
      {
        label: "Prorrogação",
        sideA: 1,
        sideB: 0,
        cumulativeSideA: 8,
        cumulativeSideB: 3,
      },
    ]);
  });

  it("keeps administrative points visible in official score", () => {
    expect(
      officialScore({
        sideAPlayedScore: 2,
        sideBPlayedScore: 4,
        sideAAdministrativeScore: 3,
        sideBAdministrativeScore: 0,
      } as never),
    ).toEqual([5, 4]);
  });

  it("accepts evidence from any active championship room program", () => {
    const operations = {
      evidence: {
        rounds: [
          {
            provenance: {
              program: { uuid: "haxfootball-v1" },
            },
          },
        ],
      },
    } as never;

    expect(evidenceUsesUnconfiguredProgram(operations, ["haxfootball-v2", "haxfootball-v1"])).toBe(
      false,
    );
    expect(evidenceUsesUnconfiguredProgram(operations, ["haxfootball-v2"])).toBe(true);
  });

  it("keeps missing provenance and an empty program configuration permissive", () => {
    const operations = {
      evidence: { rounds: [{ provenance: null }] },
    } as never;

    expect(evidenceUsesUnconfiguredProgram(operations, ["haxfootball-v2"])).toBe(false);
    expect(evidenceUsesUnconfiguredProgram(operations, [])).toBe(false);
  });

  it("permits outcome to differ from score for a mid-game forfeit", () => {
    expect(
      validateSettlementDraft(
        {
          method: "mid-game-forfeit",
          sideAPlayedScore: 1,
          sideBPlayedScore: 4,
          sideAAdministrativeScore: 1,
          sideBAdministrativeScore: 0,
          sideAOutcome: "win",
          sideBOutcome: "loss",
          evidenceQualityReviewed: true,
          programMismatchReason: null,
          note: null,
        },
        true,
      ),
    ).toEqual([]);
  });

  it("blocks played settlement without evidence and inconsistent outcomes", () => {
    const issues = validateSettlementDraft(
      {
        method: "played",
        sideAPlayedScore: 1,
        sideBPlayedScore: 0,
        sideAAdministrativeScore: 0,
        sideBAdministrativeScore: 0,
        sideAOutcome: "win",
        sideBOutcome: "draw",
        evidenceQualityReviewed: false,
        programMismatchReason: null,
        note: null,
      },
      false,
    );

    expect(issues).toHaveLength(3);
  });

  it.each([
    [0, "00:00"],
    [59, "00:59"],
    [60, "01:00"],
    [605, "10:05"],
    [null, "duração indisponível"],
  ])("formats period duration %j", (seconds, expected) => {
    expect(durationLabel(seconds)).toBe(expected);
  });

  it.each([
    ["unregistered", "Conta não registrada"],
    ["off-roster", "Fora do elenco"],
    ["wrong-side", "Registrado na equipe adversária"],
    ["ambiguous-side", "Participação observada nos dois lados"],
  ])("localizes appearance finding %s", (finding, expected) => {
    expect(appearanceFindingLabel(finding)).toBe(expected);
  });

  it("describes legacy evidence by the metadata that is actually missing", () => {
    expect(evidenceQualityLabel("legacy")).toBe("Proveniência indisponível");
  });

  it("summarizes recursive correction impact", () => {
    expect(
      correctionImpactLabel({
        downstream: [
          { hadEvidence: true, hadResult: true },
          { hadEvidence: false, hadResult: true },
        ],
      } as never),
    ).toBe("2 partidas posteriores, 2 resultados e 1 vínculo de evidência serão invalidados.");
  });
});
