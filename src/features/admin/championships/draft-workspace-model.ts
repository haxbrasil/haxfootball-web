import type { ChampionshipDraft, ChampionshipTrade } from "@haxbrasil/haxfootball-api-sdk";
import type { Serializable } from "#/server/api/championship-api";

export type DraftProjection = Serializable<ChampionshipDraft>;
export type Draft = NonNullable<DraftProjection["draft"]>;
export type DraftTurn = Draft["turns"]["items"][number];
export type DraftTeam = Draft["teams"][number];
export type DraftParticipant = Draft["availableParticipants"]["items"][number];
export type TradeProjection = Serializable<ChampionshipTrade>;

export function numberValue(value: number | string | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }

  const result = Number(value);

  return Number.isFinite(result) ? result : 0;
}

export function secondsUntil(deadlineAt: string | null | undefined, nowMs: number): number | null {
  if (!deadlineAt) {
    return null;
  }

  return Math.max(0, Math.ceil((new Date(deadlineAt).getTime() - nowMs) / 1_000));
}

export function countdownLabel(seconds: number | null): string {
  if (seconds === null) {
    return "Sem cronômetro";
  }

  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

export function eligibleTurns(draft: Draft): DraftTurn[] {
  const ids = new Set(draft.actor.eligibleTurnIds);

  return draft.turns.items.filter((turn) => ids.has(turn.uuid));
}

export function activeTurn(draft: Draft): DraftTurn | null {
  return (
    draft.turns.items.find((turn) => turn.state === "open") ??
    draft.turns.items.find((turn) => turn.state === "overdue") ??
    null
  );
}

export function overdueTurns(draft: Draft): DraftTurn[] {
  return draft.turns.items.filter((turn) => turn.state === "overdue");
}

export function filledTurns(draft: Draft): DraftTurn[] {
  return draft.turns.items
    .filter((turn) => turn.state === "filled")
    .sort((left, right) => numberValue(right.sequence) - numberValue(left.sequence));
}

export function roundDirection(round: number): "forward" | "reverse" {
  return round % 2 === 0 ? "reverse" : "forward";
}

export function teamCapPercent(team: DraftTeam, capUnits: number): number {
  if (capUnits <= 0) {
    return 0;
  }

  return Math.min(100, Math.max(0, (numberValue(team.usageUnits) / capUnits) * 100));
}

export function projectedTeamCap(
  team: DraftTeam,
  participant: DraftParticipant,
  capUnits: number,
): {
  usageUnits: number;
  remainingUnits: number;
  overCap: boolean;
} {
  const usageUnits = numberValue(team.usageUnits) + numberValue(participant.priceUnits);

  return {
    usageUnits,
    remainingUnits: capUnits - usageUnits,
    overCap: capUnits > 0 && usageUnits > capUnits,
  };
}

export function draftReadiness(
  draft: Draft | null,
  registrationState: string,
  pricesLocked: boolean,
) {
  const checks = [
    { key: "configured", label: "Ordem e rodadas configuradas", ready: draft !== null },
    {
      key: "registration",
      label: "Inscrições encerradas",
      ready: registrationState === "closed",
    },
    { key: "prices", label: "Valores congelados", ready: pricesLocked },
    {
      key: "gms",
      label: "Todas as equipes têm GM",
      ready: draft
        ? draft.teams.every((team) => team.roster.some((member) => member.role === "gm"))
        : false,
    },
  ];

  return {
    checks,
    ready: checks.every((check) => check.ready),
  };
}

export function tradeBalance(trade: TradeProjection) {
  const proposing = numberValue(trade.proposingValueUnits);
  const receiving = numberValue(trade.receivingValueUnits);

  return {
    proposing,
    receiving,
    difference: Math.abs(proposing - receiving),
    withinLimit:
      Math.abs(proposing - receiving) <= numberValue(trade.maximumDifferenceUnitsSnapshot),
  };
}

export function participantSearch(
  participants: DraftParticipant[],
  query: string,
): DraftParticipant[] {
  const normalized = query.trim().toLocaleLowerCase("pt-BR");

  if (!normalized) {
    return participants;
  }

  return participants.filter((participant) =>
    participant.displayName.toLocaleLowerCase("pt-BR").includes(normalized),
  );
}

export function turnStateLabel(state: DraftTurn["state"]): string {
  return {
    pending: "Aguardando",
    open: "Na vez",
    overdue: "Atrasada",
    filled: "Escolha feita",
    voided: "Anulada",
  }[state];
}
