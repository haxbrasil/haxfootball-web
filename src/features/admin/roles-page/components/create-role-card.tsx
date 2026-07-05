import type { Permission } from "@haxbrasil/haxfootball-api-sdk";
import type { Role } from "@haxbrasil/haxfootball-api-sdk";
import { useState } from "react";
import { Plus } from "lucide-react";
import { InlineFormMessage } from "#/components/ds/forms/form-message";
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
import type { Language } from "#/server/api/haxfootball";
import { PermissionChecklist } from "./permission-checklist";
import { useCreateRoleForm } from "../hooks/use-role-permissions-form";

export function CreateRoleCard({
  permissions,
  languages,
  onCreated,
}: {
  permissions: Permission[];
  languages: Language[];
  onCreated?: (role: Role) => void;
}) {
  const [open, setOpen] = useState(false);
  const form = useCreateRoleForm({
    languages,
    onCreated(role) {
      setOpen(false);
      onCreated?.(role);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button">
          <Plus className="size-4" />
          Novo cargo
        </Button>
      </DialogTrigger>
      <DialogContent className="grid max-h-[min(900px,calc(100vh-2rem))] grid-rows-[auto_minmax(0,1fr)] sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Novo cargo</DialogTitle>
          <DialogDescription>Crie o cargo e selecione as permissões iniciais.</DialogDescription>
        </DialogHeader>

        <ScrollArea className="min-h-0 pr-3">
          <form className="space-y-4" onSubmit={form.submit}>
            <div className="grid gap-2">
              <Label htmlFor="roleName">Identificador</Label>
              <Input id="roleName" name="name" required />
            </div>

            <div className="grid gap-3 rounded-md border bg-muted/25 p-3">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Títulos
              </span>
              <div className="grid gap-3 sm:grid-cols-2">
                {languages.map((language) => (
                  <div key={language.code} className="grid gap-2">
                    <Label htmlFor={`roleTitle-${language.code}`}>{language.name}</Label>
                    <Input
                      id={`roleTitle-${language.code}`}
                      value={form.titleLabels[language.code] ?? ""}
                      onChange={(event) => form.setTitleLabel(language.code, event.target.value)}
                      required
                    />
                  </div>
                ))}
              </div>
            </div>

            <PermissionChecklist
              idPrefix="create-role-permission"
              permissions={permissions}
              selected={form.selectedPermissions}
              onChange={form.setSelectedPermissions}
            />

            <div className="sticky bottom-0 flex items-center gap-2 border-t bg-background py-3">
              <Button disabled={form.isSubmitting} type="submit">
                Criar cargo
              </Button>
              {form.message ? <InlineFormMessage message={form.message} /> : null}
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
