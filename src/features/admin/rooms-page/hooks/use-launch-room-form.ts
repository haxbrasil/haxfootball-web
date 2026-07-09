import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import type { FormMessage } from "#/components/ds/forms/form-message";
import type { AdminRoomManagementResources } from "#/server/api/haxfootball";
import {
  extractGeoLaunchConfigFields,
  getDefaultVersionValue,
  getVersionOptions,
  groupedLaunchConfigFields,
  readLaunchConfig,
  type WebRoomLaunchConfigField,
} from "../utils/launch-config";

export function useLaunchRoomForm(
  resources: AdminRoomManagementResources,
  options: { onLaunched?: () => void } = {},
) {
  const router = useRouter();
  const initialProgramId = resources.roomPrograms.items[0]?.id ?? "";
  const [programId, setProgramIdState] = useState(initialProgramId);
  const [version, setVersion] = useState(() => getDefaultVersionValue(resources, initialProgramId));
  const [message, setMessage] = useState<FormMessage | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedProgram = resources.roomPrograms.items.find((program) => program.id === programId);
  const versionOptions = useMemo(
    () => getVersionOptions(resources, programId),
    [programId, resources],
  );
  const launchConfigFields = useMemo(
    () => (selectedProgram?.launchConfigFields ?? []) as unknown as WebRoomLaunchConfigField[],
    [selectedProgram],
  );
  const { geoFields, fieldsWithoutGeo } = useMemo(
    () => extractGeoLaunchConfigFields(launchConfigFields),
    [launchConfigFields],
  );
  const launchConfigGroups = useMemo(
    () => groupedLaunchConfigFields(fieldsWithoutGeo),
    [fieldsWithoutGeo],
  );

  useEffect(() => {
    setVersion(getDefaultVersionValue(resources, programId));
  }, [programId, resources]);

  function setProgramId(nextProgramId: string) {
    setProgramIdState(nextProgramId);
    setVersion(getDefaultVersionValue(resources, nextProgramId));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const { launchRoomFn } = await import("#/server/api/admin-room-action-functions");
    const result = await launchRoomFn({
      data: {
        programId: String(formData.get("programId") ?? ""),
        version,
        haxballToken: String(formData.get("haxballToken") ?? ""),
        launchConfig: readLaunchConfig(formData, launchConfigFields),
      },
    });

    setIsSubmitting(false);

    if (!result.ok) {
      setMessage({ kind: "error", text: result.message });

      return;
    }

    form.reset();
    await router.invalidate();

    if (options.onLaunched) {
      options.onLaunched();
    } else {
      setMessage({ kind: "success", text: "Sala lançada." });
    }
  }

  return {
    isSubmitting,
    message,
    programId,
    version,
    geoFields,
    launchConfigGroups,
    selectedProgram,
    setProgramId,
    setVersion,
    submit,
    versionOptions,
  };
}
