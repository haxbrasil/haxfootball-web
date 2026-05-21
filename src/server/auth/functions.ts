import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  getCurrentSession,
  loginWithCredentials,
  logoutCurrentSession,
} from "#/server/auth/session";

const credentialsInput = z.object({
  name: z.string().min(1),
  password: z.string().min(1),
});

export const loginWithCredentialsFn = createServerFn({ method: "POST" })
  .inputValidator(credentialsInput)
  .handler(({ data }) => loginWithCredentials(data));

export const logoutFn = createServerFn({ method: "POST" }).handler(() => logoutCurrentSession());

export const getCurrentSessionFn = createServerFn({ method: "GET" }).handler(() =>
  getCurrentSession(),
);
