import type {
  Account,
  ListAccountsResponse,
  ListRolesResponse,
} from "@haxbrasil/haxfootball-api-sdk";
import { ResourceTable } from "#/components/ds/resource-table";
import { AccountRoleForm } from "./account-role-form";

export function AccountsTable({
  accounts,
  roles,
}: {
  accounts: ListAccountsResponse["items"];
  roles: ListRolesResponse;
}) {
  return (
    <ResourceTable
      rows={accounts}
      columns={[
        { key: "name", title: "Conta", cell: (account: Account) => account.name },
        { key: "externalId", title: "Discord", cell: (account) => account.externalId },
        { key: "role", title: "Cargo atual", cell: (account) => account.role.title },
        {
          key: "assign",
          title: "Trocar cargo",
          cell: (account) => <AccountRoleForm account={account} roles={roles} />,
        },
      ]}
    />
  );
}
