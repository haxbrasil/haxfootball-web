import type { Account, ListRolesResponse } from "@haxbrasil/haxfootball-api-sdk";
import { FormMessageAlert } from "#/components/ds/forms/form-message";
import { Button } from "#/components/ui/button";
import { NativeSelect, NativeSelectOption } from "#/components/ui/native-select";
import { useAccountRoleForm } from "../hooks/use-account-role-form";

export function AccountRoleForm({
  account,
  roles,
}: {
  account: Account;
  roles: ListRolesResponse;
}) {
  const form = useAccountRoleForm(account);

  return (
    <form className="grid min-w-56 gap-2" onSubmit={form.submit}>
      <div className="flex gap-2">
        <NativeSelect
          name="roleUuid"
          defaultValue={account.role.uuid}
          className="min-w-36"
          aria-label={`Cargo de ${account.name}`}
        >
          {roles.items.map((role) => (
            <NativeSelectOption key={role.uuid} value={role.uuid}>
              {role.title}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <Button size="sm" disabled={form.isSubmitting} type="submit">
          Salvar
        </Button>
      </div>
      {form.message ? <FormMessageAlert message={form.message} /> : null}
    </form>
  );
}
