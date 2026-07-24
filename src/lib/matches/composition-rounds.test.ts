import { describe, expect, it } from "vitest";
import {
  matchCompositionErrorMessage,
  matchRoundLabel,
  scoreInCompositionOrientation,
  summarizeCompositionRounds,
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
        { kind: "sequential", matchId: "match001", orientation: "auto" },
        { kind: "sequential", matchId: "match002", orientation: "swapped" },
        { kind: "extra-time", matchId: "match003", orientation: "aligned" },
      ]),
    ).toEqual([
      {
        kind: "sequential",
        number: 1,
        matchId: "match001",
        orientation: "auto",
      },
      {
        kind: "sequential",
        number: 2,
        matchId: "match002",
        orientation: "swapped",
      },
      {
        kind: "extra-time",
        number: null,
        matchId: "match003",
        orientation: "aligned",
      },
    ]);
  });

  it("summarizes sequential rounds and extra time independently", () => {
    expect(
      summarizeCompositionRounds([
        { kind: "sequential" },
        { kind: "sequential" },
        { kind: "extra-time" },
      ]),
    ).toEqual({
      sequentialRoundCount: 2,
      hasExtraTime: true,
    });
    expect(summarizeCompositionRounds([{ kind: "sequential" }, { kind: "sequential" }])).toEqual({
      sequentialRoundCount: 2,
      hasExtraTime: false,
    });
  });

  it("presents composition API failures in Portuguese", () => {
    expect(matchCompositionErrorMessage("Round scores must be cumulative")).toBe(
      "O placar não é cumulativo com a configuração de lados escolhida. Revise quais tempos mantiveram ou inverteram os lados.",
    );
    expect(
      matchCompositionErrorMessage(
        "Round team orientation is ambiguous; choose aligned or swapped",
      ),
    ).toBe(
      "Não foi possível identificar automaticamente os lados de um dos tempos. Escolha “lados mantidos” ou “lados invertidos” nesse tempo.",
    );
    expect(matchCompositionErrorMessage("Unexpected failure")).toBe(
      "Não foi possível vincular as partidas. Tente novamente.",
    );
  });

  it("shows an explicitly switched score in the composition orientation", () => {
    expect(scoreInCompositionOrientation({ red: 44, blue: 14 }, "swapped")).toEqual({
      red: 14,
      blue: 44,
    });
    expect(scoreInCompositionOrientation({ red: 44, blue: 14 }, "aligned")).toEqual({
      red: 44,
      blue: 14,
    });
  });

  it("rejects too few, duplicate, multiple, and misplaced extra-time rounds", () => {
    expect(
      validateCompositionRoundDrafts([
        { kind: "sequential", matchId: "match001", orientation: "auto" },
      ]),
    ).toBe("Selecione pelo menos duas partidas.");
    expect(
      validateCompositionRoundDrafts([
        { kind: "sequential", matchId: "match001", orientation: "auto" },
        { kind: "sequential", matchId: "match001", orientation: "auto" },
      ]),
    ).toBe("Uma partida não pode aparecer em mais de um tempo.");
    expect(
      validateCompositionRoundDrafts([
        { kind: "extra-time", matchId: "match001", orientation: "auto" },
        { kind: "extra-time", matchId: "match002", orientation: "auto" },
      ]),
    ).toBe("A composição pode ter somente uma prorrogação.");
    expect(
      validateCompositionRoundDrafts([
        { kind: "extra-time", matchId: "match001", orientation: "auto" },
        { kind: "sequential", matchId: "match002", orientation: "auto" },
      ]),
    ).toBe("A prorrogação deve ser o último tempo.");
  });
});
