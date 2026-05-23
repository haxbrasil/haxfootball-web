import { Link } from "@tanstack/react-router";
import { BrandLogo } from "#/components/ds/brand-logo";

export function AppLogoLink() {
  return (
    <Link
      to="/"
      className="flex items-center gap-3 font-semibold tracking-normal"
      title="Brazilian HaxFootball League"
    >
      <span className="grid size-10 place-items-center rounded-md border bg-card p-1.5 shadow-sm">
        <BrandLogo className="h-full w-full" />
      </span>
    </Link>
  );
}
