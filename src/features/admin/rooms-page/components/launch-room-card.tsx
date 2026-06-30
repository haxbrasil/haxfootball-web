import { DoorOpen, Rocket } from "lucide-react";
import { EmptyState } from "#/components/ds/app-shell";
import { FormMessageAlert } from "#/components/ds/forms/form-message";
import { NativeSelectField } from "#/components/ds/forms/native-select-field";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import type { AdminRoomManagementResources } from "#/server/api/haxfootball";
import { LaunchConfigField } from "./launch-config-field";
import { useLaunchRoomForm } from "../hooks/use-launch-room-form";

export function LaunchRoomCard({ resources }: { resources: AdminRoomManagementResources }) {
  const form = useLaunchRoomForm(resources);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Rocket className="size-4" />
          Lançar sala
        </CardTitle>
      </CardHeader>
      <CardContent>
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
                label: program.title ?? program.name,
                value: program.id,
              }))}
            />

            <NativeSelectField
              id="version"
              name="version"
              label="Versão"
              required
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

            {form.launchConfigGroups.length ? (
              <div className="space-y-5 border-t pt-4">
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

            <Button disabled={form.isSubmitting || form.versionOptions.length === 0} type="submit">
              <DoorOpen className="size-4" />
              {form.isSubmitting ? "Lançando..." : "Lançar sala"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
