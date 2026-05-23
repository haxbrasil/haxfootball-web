import type { Account } from "@haxbrasil/haxfootball-api-sdk";
import { describe, expect, it } from "vitest";
import { filterAccounts } from "./filter-accounts";

const accounts: Account[] = [
  {
    createdAt: "2026-01-01T00:00:00.000Z",
    externalId: "discord-1",
    name: "Gab",
    role: {
      bypassAllPermissions: false,
      createdAt: "2026-01-01T00:00:00.000Z",
      isDefault: false,
      name: "admin",
      permissions: ["room:admin"],
      title: {
        label: "Admin",
        value: "role.admin.title",
      },
      updatedAt: "2026-01-01T00:00:00.000Z",
      uuid: "role-admin",
    },
    updatedAt: "2026-01-01T00:00:00.000Z",
    uuid: "account-1",
  },
  {
    createdAt: "2026-01-01T00:00:00.000Z",
    externalId: "discord-2",
    name: "Player",
    role: {
      bypassAllPermissions: false,
      createdAt: "2026-01-01T00:00:00.000Z",
      isDefault: true,
      name: "player",
      permissions: [],
      title: {
        label: "Jogador",
        value: "role.player.title",
      },
      updatedAt: "2026-01-01T00:00:00.000Z",
      uuid: "role-player",
    },
    updatedAt: "2026-01-01T00:00:00.000Z",
    uuid: "account-2",
  },
];

describe("filterAccounts", () => {
  it("filters by account name, external id, and role", () => {
    expect(filterAccounts(accounts, "gab")).toEqual([accounts[0]]);
    expect(filterAccounts(accounts, "discord-2")).toEqual([accounts[1]]);
    expect(filterAccounts(accounts, "jogador")).toEqual([accounts[1]]);
  });

  it("returns all accounts for an empty query", () => {
    expect(filterAccounts(accounts, " ")).toEqual(accounts);
  });
});
