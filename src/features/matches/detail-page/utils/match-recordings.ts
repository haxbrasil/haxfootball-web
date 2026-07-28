import { matchRoundLabel } from "#/lib/matches/composition-rounds";
import type { WebMatch } from "#/server/api/haxfootball";

export type MatchRecordingOption = {
  id: string;
  label: string;
  url: string;
};

export function matchRecordingOptions(match: WebMatch): MatchRecordingOption[] {
  if (match.kind === "single") {
    return match.recording ? [{ id: match.id, label: "Partida", url: match.recording.url }] : [];
  }

  return match.rounds.flatMap((round) =>
    round.match.recording
      ? [
          {
            id: round.matchId,
            label: matchRoundLabel(round),
            url: round.match.recording.url,
          },
        ]
      : [],
  );
}
