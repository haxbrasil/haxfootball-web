import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import type { FormMessage } from "#/components/ds/forms/form-message";
import type { AdminRoomManagementResources } from "#/server/api/haxfootball";
import { launchRoomFn } from "#/server/api/functions";
import { getVersionOptions, readLaunchConfig } from "../utils/launch-config";

export function useLaunchRoomForm(resources: AdminRoomManagementResources) {
  const router = useRouter();
  const launchRoom = useServerFn(launchRoomFn);
  const [programId, setProgramId] = useState(resources.roomPrograms.items[0]?.id ?? "");
  const [message, setMessage] = useState<FormMessage | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedProgram = resources.roomPrograms.items.find((program) => program.id === programId);
  const versionOptions = useMemo(
    () => getVersionOptions(resources, programId),
    [programId, resources],
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const result = await launchRoom({
      data: {
        programId: String(formData.get("programId") ?? ""),
        version: String(formData.get("version") ?? ""),
        haxballToken: String(formData.get("haxballToken") ?? ""),
        launchConfig: readLaunchConfig(formData, selectedProgram?.launchConfigFields ?? []),
      },
    });

    setIsSubmitting(false);

    if (!result.ok) {
      setMessage({ kind: "error", text: result.message });

      return;
    }

    form.reset();
    setMessage({ kind: "success", text: "Sala lançada." });
    await router.invalidate();
  }

  return {
    isSubmitting,
    message,
    programId,
    selectedProgram,
    setProgramId,
    submit,
    versionOptions,
  };
}
