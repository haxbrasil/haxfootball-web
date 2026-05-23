import { describe, expect, it } from "vitest";
import { getCredentialsLoginErrorMessage } from "./get-credentials-login-error-message";

describe("getCredentialsLoginErrorMessage", () => {
  it("uses an environment-specific message when the session store is unavailable", () => {
    expect(getCredentialsLoginErrorMessage(new Error("D1 binding DB is not available."))).toBe(
      "Não foi possível criar a sessão neste ambiente.",
    );
  });

  it("uses a generic message for unknown failures", () => {
    expect(getCredentialsLoginErrorMessage(new Error("Network failed"))).toBe(
      "Não foi possível entrar agora. Tente novamente.",
    );
  });
});
