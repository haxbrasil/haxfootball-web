import { ArrowUpRight, Play, Youtube } from "lucide-react";
import { ActionButton } from "#/components/ds/action-button";

const tutorialUrl = "https://www.youtube.com/watch?v=Z09dlI3MR28";
const tutorialThumbnailUrl = "https://img.youtube.com/vi/Z09dlI3MR28/maxresdefault.jpg";

export function HomeTutorialCard() {
  return (
    <section className="bfl-panel mt-4 overflow-hidden rounded-xl border p-4 shadow-lg sm:p-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(14rem,18rem)_minmax(0,1fr)] lg:items-center">
        <a
          href={tutorialUrl}
          target="_blank"
          rel="noreferrer"
          className="group relative mx-auto aspect-video w-full max-w-sm overflow-hidden rounded-lg border bg-muted lg:max-w-none"
          aria-label="Assistir tutorial no YouTube"
        >
          <img
            src={tutorialThumbnailUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,color-mix(in_oklch,black_54%,transparent),color-mix(in_oklch,black_14%,transparent)_58%,color-mix(in_oklch,black_40%,transparent))]" />
          <div className="absolute inset-0 grid place-items-center">
            <span className="grid size-14 place-items-center rounded-lg border border-white/25 bg-white/15 text-white shadow-2xl backdrop-blur transition group-hover:scale-105 group-hover:bg-white/20">
              <Play className="ml-1 size-6 fill-current" />
            </span>
          </div>
        </a>

        <div className="grid content-center gap-5">
          <div>
            <p className="inline-flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-primary">
              <Youtube className="size-4" />
              Tutorial
            </p>
            <h2 className="mt-3 max-w-2xl text-2xl font-semibold tracking-normal sm:text-3xl">
              Aprenda as regras e entre melhor preparado.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Um guia direto para entender a dinâmica da sala, se posicionar melhor e começar a
              jogar com a comunidade.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <ActionButton asChild>
              <a href={tutorialUrl} target="_blank" rel="noreferrer">
                <Play className="size-4 fill-current" />
                Assistir tutorial
              </a>
            </ActionButton>
            <ActionButton asChild tone="quiet">
              <a
                href="https://www.youtube.com/@brazilianhaxfootballleague"
                target="_blank"
                rel="noreferrer"
              >
                <ArrowUpRight className="size-4" />
                Canal
              </a>
            </ActionButton>
          </div>
        </div>
      </div>
    </section>
  );
}
