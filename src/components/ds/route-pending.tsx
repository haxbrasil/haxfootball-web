import { Skeleton } from "#/components/ui/skeleton";

export function RoutePending() {
  return (
    <div className="space-y-6" aria-label="Carregando página" aria-busy="true">
      <section className="bfl-field-surface overflow-hidden rounded-xl border border-border/80 p-5 shadow-lg">
        <Skeleton className="h-8 w-56 max-w-full" />
        <Skeleton className="mt-3 h-4 w-[34rem] max-w-full" />
      </section>
      <section className="bfl-panel overflow-hidden rounded-xl border">
        <div className="bfl-panel-header border-b px-4 py-3">
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="grid gap-3 p-4">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-20 w-full" />
          ))}
        </div>
      </section>
    </div>
  );
}
