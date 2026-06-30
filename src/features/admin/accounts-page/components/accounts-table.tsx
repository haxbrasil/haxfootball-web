import type {
  Account,
  ListAccountsResponse,
  ListRolesResponse,
} from "@haxbrasil/haxfootball-api-sdk";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { ResourceTable } from "#/components/ds/resource-table";
import { Button } from "#/components/ui/button";
import { localizedTextLabel } from "#/lib/localization/localized-text";
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
        {
          key: "externalId",
          title: "Discord",
          cell: (account) => <CopyDiscordId account={account} />,
        },
        {
          key: "role",
          title: "Cargo atual",
          cell: (account) => localizedTextLabel(account.role.title),
        },
        {
          key: "assign",
          title: "Trocar cargo",
          cell: (account) => <AccountRoleForm account={account} roles={roles} />,
        },
      ]}
    />
  );
}

function CopyDiscordId({ account }: { account: Account }) {
  const [copied, setCopied] = useState(false);

  async function copyDiscordId() {
    await navigator.clipboard.writeText(account.externalId);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={copyDiscordId}
      title={`Copiar ID do Discord de ${account.name}`}
    >
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      {copied ? "Copiado" : "Copiar ID"}
    </Button>
  );
}
