import { describe, expect, it } from "vitest";
import {
  cadenceLabel,
  championshipDateRange,
  championshipLifecycleLabel,
  matchFormatLabel,
  registrationLabel,
} from "./championship-labels";

describe("championship labels", () => {
  it.each([
    ["setup", "Em preparação"],
    ["active", "Em andamento"],
    ["completed", "Concluído"],
    ["archived", "Arquivado"],
    ["canceled", "Cancelado"],
  ] as const)("localizes lifecycle %s", (state, label) => {
    expect(championshipLifecycleLabel(state)).toBe(label);
  });

  it.each([
    ["not-open", "Inscrições ainda não abertas"],
    ["open", "Inscrições abertas"],
    ["closed", "Inscrições encerradas"],
  ] as const)("localizes registration state %s", (state, label) => {
    expect(registrationLabel(state)).toBe(label);
  });

  it("keeps configured competition names separate from cadence labels", () => {
    expect(cadenceLabel("multi-day")).toBe("Competição de vários dias");
    expect(cadenceLabel(null)).toBeNull();
  });

  it("describes one period without pluralization", () => {
    expect(
      matchFormatLabel({
        match: {
          sequentialRoundCount: 1,
          switchSides: false,
          drawPolicy: "allowed",
          overtimePolicy: "disabled",
          overtimeRuleLabel: null,
          fullForfeitScore: { winner: 3, loser: 0 },
        },
        roster: { minimumSize: 0, maximumSize: 8, lockPolicy: "unlocked" },
        salary: {
          enabled: false,
          capUnits: 0,
          displayLabel: "moedas",
          maximumTradeDifference: 0,
        },
        draft: { rounds: 1, countdownSeconds: 90, publicPrices: true },
        scheduling: {
          authority: "staff",
          proposalMode: "exact-time",
          latePlayPolicy: "forbidden",
        },
      }),
    ).toBe("1 tempo");
  });

  it("includes overtime for a two-period cup match", () => {
    expect(
      matchFormatLabel({
        match: {
          sequentialRoundCount: 2,
          switchSides: true,
          drawPolicy: "overtime",
          overtimePolicy: "separate-period",
          overtimeRuleLabel: "Gol de ouro",
          fullForfeitScore: { winner: 3, loser: 0 },
        },
        roster: { minimumSize: 4, maximumSize: 8, lockPolicy: "draft-start" },
        salary: {
          enabled: true,
          capUnits: 100,
          displayLabel: "moedas",
          maximumTradeDifference: 10,
        },
        draft: { rounds: 7, countdownSeconds: 90, publicPrices: true },
        scheduling: {
          authority: "staff-and-gms",
          proposalMode: "both",
          latePlayPolicy: "staff-approval",
        },
      }),
    ).toBe("2 tempos + prorrogação");
  });

  it("formats partial and unknown date ranges", () => {
    expect(championshipDateRange(null, null)).toBe("Datas a definir");
    expect(championshipDateRange("2026-08-01T12:00:00.000Z", null)).toMatch(/^A partir de /);
    expect(championshipDateRange(null, "2026-08-08T12:00:00.000Z")).toMatch(/^Até /);
  });
});
