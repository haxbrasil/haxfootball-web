import type { ChampionshipRules } from "@haxbrasil/haxfootball-api-sdk";

export const defaultChampionshipRules = {
  match: {
    sequentialRoundCount: 2,
    switchSides: true,
    drawPolicy: "overtime",
    overtimePolicy: "separate-period",
    overtimeRuleLabel: "Gol de ouro ou limite definido pela organização",
    fullForfeitScore: {
      winner: 3,
      loser: 0,
    },
  },
  roster: {
    minimumSize: 4,
    maximumSize: 8,
    lockPolicy: "draft-start",
  },
  salary: {
    enabled: true,
    capUnits: 100,
    displayLabel: "M",
    maximumTradeDifference: 10,
  },
  draft: {
    rounds: 7,
    countdownSeconds: 90,
    publicPrices: true,
  },
  scheduling: {
    authority: "staff-and-gms",
    proposalMode: "both",
    latePlayPolicy: "staff-approval",
  },
} satisfies ChampionshipRules;
