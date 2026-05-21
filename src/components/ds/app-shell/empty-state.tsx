import { ShieldCheck } from "lucide-react";

export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <div className="rounded-lg border border-dashed bg-muted/30 p-8 text-center">
      <ShieldCheck className="mx-auto mb-3 size-6 text-muted-foreground" />
      <h2 className="text-sm font-medium">{title}</h2>
      {body ? <p className="mt-1 text-sm text-muted-foreground">{body}</p> : null}
    </div>
  );
}
