import { SearchField } from "#/components/ds/forms/search-field";
import { SelectField } from "#/components/ds/forms/select-field";
import type { PubRankingFilters } from "../utils/pub-ranking-filters";

export function PubRankingDialogFilters({
  categoryKey,
  filters,
  onFilterChange,
  onSearchChange,
  search,
}: {
  categoryKey: string;
  filters: PubRankingFilters;
  onFilterChange: <TField extends keyof PubRankingFilters>(
    field: TField,
    value: PubRankingFilters[TField],
  ) => void;
  onSearchChange: (search: string) => void;
  search: string;
}) {
  function handleGroupByChange(groupBy: PubRankingFilters["groupBy"]) {
    onFilterChange("groupBy", groupBy);
  }

  function handleStatusChange(status: PubRankingFilters["status"]) {
    onFilterChange("status", status);
  }

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_180px_180px]">
      <SearchField
        id={`pub-ranking-search-${categoryKey}`}
        label="Buscar"
        placeholder="Buscar por nome"
        value={search}
        onChange={onSearchChange}
      />

      <SelectField
        id={`pub-ranking-group-${categoryKey}`}
        label="Agrupar por"
        value={filters.groupBy}
        onChange={handleGroupByChange}
        options={[
          { value: "account", label: "Conta" },
          { value: "player", label: "Entrada" },
          { value: "account-or-player", label: "Conta ou entrada" },
        ]}
      />

      <SelectField
        id={`pub-ranking-status-${categoryKey}`}
        label="Status"
        value={filters.status}
        onChange={handleStatusChange}
        options={[
          { value: "all", label: "Todos" },
          { value: "completed", label: "Finalizadas" },
          { value: "ongoing", label: "Em andamento" },
        ]}
      />
    </div>
  );
}
