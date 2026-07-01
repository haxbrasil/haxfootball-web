import { Link } from "@tanstack/react-router";
import { BrandLogo } from "#/components/ds/brand-logo";

export function AppLogoLink() {
  return (
    <Link to="/" className="flex h-8 items-center" title="Brazilian HaxFootball League">
      <BrandLogo className="h-8 w-auto" />
    </Link>
  );
}
