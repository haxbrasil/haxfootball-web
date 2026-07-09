import type { Account, ListRolesResponse } from "@haxbrasil/haxfootball-api-sdk";
import { InlineFormMessage } from "#/components/ds/forms/form-message";
import { NativeSelect, NativeSelectOption } from "#/components/ui/native-select";
import { Spinner } from "#/components/ui/spinner";
import { localizedTextLabel } from "#/lib/localization/localized-text";
import { useAccountRoleForm } from "../hooks/use-account-role-form";

export function AccountRoleForm({
  account,
  roles,
  disabledRoleUuid,
}: {
  account: Account;
  roles: ListRolesResponse;
  disabledRoleUuid?: string;
}) {
  const form = useAccountRoleForm(account);

  return (
    <div className="flex min-w-56 flex-wrap items-center gap-2">
      <NativeSelect
        value={form.selectedRoleUuid}
        onChange={(event) => form.updateRole(event.target.value)}
        disabled={form.isSubmitting}
        className="min-w-44"
        aria-label={`Cargo de ${account.name}`}
      >
        {roles.items.map((role) => (
          <NativeSelectOption
            key={role.uuid}
            value={role.uuid}
            disabled={role.uuid === disabledRoleUuid}
          >
            {localizedTextLabel(role.title)}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      {form.isSubmitting ? (
        <Spinner className="text-muted-foreground" aria-label="Salvando cargo" />
      ) : form.message ? (
        <InlineFormMessage message={form.message} />
      ) : null}
    </div>
  );
}
