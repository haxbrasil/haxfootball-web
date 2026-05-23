import { Goal } from "lucide-react";

export function EmptyLeagueState({ title, body }: { title: string; body?: string }) {
  return (
    <div className="rounded-xl border border-dashed bg-background/35 px-5 py-8 text-center">
      <Goal className="mx-auto mb-3 size-7 text-primary" />
      <h2 className="text-sm font-semibold">{title}</h2>
      {body ? <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">{body}</p> : null}
    </div>
  );
}
