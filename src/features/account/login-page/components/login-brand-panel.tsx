import { Radio, ShieldCheck, Trophy } from "lucide-react";
import { BrandLogo } from "#/components/ds/brand-logo";

export function LoginBrandPanel() {
  return (
    <div className="relative overflow-hidden rounded-xl border bg-card/70 p-6 shadow-sm sm:p-8 lg:h-[28.875rem]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,color-mix(in_oklch,var(--primary)_26%,transparent),transparent_34%),linear-gradient(135deg,color-mix(in_oklch,var(--card)_94%,white),color-mix(in_oklch,var(--card)_90%,black))]" />
      <div className="relative flex h-full flex-col justify-between gap-8">
        <div>
          <div className="flex items-center gap-4">
            <span className="grid size-16 place-items-center rounded-lg border bg-background/55 p-2 shadow-sm">
              <BrandLogo className="h-full w-full" />
            </span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">BFL</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-normal sm:text-4xl">
                Brazilian HaxFootball League
              </h1>
            </div>
          </div>

          <p className="mt-5 max-w-2xl text-sm leading-6 text-muted-foreground">
            Entre para acessar recursos da sua conta, acompanhar partidas registradas e gerenciar
            permissões quando seu perfil permitir.
          </p>
        </div>

        <div className="grid gap-4 border-t pt-5 sm:grid-cols-3 lg:grid-cols-1">
          <div className="flex gap-3">
            <Radio className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium">Salas públicas</p>
              <p className="mt-1 text-sm text-muted-foreground">Acompanhe salas abertas da BFL.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Trophy className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium">Partidas</p>
              <p className="mt-1 text-sm text-muted-foreground">Veja partidas e estatísticas.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium">Conta segura</p>
              <p className="mt-1 text-sm text-muted-foreground">Use Discord ou suas credenciais.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
