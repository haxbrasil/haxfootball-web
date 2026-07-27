import { WifiOff } from "lucide-react";
import { cn } from "#/lib/utils";
import type { PublicLiveRoom } from "#/lib/rooms/public-room";
import {
  groupLiveRoomPlayers,
  roomGameStatusLabel,
  type RoomLiveFreshness,
} from "../room-live-view-model";
import { LiveTeamRoster } from "./live-team-roster";
import { RoomSpectators } from "./room-spectators";

export function RoomLiveStage({
  live,
  freshness,
}: {
  live: PublicLiveRoom | null;
  freshness: RoomLiveFreshness;
}) {
  const rosters = groupLiveRoomPlayers(live?.players ?? []);
  const statusLabel = roomGameStatusLabel(live);
  const scoreLabel = live?.score
    ? `Placar: Red ${live.score.red}, Blue ${live.score.blue}`
    : "Placar indisponível";
  const isHistorical = freshness === "offline" || freshness === "delayed";

  return (
    <section
      className={cn(
        "bfl-panel overflow-hidden rounded-xl border shadow-lg transition-opacity",
        isHistorical ? "opacity-80" : null,
      )}
      aria-label="Acompanhamento da sala"
    >
      {isHistorical ? (
        <div className="flex items-center justify-center gap-2 border-b border-border/80 bg-muted/45 px-4 py-2 text-xs font-medium text-muted-foreground">
          <WifiOff className="size-3.5" aria-hidden="true" />
          {freshness === "offline"
            ? "Exibindo a última atualização recebida"
            : "As informações ao vivo podem estar atrasadas"}
        </div>
      ) : null}

      <div className="grid min-h-44 grid-cols-[1fr_auto_1fr]">
        <div className="grid content-center justify-items-center gap-2 bg-red-500/[0.07] p-4 sm:p-6">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-red-700 dark:text-red-300">
            Red
          </span>
          <strong className="font-mono text-4xl tabular-nums sm:text-6xl" aria-hidden="true">
            {live?.score?.red ?? "—"}
          </strong>
        </div>

        <div className="grid w-28 content-center justify-items-center gap-2 border-x border-border/80 bg-background/65 px-2 text-center sm:w-44">
          <span className="sr-only" aria-live="polite">
            {scoreLabel}. {statusLabel}.
          </span>
          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Placar
          </span>
          <span className="text-sm font-semibold leading-5 sm:text-base">{statusLabel}</span>
        </div>

        <div className="grid content-center justify-items-center gap-2 bg-blue-500/[0.07] p-4 sm:p-6">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700 dark:text-blue-300">
            Blue
          </span>
          <strong className="font-mono text-4xl tabular-nums sm:text-6xl" aria-hidden="true">
            {live?.score?.blue ?? "—"}
          </strong>
        </div>
      </div>

      {live ? (
        <>
          <div className="grid border-t border-border/80 md:grid-cols-2 md:divide-x md:divide-border/80">
            <LiveTeamRoster team="red" players={rosters.red} />
            <LiveTeamRoster team="blue" players={rosters.blue} />
          </div>
          <RoomSpectators players={rosters.spectators} />
        </>
      ) : (
        <div className="border-t border-border/80 px-5 py-8 text-center">
          <p className="font-medium">Informações ao vivo ainda não disponíveis</p>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            A sala continua disponível. O placar e os jogadores aparecerão aqui assim que a conexão
            ao vivo for estabelecida.
          </p>
        </div>
      )}
    </section>
  );
}
