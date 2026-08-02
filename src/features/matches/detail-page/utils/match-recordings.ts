import { matchRoundLabel } from "#/lib/matches/composition-rounds";
import type { WebMatch } from "#/server/api/haxfootball";

export type MatchRecordingOption = {
  id: string;
  label: string;
  url: string;
  format: "hbr2" | "hbrx" | null;
};

export function matchRecordingOptions(match: WebMatch): MatchRecordingOption[] {
  if (match.kind === "single") {
    return match.recording
      ? [
          {
            id: match.recording.id,
            label: "Partida",
            url: match.recording.url,
            format: match.recording.format,
          },
        ]
      : [];
  }

  return match.rounds.flatMap((round) =>
    round.match.recording
      ? [
          {
            id: round.match.recording.id,
            label: matchRoundLabel(round),
            url: round.match.recording.url,
            format: round.match.recording.format,
          },
        ]
      : [],
  );
}
