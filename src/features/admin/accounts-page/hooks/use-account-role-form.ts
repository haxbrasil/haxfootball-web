import { useEffect, useState } from "react";
import type { Account } from "@haxbrasil/haxfootball-api-sdk";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import type { FormMessage } from "#/components/ds/forms/form-message";
import { updateAccountRoleFn } from "#/server/api/functions";

export function useAccountRoleForm(account: Account) {
  const router = useRouter();
  const updateAccountRole = useServerFn(updateAccountRoleFn);
  const [message, setMessage] = useState<FormMessage | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRoleUuid, setSelectedRoleUuid] = useState(account.role.uuid);

  useEffect(() => {
    setSelectedRoleUuid(account.role.uuid);
  }, [account.role.uuid]);

  async function updateRole(roleUuid: string) {
    if (roleUuid === selectedRoleUuid || isSubmitting) {
      return;
    }

    const previousRoleUuid = selectedRoleUuid;
    setSelectedRoleUuid(roleUuid);
    setMessage(null);
    setIsSubmitting(true);

    const result = await updateAccountRole({
      data: {
        accountUuid: account.uuid,
        roleUuid,
      },
    });

    setIsSubmitting(false);

    if (!result.ok) {
      setSelectedRoleUuid(previousRoleUuid);
      setMessage({ kind: "error", text: result.message });

      return;
    }

    await router.invalidate();
  }

  return { isSubmitting, message, selectedRoleUuid, updateRole };
}
