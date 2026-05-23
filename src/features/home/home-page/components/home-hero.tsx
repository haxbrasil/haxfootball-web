import { Link } from "@tanstack/react-router";
import { Activity, BarChart3, DoorOpen, MessageCircle, Youtube } from "lucide-react";
import { ActionButton } from "#/components/ds/action-button";
import { BrandLogo } from "#/components/ds/brand-logo";
import { HomeSocialLink } from "./home-social-link";

export function HomeHero() {
  return (
    <section className="bfl-field-surface mb-5 overflow-hidden rounded-xl border border-border/80 shadow-lg">
      <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,24rem)] lg:items-start">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid size-14 place-items-center rounded-xl border bg-background/70 p-2 shadow-sm">
              <BrandLogo className="h-full w-full" />
            </span>
            <span>
              <span className="block text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-primary">
                Brazilian HaxFootball League
              </span>
            </span>
          </div>
          <h1 className="mt-5 max-w-2xl text-2xl font-semibold tracking-normal sm:text-3xl">
            A maior comunidade de futebol americano do HaxBall.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
            Acompanhe a sala pública, veja partidas recentes, compare rankings e entre nos canais da
            comunidade.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <ActionButton asChild>
              <Link to="/pubs">
                <BarChart3 className="size-4" />
                Pubs
              </Link>
            </ActionButton>
            <ActionButton asChild tone="quiet">
              <Link to="/matches">
                <Activity className="size-4" />
                Partidas
              </Link>
            </ActionButton>
            <ActionButton asChild tone="quiet">
              <Link to="/rooms">
                <DoorOpen className="size-4" />
                Salas
              </Link>
            </ActionButton>
          </div>
        </div>

        <div className="grid max-w-3xl gap-4 self-stretch sm:grid-cols-2 lg:max-w-none lg:grid-cols-1 lg:grid-rows-2">
          <HomeSocialLink
            href="https://discord.gg/q8ay8PmEkp"
            icon={MessageCircle}
            label="Discord"
            description="Jogue, combine partidas e acompanhe avisos."
            emphasis="primary"
          />
          <HomeSocialLink
            href="https://www.youtube.com/@brazilianhaxfootballleague"
            icon={Youtube}
            label="YouTube"
            description="Assista vídeos, partidas e conteúdos da comunidade."
            emphasis="danger"
          />
        </div>
      </div>
    </section>
  );
}
