import { Badge } from "#/components/ui/badge";
import type { ApiAccountSession } from "#/server/auth/session";

export function AccountPermissionBadges({ role }: { role: ApiAccountSession["account"]["role"] }) {
  if (role.bypassAllPermissions) {
    return <Badge>Todas permissões</Badge>;
  }

  if (role.permissions.length === 0) {
    return <Badge variant="secondary">Sem permissões</Badge>;
  }

  return role.permissions.map((permission) => <Badge key={permission}>{permission}</Badge>);
}
