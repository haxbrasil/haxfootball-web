import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import type { ApiAccountSession } from "#/server/auth/session";
import { AccountPermissionBadges } from "./account-permission-badges";
import { AccountRow } from "./account-row";

export function AccountSessionCard({ session }: { session: ApiAccountSession }) {
  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>{session.account.name}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm">
        <AccountRow label="Origem" value={session.source === "discord" ? "Discord" : "Senha"} />
        <AccountRow label="Cargo" value={session.account.role.title} />
        <AccountRow label="UUID" value={session.account.uuid} />
        <div className="flex flex-wrap gap-2">
          <AccountPermissionBadges role={session.account.role} />
        </div>
      </CardContent>
    </Card>
  );
}
