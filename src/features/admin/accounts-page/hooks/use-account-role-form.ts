import type { FormEvent } from "react";
import { useState } from "react";
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

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const result = await updateAccountRole({
      data: {
        accountUuid: account.uuid,
        roleUuid: String(formData.get("roleUuid") ?? ""),
      },
    });

    setIsSubmitting(false);

    if (!result.ok) {
      setMessage({ kind: "error", text: result.message });

      return;
    }

    setMessage({ kind: "success", text: "Cargo atualizado." });
    await router.invalidate();
  }

  return { isSubmitting, message, submit };
}
