import { Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, Users, Volleyball } from "lucide-react";
import { PageHeader } from "#/components/ds/app-shell/page-header";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import type { AdminSection, AdminSectionKey } from "#/features/admin/admin-sections";
import type { AdminOverviewResources } from "#/server/api/haxfootball";

const sectionIcons = {
  rooms: Volleyball,
  accounts: Users,
  roles: ShieldCheck,
} satisfies Record<AdminSectionKey, typeof ShieldCheck>;

export function AdminPage({
  resources,
  sections,
}: {
  resources: AdminOverviewResources;
  sections: AdminSection[];
}) {
  return (
    <>
      <PageHeader
        title="Admin"
        description="Painel operacional para gerenciar a liga e acessar as áreas disponíveis."
      />

      <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sections.map((section) => (
          <AdminSectionCard
            key={section.key}
            section={section}
            summary={sectionSummary(section.key, resources)}
          />
        ))}
      </div>
    </>
  );
}

function AdminSectionCard({ section, summary }: { section: AdminSection; summary: string }) {
  const Icon = sectionIcons[section.key];

  return (
    <Card className="h-full gap-4 rounded-lg">
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="grid size-10 place-items-center rounded-md border bg-muted">
            <Icon className="size-5" />
          </div>
          <Badge variant="secondary">{summary}</Badge>
        </div>
        <div className="space-y-1">
          <CardTitle className="text-base">{section.title}</CardTitle>
          <p className="text-sm leading-6 text-muted-foreground">{section.description}</p>
        </div>
      </CardHeader>
      <CardContent className="mt-auto">
        <Button asChild variant="outline" className="w-full justify-between">
          <Link to={section.href}>
            Abrir
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function sectionSummary(section: AdminSectionKey, resources: AdminOverviewResources) {
  if (section === "rooms") {
    return pageCountLabel(resources.rooms, "sala aberta", "salas abertas");
  }

  if (section === "accounts") {
    return pageCountLabel(resources.accounts, "conta", "contas");
  }

  return pageCountLabel(resources.roles, "cargo", "cargos");
}

function pageCountLabel(
  page: { items: unknown[]; page: { nextCursor: string | null } } | undefined,
  singular: string,
  plural: string,
) {
  const count = page?.items.length ?? 0;
  const suffix = page?.page.nextCursor ? "+" : "";
  const label = count === 1 ? singular : plural;

  return `${count}${suffix} ${label}`;
}
