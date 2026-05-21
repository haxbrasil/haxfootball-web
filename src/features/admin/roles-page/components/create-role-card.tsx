import type { Permission } from "@haxbrasil/haxfootball-api-sdk";
import { Plus } from "lucide-react";
import { InlineFormMessage } from "#/components/ds/forms/form-message";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { PermissionChecklist } from "./permission-checklist";
import { useCreateRoleForm } from "../hooks/use-role-permissions-form";

export function CreateRoleCard({ permissions }: { permissions: Permission[] }) {
  const form = useCreateRoleForm();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Plus className="size-4" />
          Novo cargo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={form.submit}>
          <div className="grid gap-2">
            <Label htmlFor="roleName">Identificador</Label>
            <Input id="roleName" name="name" required />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="roleTitle">Título</Label>
            <Input id="roleTitle" name="title" required />
          </div>

          <PermissionChecklist
            permissions={permissions}
            selected={form.selectedPermissions}
            onChange={form.setSelectedPermissions}
          />

          <Button disabled={form.isSubmitting} type="submit">
            Criar cargo
          </Button>

          {form.message ? <InlineFormMessage message={form.message} /> : null}
        </form>
      </CardContent>
    </Card>
  );
}
