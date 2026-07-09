import { DoorOpen, Rocket } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "#/components/ds/app-shell/empty-state";
import { FormMessageAlert } from "#/components/ds/forms/form-message-alert";
import { NativeSelectField } from "#/components/ds/forms/native-select-field";
import { Button } from "#/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { ScrollArea } from "#/components/ui/scroll-area";
import { localizedTextLabel } from "#/lib/localization/localized-text";
import type { AdminRoomManagementResources } from "#/server/api/haxfootball";
import { GeoLaunchConfigField } from "./geo-launch-config-field";
import { LaunchConfigField } from "./launch-config-field";
import { useLaunchRoomForm } from "../hooks/use-launch-room-form";

export function LaunchRoomDialog({ resources }: { resources: AdminRoomManagementResources }) {
  const [open, setOpen] = useState(false);
  const form = useLaunchRoomForm(resources, {
    onLaunched() {
      setOpen(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button">
          <DoorOpen className="size-4" />
          Lançar sala
        </Button>
      </DialogTrigger>
      <DialogContent className="grid max-h-[min(900px,calc(100vh-2rem))] grid-rows-[auto_minmax(0,1fr)] sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="size-4" />
            Lançar sala
          </DialogTitle>
          <DialogDescription>
            Escolha o programa, versão e configurações para abrir uma nova sala.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="min-h-0 pr-3">
          {resources.roomPrograms.items.length === 0 ? (
            <EmptyState title="Nenhum programa disponível" />
          ) : (
            <form className="space-y-4" onSubmit={form.submit}>
              {form.message ? <FormMessageAlert message={form.message} /> : null}

              <NativeSelectField
                id="programId"
                name="programId"
                label="Programa"
                value={form.programId}
                onChange={form.setProgramId}
                options={resources.roomPrograms.items.map((program) => ({
                  label: program.title ? localizedTextLabel(program.title) : program.name,
                  value: program.id,
                }))}
              />

              <NativeSelectField
                id="version"
                name="version"
                label="Versão"
                required
                value={form.version}
                onChange={form.setVersion}
                options={form.versionOptions}
                emptyOption={
                  form.versionOptions.length === 0
                    ? { label: "Nenhuma versão disponível", value: "" }
                    : undefined
                }
              />

              <div className="grid gap-2">
                <Label htmlFor="haxballToken">Token HaxBall</Label>
                <Input
                  id="haxballToken"
                  name="haxballToken"
                  type="password"
                  autoComplete="off"
                  required
                />
              </div>

              {form.geoFields || form.launchConfigGroups.length ? (
                <div className="space-y-5 border-t pt-4">
                  {form.geoFields ? <GeoLaunchConfigField fields={form.geoFields} /> : null}

                  {form.launchConfigGroups.map((group) => (
                    <fieldset key={group.category} className="space-y-3">
                      <legend className="text-sm font-medium text-foreground">{group.label}</legend>
                      {group.fields.map((field) => (
                        <LaunchConfigField key={field.key} field={field} />
                      ))}
                    </fieldset>
                  ))}
                </div>
              ) : null}

              <div className="sticky bottom-0 flex items-center gap-2 border-t bg-background py-3">
                <Button
                  disabled={form.isSubmitting || form.versionOptions.length === 0}
                  type="submit"
                >
                  <DoorOpen className="size-4" />
                  {form.isSubmitting ? "Lançando..." : "Lançar sala"}
                </Button>
              </div>
            </form>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
