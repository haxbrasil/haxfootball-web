import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { logoutFn } from "#/server/auth/functions";

export function useLogoutAction() {
  const navigate = useNavigate();
  const logout = useServerFn(logoutFn);

  async function submit() {
    await logout();
    await navigate({ to: "/account/login" });
  }

  return { submit };
}
