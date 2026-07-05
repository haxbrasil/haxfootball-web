import { useState } from "react";
import type { Account } from "@haxbrasil/haxfootball-api-sdk";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import type { FormMessage } from "#/components/ds/forms/form-message";
import { notifyAccountSessionChanged } from "#/features/account/utils/session-events";
import { startImpersonationFn } from "#/server/auth/functions";

export function useImpersonateAccountAction(account: Account) {
  const navigate = useNavigate();
  const router = useRouter();
  const startImpersonation = useServerFn(startImpersonationFn);
  const [message, setMessage] = useState<FormMessage | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit() {
    setMessage(null);
    setIsSubmitting(true);

    const result = await startImpersonation({
      data: {
        accountUuid: account.uuid,
      },
    });

    setIsSubmitting(false);

    if (!result.ok) {
      setMessage({ kind: "error", text: result.message });

      return;
    }

    notifyAccountSessionChanged();
    await router.invalidate();
    await navigate({ to: "/account" });
  }

  return { isSubmitting, message, submit };
}
