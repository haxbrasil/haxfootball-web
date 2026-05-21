import type { ListPlayersResponse } from "@haxbrasil/haxfootball-api-sdk";
import { EmptyState, PageHeader } from "#/components/ds/app-shell";
import { SearchField } from "#/components/ds/forms/search-field";
import { useFilteredList } from "#/hooks/use-filtered-list";
import { PlayersTable } from "./components/players-table";
import { filterPlayers } from "./utils/filter-players";

export { filterPlayers } from "./utils/filter-players";

export function PlayersPage({ players }: { players: ListPlayersResponse }) {
  const { filteredItems, query, setQuery } = useFilteredList(players.items, filterPlayers);

  return (
    <>
      <PageHeader title="Jogadores" description="Lista pública de jogadores registrados." />

      <SearchField
        id="playerSearch"
        label="Buscar"
        value={query}
        onChange={setQuery}
        placeholder="Nome, país ou conta"
      />

      {players.items.length === 0 ? (
        <EmptyState title="Nenhum jogador encontrado" />
      ) : filteredItems.length === 0 ? (
        <EmptyState title="Nenhum jogador corresponde à busca" />
      ) : (
        <PlayersTable players={filteredItems} />
      )}
    </>
  );
}
