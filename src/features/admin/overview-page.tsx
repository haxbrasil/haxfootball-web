import { EmptyState } from "#/components/ds/app-shell";

export function AdminPage() {
  return (
    <section className="grid min-h-80 place-items-center">
      <div className="w-full max-w-xl">
        <EmptyState
          title="Área administrativa em construção"
          body="Esta tela ainda está sendo organizada para a administração da liga."
        />
      </div>
    </section>
  );
}
