import type { Meta, StoryObj } from "@storybook/react-vite";
import type { PublicLiveRoom } from "#/lib/rooms/public-room";
import { RoomLiveStage } from "./room-live-stage";

const activeRoom: PublicLiveRoom = {
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
};

const meta = {
  title: "Rooms/LiveStage",
  component: RoomLiveStage,
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-5xl p-4 sm:p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RoomLiveStage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const JogoEmAndamento: Story = {
  args: {
    live: activeRoom,
    freshness: "live",
  },
};

export const JogoPausado: Story = {
  args: {
    live: {
      ...activeRoom,
      gameStatus: "paused",
    },
    freshness: "live",
  },
};

export const AtualizacaoInterrompida: Story = {
  args: {
    live: {
      ...activeRoom,
      connected: false,
    },
    freshness: "offline",
  },
};

export const SemTelemetria: Story = {
  args: {
    live: null,
    freshness: "unavailable",
  },
};
