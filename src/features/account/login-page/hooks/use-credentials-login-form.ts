import type { FormEvent } from "react";
import { useState } from "react";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { loginWithCredentialsFn } from "#/server/auth/functions";
import { notifyAccountSessionChanged } from "#/features/account/utils/session-events";
import { getCredentialsLoginErrorMessage } from "../utils/get-credentials-login-error-message";

export function useCredentialsLoginForm() {
  const navigate = useNavigate();
  const router = useRouter();
  const loginWithCredentials = useServerFn(loginWithCredentialsFn);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
      const result = await loginWithCredentials({
        data: {
          name: String(formData.get("name") ?? ""),
          password: String(formData.get("password") ?? ""),
        },
      });

      if (!result.ok) {
        setMessage(result.message);
        setIsSubmitting(false);

        return;
      }

      setIsSubmitting(false);
      notifyAccountSessionChanged();
      await router.invalidate();
      await navigate({ to: "/account" });
    } catch (error) {
      console.error(error);
      setMessage(getCredentialsLoginErrorMessage(error));
      setIsSubmitting(false);
    }
  }

  return { isSubmitting, message, submit };
}
