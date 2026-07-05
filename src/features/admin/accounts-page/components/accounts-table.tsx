import type {
  Account,
  ListAccountsResponse,
  ListRolesResponse,
} from "@haxbrasil/haxfootball-api-sdk";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { ResourceTable } from "#/components/ds/resource-table";
import { Button } from "#/components/ui/button";
import { canImpersonateAccount } from "#/lib/auth/impersonation-policy";
import { canAssignRole } from "#/lib/auth/role-assignment-policy";
import { localizedTextLabel } from "#/lib/localization/localized-text";
import type { ApiAccountSession } from "#/server/auth/session";
import { AccountImpersonationAction } from "./account-impersonation-action";
import { AccountRoleForm } from "./account-role-form";

export function AccountsTable({
  accounts,
  roles,
  session,
}: {
  accounts: ListAccountsResponse["items"];
  roles: ListRolesResponse;
  session: ApiAccountSession;
}) {
  const canStartImpersonation =
    !session.impersonation &&
    (session.account.role.bypassAllPermissions ||
      session.account.role.permissions.includes("*") ||
      session.account.role.permissions.includes("account:impersonate"));
  const canUpdateRoles =
    session.account.role.bypassAllPermissions ||
    session.account.role.permissions.includes("*") ||
    session.account.role.permissions.includes("account-role:update");
  const assignableRoles = roles.items.filter((role) =>
    canAssignRole({ actor: session.account, role }),
  );
  const actorRoleUuid = accounts.find((account) => account.uuid === session.account.uuid)?.role
    .uuid;

  function accountAssignableRoles(account: Account) {
    return assignableRoles.filter(
      (role) =>
        !actorRoleUuid ||
        account.uuid === session.account.uuid ||
        role.uuid !== actorRoleUuid ||
        role.uuid === account.role.uuid,
    );
  }

  const columns = [
    { key: "name", title: "Conta", cell: (account: Account) => account.name },
    {
      key: "externalId",
      title: "Discord",
      cell: (account: Account) => <CopyDiscordId account={account} />,
    },
    {
      key: "role",
      title: "Cargo",
      cell: (account: Account) =>
        canUpdateRoles && canAssignRole({ actor: session.account, role: account.role }) ? (
          <AccountRoleForm
            account={account}
            disabledRoleUuid={
              account.uuid === session.account.uuid || !actorRoleUuid ? undefined : actorRoleUuid
            }
            roles={{ ...roles, items: accountAssignableRoles(account) }}
          />
        ) : (
          localizedTextLabel(account.role.title)
        ),
    },
    ...(canStartImpersonation
      ? [
          {
            key: "impersonate",
            title: "Visualizar como",
            cell: (account: Account) =>
              account.uuid !== session.account.uuid &&
              canImpersonateAccount({ actor: session.account, target: account }) ? (
                <AccountImpersonationAction account={account} />
              ) : (
                <span className="text-sm text-muted-foreground">-</span>
              ),
          },
        ]
      : []),
  ];

  return <ResourceTable rows={accounts} columns={columns} />;
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
