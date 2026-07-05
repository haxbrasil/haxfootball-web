import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import type { Role } from "@haxbrasil/haxfootball-api-sdk";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import type { FormMessage } from "#/components/ds/forms/form-message";
import { createRoleFn, updateRoleFn } from "#/server/api/functions";
import { rolePermissionKeys, samePermissionSelection } from "../utils/role-permissions";

export function useCreateRoleForm({ onCreated }: { onCreated?: (role: Role) => void } = {}) {
  const router = useRouter();
  const createRole = useServerFn(createRoleFn);
  const [message, setMessage] = useState<FormMessage | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const result = await createRole({
      data: {
        name: String(formData.get("name") ?? ""),
        title: String(formData.get("title") ?? ""),
        permissions: selectedPermissions,
      },
    });

    setIsSubmitting(false);

    if (!result.ok) {
      setMessage({ kind: "error", text: result.message });

      return;
    }

    form.reset();
    setSelectedPermissions([]);
    setMessage({ kind: "success", text: "Cargo criado." });
    await router.invalidate();
    onCreated?.(result.role);
  }

  return {
    isSubmitting,
    message,
    selectedPermissions,
    setSelectedPermissions,
    submit,
  };
}

export function useUpdateRolePermissionsForm(role: Role) {
  const router = useRouter();
  const updateRole = useServerFn(updateRoleFn);
  const initialPermissions = useMemo(() => rolePermissionKeys(role), [role]);
  const [selectedPermissions, setSelectedPermissions] = useState(initialPermissions);
  const [message, setMessage] = useState<FormMessage | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isDirty = !samePermissionSelection(selectedPermissions, initialPermissions);

  function reset() {
    setSelectedPermissions(initialPermissions);
    setMessage(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsSubmitting(true);

    const result = await updateRole({
      data: {
        uuid: role.uuid,
        name: role.name,
        title: role.title.value,
        permissions: selectedPermissions,
      },
    });

    setIsSubmitting(false);

    if (!result.ok) {
      setMessage({ kind: "error", text: result.message });

      return;
    }

    setMessage({ kind: "success", text: "Permissões atualizadas." });
    await router.invalidate();
  }

  return {
    isSubmitting,
    message,
    isDirty,
    reset,
    selectedPermissions,
    setSelectedPermissions,
    submit,
  };
}
