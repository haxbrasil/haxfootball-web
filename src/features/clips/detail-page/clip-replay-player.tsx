import { lazy } from "react";
import type { ReplayFrameWindow } from "@haxbrasil/haxfootball-replay";

const ReplayPlayer = lazy(() => import("#/features/matches/detail-page/components/replay-player"));

export function ClipReplayPlayer({
  source,
  frameWindow,
}: {
  source: string;
  frameWindow: ReplayFrameWindow;
}) {
  return <ReplayPlayer source={source} autoPlay loop frameWindow={frameWindow} />;
}
