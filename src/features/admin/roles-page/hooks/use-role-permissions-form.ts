import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import type { Role } from "@haxbrasil/haxfootball-api-sdk";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import type { FormMessage } from "#/components/ds/forms/form-message";
import type { Language, LocalizedValue } from "#/server/api/haxfootball";
import { createRoleFn, updateRoleFn } from "#/server/api/functions";
import { roleFormIsDirty, rolePermissionKeys } from "../utils/role-permissions";
import {
  roleTitleKey,
  roleTitleLabels,
  trimRoleTitleLabels,
  type RoleTitleLabels,
} from "../utils/role-title-localization";

export function useCreateRoleForm({
  languages,
  onCreated,
}: {
  languages: Language[];
  onCreated?: (role: Role) => void;
}) {
  const router = useRouter();
  const createRole = useServerFn(createRoleFn);
  const [message, setMessage] = useState<FormMessage | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [titleLabels, setTitleLabels] = useState<RoleTitleLabels>(
    Object.fromEntries(languages.map((language) => [language.code, ""])),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  function setTitleLabel(language: string, label: string) {
    setTitleLabels((current) => ({ ...current, [language]: label }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "");
    const labels = trimRoleTitleLabels(titleLabels);
    const result = await createRole({
      data: {
        name,
        title: `role.${name}.title`,
        titleLabels: labels,
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
    setTitleLabels(Object.fromEntries(languages.map((language) => [language.code, ""])));
    setMessage({ kind: "success", text: "Cargo criado." });
    await router.invalidate();
    onCreated?.(result.role);
  }

  return {
    isSubmitting,
    message,
    selectedPermissions,
    setSelectedPermissions,
    setTitleLabel,
    submit,
    titleLabels,
  };
}

export function useUpdateRolePermissionsForm({
  role,
  languages,
  localizedValue,
}: {
  role: Role;
  languages: Language[];
  localizedValue: LocalizedValue | null | undefined;
}) {
  const router = useRouter();
  const updateRole = useServerFn(updateRoleFn);
  const initialPermissions = useMemo(() => rolePermissionKeys(role), [role]);
  const initialTitleLabels = useMemo(
    () => roleTitleLabels({ role, languages, value: localizedValue }),
    [role, languages, localizedValue],
  );
  const [titleLabels, setTitleLabels] = useState(initialTitleLabels);
  const [selectedPermissions, setSelectedPermissions] = useState(initialPermissions);
  const [message, setMessage] = useState<FormMessage | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isDirty = roleFormIsDirty({
    titleLabels,
    initialTitleLabels,
    permissions: selectedPermissions,
    initialPermissions,
  });

  function setTitleLabel(language: string, label: string) {
    setTitleLabels((current) => ({ ...current, [language]: label }));
  }

  function reset() {
    setTitleLabels(initialTitleLabels);
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
        title: roleTitleKey(role),
        titleLabels: trimRoleTitleLabels(titleLabels),
        permissions: selectedPermissions,
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

  return {
    isSubmitting,
    message,
    isDirty,
    reset,
    selectedPermissions,
    setSelectedPermissions,
    setTitleLabel,
    submit,
    titleLabels,
  };
}
