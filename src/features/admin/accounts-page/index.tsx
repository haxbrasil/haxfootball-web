import type { ListAccountsResponse, ListRolesResponse } from "@haxbrasil/haxfootball-api-sdk";
import { PageHeader } from "#/components/ds/app-shell";
import { SearchField } from "#/components/ds/forms/search-field";
import { useFilteredList } from "#/hooks/use-filtered-list";
import { AccountsTable } from "./components/accounts-table";
import { filterAccounts } from "./utils/filter-accounts";

export { filterAccounts } from "./utils/filter-accounts";

export function AdminAccountsPage({
  accounts,
  roles,
}: {
  accounts: ListAccountsResponse;
  roles: ListRolesResponse;
}) {
  const { filteredItems, query, setQuery } = useFilteredList(accounts.items, filterAccounts);

  return (
    <>
      <PageHeader
        title="Contas"
        description="Busca, inspeção e troca de cargo das contas da API."
      />

      <SearchField
        id="accountSearch"
        label="Buscar"
        value={query}
        onChange={setQuery}
        placeholder="Nome, Discord ou cargo"
      />

      <AccountsTable accounts={filteredItems} roles={roles} />
    </>
  );
}
