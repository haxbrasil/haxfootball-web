import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { PublicLiveRoom } from "#/lib/rooms/public-room";
import { RoomLiveStage } from "./room-live-stage";

describe("RoomLiveStage", () => {
  it("shows the current score and separates players by team", () => {
    const live: PublicLiveRoom = {
      connected: true,
      lastSeenAt: "2026-07-25T18:02:00.000Z",
      gameStatus: "running",
      score: {
        red: 14,
        blue: 7,
      },
      players: [
        {
          roomPlayerId: 2,
          name: "Red quarterback",
          team: "red",
        },
        {
          roomPlayerId: 5,
          name: "Blue receiver",
          team: "blue",
        },
        {
          roomPlayerId: 8,
          name: "Waiting player",
          team: "spectators",
        },
      ],
    };

    render(<RoomLiveStage live={live} freshness="live" />);

    expect(screen.getByText("Placar: Red 14, Blue 7. Jogo em andamento.")).not.toBeNull();
    expect(
      within(screen.getByLabelText("Jogadores do time Red")).getByText("Red quarterback"),
    ).not.toBeNull();
    expect(
      within(screen.getByLabelText("Jogadores do time Blue")).getByText("Blue receiver"),
    ).not.toBeNull();
    expect(
      within(screen.getByLabelText("Espectadores na sala")).getByText("Waiting player"),
    ).not.toBeNull();
  });

  it("clearly marks a retained snapshot as historical when the connection stops", () => {
    const live: PublicLiveRoom = {
      connected: false,
      lastSeenAt: "2026-07-25T17:55:00.000Z",
      gameStatus: "paused",
      score: {
        red: 21,
        blue: 21,
      },
      players: [],
    };

    render(<RoomLiveStage live={live} freshness="offline" />);

    expect(screen.getByText("Exibindo a última atualização recebida")).not.toBeNull();
    expect(screen.getByText("Jogo pausado")).not.toBeNull();
  });

  it("shows an intentional fallback before the first live snapshot", () => {
    render(<RoomLiveStage live={null} freshness="unavailable" />);

    expect(screen.getByText("Informações ao vivo ainda não disponíveis")).not.toBeNull();
    expect(
      screen.getByText(
        "A sala continua disponível. O placar e os jogadores aparecerão aqui assim que a conexão ao vivo for estabelecida.",
      ),
    ).not.toBeNull();
    expect(screen.getAllByText("—")).toHaveLength(2);
  });
});
