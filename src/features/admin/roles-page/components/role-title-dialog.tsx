import type { Role } from "@haxbrasil/haxfootball-api-sdk";
import { Languages, Pencil } from "lucide-react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { ScrollArea } from "#/components/ui/scroll-area";
import type { Language } from "#/server/api/haxfootball";
import { localizedTextLabel } from "#/lib/localization/localized-text";
import type { RoleTitleLabels } from "../utils/role-title-localization";

export function RoleTitleDialog({
  role,
  languages,
  titleLabels,
  formId,
  isDirty,
  isSubmitting,
  onChange,
}: {
  role: Role;
  languages: Language[];
  titleLabels: RoleTitleLabels;
  formId: string;
  isDirty: boolean;
  isSubmitting: boolean;
  onChange: (language: string, label: string) => void;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Pencil className="size-4" />
          Editar títulos
        </Button>
      </DialogTrigger>
      <DialogContent className="grid max-h-[min(720px,calc(100vh-2rem))] grid-rows-[auto_minmax(0,1fr)_auto] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar títulos</DialogTitle>
          <DialogDescription>
            Atualize o nome exibido para cada idioma disponível.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="min-h-0 pr-3">
          <div className="grid gap-4">
            <div className="rounded-md border bg-muted/25 p-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Languages className="size-4 text-muted-foreground" />
                {localizedTextLabel(role.title)}
              </div>
              <p className="mt-1 font-mono text-xs text-muted-foreground">{role.name}</p>
            </div>

            <div className="grid gap-3">
              {languages.map((language) => (
                <div key={language.code} className="grid gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor={`role-${role.uuid}-title-${language.code}`}>
                      {language.name}
                    </Label>
                    <Badge variant="outline" className="font-mono">
                      {language.code}
                    </Badge>
                  </div>
                  <Input
                    id={`role-${role.uuid}-title-${language.code}`}
                    value={titleLabels[language.code] ?? ""}
                    onChange={(event) => onChange(language.code, event.target.value)}
                    required
                  />
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button form={formId} type="submit" disabled={isSubmitting || !isDirty}>
            Salvar alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
