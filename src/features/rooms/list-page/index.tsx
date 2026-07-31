import { DataGrid } from "#/components/ds/app-shell";
import { EmptyLeagueState } from "#/components/ds/empty-league-state";
import { LeagueHeader } from "#/components/ds/league-header";
import { Skeleton } from "#/components/ui/skeleton";
import type { ListPublicRoomsResponse } from "#/server/api/haxfootball";
import { RoomCard } from "./components/room-card";

export function RoomsPage({ rooms }: { rooms: ListPublicRoomsResponse }) {
  return (
    <>
      <LeagueHeader
        title="Salas"
        eyebrow={null}
        showBrand={false}
        description="Salas públicas disponíveis para acompanhar ou entrar."
      />
      {rooms.items.length === 0 ? (
        <EmptyLeagueState
          title="Nenhuma sala encontrada"
          body="Quando uma sala estiver disponível, o status e o link aparecem aqui."
        />
      ) : (
        <DataGrid>
          {rooms.items.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </DataGrid>
      )}
    </>
  );
}

export function RoomsPageSkeleton() {
  return (
    <div className="space-y-6" aria-label="Carregando salas">
      <Skeleton className="h-36 w-full rounded-xl" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-48 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
