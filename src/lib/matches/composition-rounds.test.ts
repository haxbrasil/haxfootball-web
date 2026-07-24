import { describe, expect, it } from "vitest";
import {
  matchRoundLabel,
  toMatchCompositionRounds,
  validateCompositionRoundDrafts,
} from "./composition-rounds";

describe("match composition rounds", () => {
  it("labels sequential rounds and extra time in Portuguese", () => {
    expect(matchRoundLabel({ kind: "sequential", number: 2 })).toBe("2º tempo");
    expect(matchRoundLabel({ kind: "extra-time" })).toBe("Prorrogação");
  });

  it("assigns sequential numbers around a final extra-time round", () => {
    expect(
      toMatchCompositionRounds([
        { kind: "sequential", matchId: "match001" },
        { kind: "sequential", matchId: "match002" },
        { kind: "extra-time", matchId: "match003" },
      ]),
    ).toEqual([
      { kind: "sequential", number: 1, matchId: "match001" },
      { kind: "sequential", number: 2, matchId: "match002" },
      { kind: "extra-time", number: null, matchId: "match003" },
    ]);
  });

  it("rejects too few, duplicate, multiple, and misplaced extra-time rounds", () => {
    expect(validateCompositionRoundDrafts([{ kind: "sequential", matchId: "match001" }])).toBe(
      "Selecione pelo menos duas partidas.",
    );
    expect(
      validateCompositionRoundDrafts([
        { kind: "sequential", matchId: "match001" },
        { kind: "sequential", matchId: "match001" },
      ]),
    ).toBe("Uma partida não pode aparecer em mais de um tempo.");
    expect(
      validateCompositionRoundDrafts([
        { kind: "extra-time", matchId: "match001" },
        { kind: "extra-time", matchId: "match002" },
      ]),
    ).toBe("A composição pode ter somente uma prorrogação.");
    expect(
      validateCompositionRoundDrafts([
        { kind: "extra-time", matchId: "match001" },
        { kind: "sequential", matchId: "match002" },
      ]),
    ).toBe("A prorrogação deve ser o último tempo.");
  });
});
