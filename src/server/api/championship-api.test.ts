import { beforeEach, describe, expect, it, vi } from "vitest";

const { getApiClientMock } = vi.hoisted(() => ({
  getApiClientMock: vi.fn(),
}));

vi.mock("#/server/api/haxfootball", () => ({
  getApiClient: getApiClientMock,
}));

import {
  getChampionshipWorkspace,
  getPublicChampionshipBySlug,
} from "#/server/api/championship-api";

const championshipUuid = "11111111-1111-4111-8111-111111111111";
const actorAccountUuid = "22222222-2222-4222-8222-222222222222";

describe("championship API compositions", () => {
  beforeEach(() => {
    getApiClientMock.mockReset();
  });

  it("keeps public championship history within the API page bound", async () => {
    const client = championshipClient();
    getApiClientMock.mockReturnValue(client);

    await getPublicChampionshipBySlug("copa-teste");

    expect(client.championships.history.get).toHaveBeenCalledWith(championshipUuid, {
      limit: 100,
    });
  });

  it("keeps workspace history within the API page bound", async () => {
    const client = championshipClient();
    getApiClientMock.mockReturnValue(client);

    await getChampionshipWorkspace(championshipUuid, actorAccountUuid, true);

    expect(client.championships.history.get).toHaveBeenCalledWith(championshipUuid, {
      actorAccountUuid,
      limit: 100,
    });
  });
});

function championshipClient() {
  const success = (data: unknown = {}) => Promise.resolve({ ok: true as const, data });
  const page = { items: [], page: { limit: 100, nextCursor: null } };
  const historyGet = vi.fn(() => success({ placements: page, awards: page, records: [] }));

  return {
    accounts: {
      list: vi.fn(() => success(page)),
    },
    rooms: {
      programs: {
        list: vi.fn(() => success(page)),
      },
    },
    championships: {
      list: vi.fn(() =>
        success({
          items: [{ uuid: championshipUuid }],
          page: { limit: 1, nextCursor: null },
        }),
      ),
      get: vi.fn(() => success({ uuid: championshipUuid })),
      teams: { list: vi.fn(() => success(page)) },
      participants: { list: vi.fn(() => success(page)) },
      teamIdentities: { list: vi.fn(() => success(page)) },
      audit: { list: vi.fn(() => success(page)) },
      salary: {
        getPublic: vi.fn(() => success({})),
        getAdmin: vi.fn(() => success({})),
      },
      rosters: { history: vi.fn(() => success(page)) },
      draft: { get: vi.fn(() => success({})) },
      trades: { list: vi.fn(() => success(page)) },
      format: { get: vi.fn(() => success({})) },
      statistics: { get: vi.fn(() => success({})) },
      registration: { getSelf: vi.fn(() => success({ participant: null })) },
      history: {
        get: historyGet,
        imports: { list: vi.fn(() => success(page)) },
      },
      collaboration: {
        threads: { list: vi.fn(() => success(page)) },
        assignments: { list: vi.fn(() => success(page)) },
        inbox: { list: vi.fn(() => success(page)) },
        savedViews: { list: vi.fn(() => success(page)) },
        presence: { list: vi.fn(() => success([])) },
      },
    },
  };
}
