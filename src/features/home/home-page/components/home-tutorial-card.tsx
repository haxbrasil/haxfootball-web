import { ArrowUpRight, Play, Video } from "lucide-react";
import { ActionButton } from "#/components/ds/action-button";

const tutorialUrl = "https://videos.bfl.haxbrasil.com/w/8cUZjN4xUQGih2yz6Ui7vd";
const tutorialEmbedUrl =
  "https://videos.bfl.haxbrasil.com/videos/embed/3a59ceac-65ce-4959-b381-4f617d6f88be";
const videosChannelUrl = "https://videos.bfl.haxbrasil.com/video-channels/bflvideos";

export function HomeTutorialCard() {
  return (
    <section className="bfl-panel mt-4 overflow-hidden rounded-xl border p-4 shadow-lg sm:p-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(14rem,18rem)_minmax(0,1fr)] lg:items-center">
        <div className="mx-auto aspect-video w-full max-w-sm overflow-hidden rounded-lg border bg-muted lg:max-w-none">
          <iframe
            src={tutorialEmbedUrl}
            title="Tutorial - Aprenda a jogar"
            className="h-full w-full"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            allow="fullscreen"
            allowFullScreen
          />
        </div>

        <div className="grid content-center gap-5">
          <div>
            <p className="inline-flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-primary">
              <Video className="size-4" />
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
              <a href={videosChannelUrl} target="_blank" rel="noreferrer">
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
