import type { FormEvent } from "react";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { loginWithCredentialsFn } from "#/server/auth/functions";

export function useCredentialsLoginForm() {
  const navigate = useNavigate();
  const loginWithCredentials = useServerFn(loginWithCredentialsFn);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const result = await loginWithCredentials({
      data: {
        name: String(formData.get("name") ?? ""),
        password: String(formData.get("password") ?? ""),
      },
    });

    setIsSubmitting(false);

    if (!result.ok) {
      setMessage(result.message);

      return;
    }

    await navigate({ to: "/account" });
  }

  return { isSubmitting, message, submit };
}
