import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import { EmptyState } from "#/components/ds/app-shell";
import { formatDateTime } from "#/lib/date/format-date-time";
import type { PublicRoomDetail } from "#/lib/rooms/public-room";
import { RoomLiveHero } from "./components/room-live-hero";
import { RoomLiveStage } from "./components/room-live-stage";
import { roomLiveFreshness } from "./room-live-view-model";
import { useLiveRoom } from "./use-live-room";

export function RoomDetailPage({ room }: { room: PublicRoomDetail | null }) {
  if (!room) {
    return <EmptyState title="Sala não encontrada" />;
  }

  return <AvailableRoomDetail room={room} />;
}

function AvailableRoomDetail({ room }: { room: PublicRoomDetail }) {
  useProvisioningRoomRefresh(room.state === "provisioning");
  const { live, observedAt } = useLiveRoom(room.id, room.live);
  const currentRoom = { ...room, live };
  const freshness = roomLiveFreshness(live, observedAt);

  return (
    <>
      <RoomLiveHero room={currentRoom} freshness={freshness} />
      <RoomLiveStage live={live} freshness={freshness} />
      <p className="mt-4 text-center text-xs text-muted-foreground">
        {room.state === "provisioning" ? "Sala solicitada" : "Sala disponível"} em{" "}
        {formatDateTime(room.createdAt)}
      </p>
    </>
  );
}

function useProvisioningRoomRefresh(provisioning: boolean) {
  const router = useRouter();

  useEffect(() => {
    if (!provisioning) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void router.invalidate();
    }, 2_000);

    return () => window.clearInterval(intervalId);
  }, [provisioning, router]);
}
