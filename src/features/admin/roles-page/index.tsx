import type { ListPermissionsResponse, ListRolesResponse } from "@haxbrasil/haxfootball-api-sdk";
import type { Role } from "@haxbrasil/haxfootball-api-sdk";
import { useEffect, useState } from "react";
import { EmptyState, PageHeader } from "#/components/ds/app-shell";
import { SearchField } from "#/components/ds/forms/search-field";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { useFilteredList } from "#/hooks/use-filtered-list";
import { cn } from "#/lib/utils";
import { localizedTextLabel } from "#/lib/localization/localized-text";
import { CreateRoleCard } from "./components/create-role-card";
import { RolePermissionsCard } from "./components/role-permissions-card";
import { filterRoles } from "./utils/filter-roles";

export function AdminRolesPage({
  roles,
  permissions,
}: {
  roles: ListRolesResponse;
  permissions: ListPermissionsResponse;
}) {
  const [selectedRoleUuid, setSelectedRoleUuid] = useState<string | null>(
    roles.items[0]?.uuid ?? null,
  );
  const { filteredItems, query, setQuery } = useFilteredList(roles.items, filterRoles);
  const selectedRole =
    roles.items.find((role) => role.uuid === selectedRoleUuid) ?? filteredItems[0] ?? null;

  useEffect(() => {
    if (roles.items.length === 0) {
      setSelectedRoleUuid(null);
      return;
    }

    if (!selectedRoleUuid || !roles.items.some((role) => role.uuid === selectedRoleUuid)) {
      setSelectedRoleUuid(roles.items[0]?.uuid ?? null);
    }
  }, [roles.items, selectedRoleUuid]);

  return (
    <>
      <PageHeader
        title="Cargos"
        description="Gerenciamento de cargos e permissões."
        action={
          <CreateRoleCard
            permissions={permissions.items}
            onCreated={(role) => setSelectedRoleUuid(role.uuid)}
          />
        }
      />

      {roles.items.length === 0 ? (
        <EmptyState title="Nenhum cargo encontrado" />
      ) : (
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(18rem,24rem)_1fr]">
          <section className="bfl-panel rounded-xl border p-4">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">Cargos</h2>
                <p className="text-sm text-muted-foreground">{roles.items.length} cadastrados</p>
              </div>
              <Badge variant="outline">{filteredItems.length}</Badge>
            </div>

            <SearchField
              id="roleSearch"
              label="Buscar"
              value={query}
              onChange={setQuery}
              placeholder="Cargo ou permissão"
            />

            <div className="bfl-scrollbar pr-3">
              {filteredItems.length === 0 ? (
                <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                  Nenhum cargo encontrado para essa busca.
                </p>
              ) : (
                <div className="grid gap-2">
                  {filteredItems.map((role) => (
                    <RoleListItem
                      key={role.uuid}
                      role={role}
                      selected={role.uuid === selectedRole?.uuid}
                      onSelect={() => setSelectedRoleUuid(role.uuid)}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

          {selectedRole ? (
            <RolePermissionsCard
              key={selectedRole.uuid}
              role={selectedRole}
              permissions={permissions.items}
            />
          ) : (
            <EmptyState title="Selecione um cargo" />
          )}
        </div>
      )}
    </>
  );
}

function RoleListItem({
  role,
  selected,
  onSelect,
}: {
  role: Role;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      className={cn(
        "h-auto w-full justify-start rounded-md border px-3 py-3 text-left",
        selected ? "border-primary/60 bg-primary/10" : "border-border bg-background/35",
      )}
      onClick={onSelect}
    >
      <span className="grid min-w-0 flex-1 gap-1">
        <span className="truncate text-sm font-semibold">{localizedTextLabel(role.title)}</span>
        <span className="truncate font-mono text-xs text-muted-foreground">{role.name}</span>
      </span>
      <span className="flex shrink-0 items-center justify-end gap-1.5">
        {role.bypassAllPermissions ? (
          <Badge>Todas</Badge>
        ) : (
          <Badge variant="outline">{role.permissions.length}</Badge>
        )}
        {role.isDefault ? <Badge variant="secondary">Padrão</Badge> : null}
      </span>
    </Button>
  );
}
