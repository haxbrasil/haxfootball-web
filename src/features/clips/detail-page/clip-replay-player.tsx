import { lazy, useCallback, useRef, useState } from "react";
import type { ReplayFrameWindow } from "@haxbrasil/haxfootball-replay";

const ReplayPlayer = lazy(() => import("#/features/matches/detail-page/components/replay-player"));

export function ClipReplayPlayer({
  source,
  frameWindow,
}: {
  source: string;
  frameWindow: ReplayFrameWindow;
}) {
  const [iteration, setIteration] = useState(0);
  const restarting = useRef(false);

  const handleFrameChange = useCallback(
    (frame: number) => {
      if (frame < frameWindow.endFrame) {
        restarting.current = false;
        return;
      }

      if (restarting.current) {
        return;
      }

      restarting.current = true;
      setIteration((value) => value + 1);
    },
    [frameWindow.endFrame],
  );

  return (
    <ReplayPlayer
      key={iteration}
      source={source}
      autoPlay
      frameWindow={frameWindow}
      onFrameChange={handleFrameChange}
    />
  );
}
