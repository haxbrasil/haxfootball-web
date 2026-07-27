import type { Meta, StoryObj } from "@storybook/react-vite";
import type { PublicRoomDetail } from "#/lib/rooms/public-room";
import { RoomLiveHero } from "./components/room-live-hero";
import { RoomLiveStage } from "./components/room-live-stage";
import type { RoomLiveFreshness } from "./room-live-view-model";

const activeRoom: PublicRoomDetail = {
  id: "45dfdb1f-388c-4544-a785-493631941e34",
  name: "BFL | Futebol Americano #1",
  state: "running",
  roomLink: "https://www.haxball.com/play",
  version: "v1.0.83",
  capacity: 30,
  createdAt: "2026-07-25T18:00:00.000Z",
  live: {
    connected: true,
    lastSeenAt: new Date().toISOString(),
    gameStatus: "running",
    score: {
      red: 14,
      blue: 7,
    },
    players: [
      { roomPlayerId: 1, name: "Bruno", team: "red" },
      { roomPlayerId: 2, name: "Caio", team: "red" },
      { roomPlayerId: 3, name: "Davi", team: "red" },
      { roomPlayerId: 4, name: "Enzo", team: "blue" },
      { roomPlayerId: 5, name: "Felipe", team: "blue" },
      { roomPlayerId: 6, name: "Gustavo", team: "blue" },
      { roomPlayerId: 7, name: "Heitor", team: "spectators" },
      { roomPlayerId: 8, name: "Igor", team: "spectators" },
    ],
  },
};

function RoomDetailPreview({
  room,
  freshness,
}: {
  room: PublicRoomDetail;
  freshness: RoomLiveFreshness;
}) {
  return (
    <main className="mx-auto max-w-5xl p-4 sm:p-8">
      <RoomLiveHero room={room} freshness={freshness} />
      <RoomLiveStage live={room.live} freshness={freshness} />
    </main>
  );
}

const meta = {
  title: "Rooms/DetailPage",
  component: RoomDetailPreview,
} satisfies Meta<typeof RoomDetailPreview>;

export default meta;

type Story = StoryObj<typeof meta>;

export const AoVivo: Story = {
  args: {
    room: activeRoom,
    freshness: "live",
  },
};

export const SemTelemetria: Story = {
  args: {
    room: {
      ...activeRoom,
      live: null,
    },
    freshness: "unavailable",
  },
};

export const Abrindo: Story = {
  args: {
    room: {
      ...activeRoom,
      state: "provisioning",
      roomLink: null,
      live: null,
    },
    freshness: "unavailable",
  },
};
