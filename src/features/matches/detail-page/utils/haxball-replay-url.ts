const HAXBALL_REPLAY_BASE_URL = "https://www.haxball.com/replay?v=3";

export function createHaxBallReplayUrl(recordingUrl: string): string {
  return `${HAXBALL_REPLAY_BASE_URL}#${recordingUrl}`;
}
