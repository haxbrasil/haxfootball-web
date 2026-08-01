import { Skeleton } from "#/components/ui/skeleton";

export function ChampionshipWorkspacePending() {
  return (
    <div className="min-h-[calc(100vh-12rem)] animate-in fade-in-0 duration-200" aria-busy="true">
      <section className="border-b bg-background/92 px-4 py-5 sm:px-6">
        <Skeleton className="h-7 w-64 max-w-full" />
        <Skeleton className="mt-3 h-4 w-96 max-w-full" />
      </section>
      <div className="grid min-h-[calc(100vh-19rem)] xl:grid-cols-[190px_minmax(0,1fr)_330px]">
        <aside className="hidden border-r px-3 py-5 xl:block">
          <div className="space-y-2">
            {Array.from({ length: 8 }, (_, index) => (
              <Skeleton key={index} className="h-9 w-full" />
            ))}
          </div>
        </aside>
        <main className="space-y-5 px-4 py-5 sm:px-6">
          <Skeleton className="h-10 w-72 max-w-full" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-44 w-full" />
            <Skeleton className="h-44 w-full" />
          </div>
          <Skeleton className="h-72 w-full" />
        </main>
        <aside className="hidden border-l px-4 py-5 xl:block">
          <Skeleton className="h-5 w-28" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-16 w-full" />
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
