import { PageHeader } from "#/components/ds/app-shell";
import { MetricCard } from "#/components/ds/metric-card";

type AdminResources = {
  accounts: { items: unknown[] };
  roles: { items: unknown[] };
  permissions: { items: unknown[] };
  roomPrograms: { items: unknown[] };
  proxyEndpoints: { items: unknown[] };
  jobs: { items: unknown[] };
  statSchemas: { items: unknown[] };
};

export function AdminPage({ resources }: { resources: AdminResources }) {
  return (
    <>
      <PageHeader
        title="Admin"
        description="Console operacional protegido pelo BFF usando permissões da API."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Contas" value={resources.accounts.items.length} />
        <MetricCard label="Cargos" value={resources.roles.items.length} />
        <MetricCard label="Permissões" value={resources.permissions.items.length} />
        <MetricCard label="Programas" value={resources.roomPrograms.items.length} />
        <MetricCard label="Proxies" value={resources.proxyEndpoints.items.length} />
        <MetricCard label="Jobs" value={resources.jobs.items.length} />
        <MetricCard label="Schemas" value={resources.statSchemas.items.length} />
      </div>
    </>
  );
}
