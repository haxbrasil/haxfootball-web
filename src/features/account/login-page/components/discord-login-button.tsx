import { Gamepad2 } from "lucide-react";
import { Button } from "#/components/ui/button";

export function DiscordLoginButton() {
  return (
    <Button asChild className="w-full" type="button">
      <a href="/api/auth/sign-in/discord">
        <Gamepad2 className="size-4" />
        Entrar com Discord
      </a>
    </Button>
  );
}
