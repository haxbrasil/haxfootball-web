import { describe, expect, it } from "vitest";
import { matchRecordingOptions } from "./match-recordings";

describe("matchRecordingOptions", () => {
  it("returns the single match recording", () => {
    expect(
      matchRecordingOptions({
        kind: "single",
        id: "match-1",
        recording: { url: "https://recs.example/single.hbr2" },
      } as never),
    ).toEqual([
      {
        id: "match-1",
        label: "Partida",
        url: "https://recs.example/single.hbr2",
      },
    ]);
  });

  it("returns only recorded composed rounds in display order", () => {
    expect(
      matchRecordingOptions({
        kind: "composed",
        rounds: [
          {
            kind: "sequential",
            number: 1,
            matchId: "round-1",
            match: { recording: { url: "https://recs.example/1.hbr2" } },
          },
          {
            kind: "sequential",
            number: 2,
            matchId: "round-2",
            match: { recording: null },
          },
          {
            kind: "extra-time",
            matchId: "extra-time",
            match: { recording: { url: "https://recs.example/extra.hbr2" } },
          },
        ],
      } as never),
    ).toEqual([
      {
        id: "round-1",
        label: "1º tempo",
        url: "https://recs.example/1.hbr2",
      },
      {
        id: "extra-time",
        label: "Prorrogação",
        url: "https://recs.example/extra.hbr2",
      },
    ]);
  });
});
