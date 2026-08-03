import { numberValue, type Draft } from "./draft-workspace-model";

export type RecordedSlot = {
  sequence: number;
  round: number;
  position: number;
  teamId: string;
  participantId: string | null;
  resolution: "selected" | "unresolved" | "skipped";
};

export function buildRecordedSlots(
  teamIds: string[],
  rounds: number,
  draft: Draft | null,
): RecordedSlot[] {
  const existing = draft ? draft.turns.items : [];
  const slots: RecordedSlot[] = [];
  for (let round = 1; round <= rounds; round += 1) {
    const orderedTeamIds = round % 2 === 0 ? [...teamIds].reverse() : teamIds;
    orderedTeamIds.forEach((teamId, positionIndex) => {
      const sequence = (round - 1) * teamIds.length + positionIndex + 1;
      const turn = existing.find(
        (item) => numberValue(item.round) === round && item.team.uuid === teamId,
      );
      const participantId = turn?.selectedParticipant?.uuid ?? null;
      slots.push({
        sequence,
        round,
        position: positionIndex + 1,
        teamId,
        participantId,
        resolution: participantId ? "selected" : "unresolved",
      });
    });
  }
  return slots;
}

export function rebuildRecordedSlots(
  teamIds: string[],
  rounds: number,
  current: RecordedSlot[],
): RecordedSlot[] {
  const byRoundTeam = new Map(current.map((slot) => [`${slot.round}:${slot.teamId}`, slot]));
  return buildRecordedSlots(teamIds, rounds, null).map((slot) => {
    const previous = byRoundTeam.get(`${slot.round}:${slot.teamId}`);
    return previous
      ? { ...slot, participantId: previous.participantId, resolution: previous.resolution }
      : slot;
  });
}
