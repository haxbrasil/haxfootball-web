import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { notifyAccountSessionChanged } from "#/features/account/utils/session-events";
import { logoutFn } from "#/server/auth/functions";

export function useLogoutAction() {
  const navigate = useNavigate();
  const logout = useServerFn(logoutFn);

  async function submit() {
    await logout();
    notifyAccountSessionChanged();
    await navigate({ to: "/account/login" });
  }

  return { submit };
}
