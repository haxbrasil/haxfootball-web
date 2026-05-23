import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCredentialsLoginForm } from "./use-credentials-login-form";

const loginWithCredentials = vi.fn();
const navigate = vi.fn();

vi.mock("@tanstack/react-start", () => ({
  useServerFn: () => loginWithCredentials,
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
}));

vi.mock("#/server/auth/functions", () => ({
  loginWithCredentialsFn: vi.fn(),
}));

describe("useCredentialsLoginForm", () => {
  beforeEach(() => {
    loginWithCredentials.mockReset();
    navigate.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the server validation message and stops submitting", async () => {
    loginWithCredentials.mockResolvedValue({
      ok: false,
      message: "Conta ou senha inválidas.",
    });

    const { result } = renderHook(() => useCredentialsLoginForm());

    await act(() => result.current.submit(formEvent()));

    expect(result.current.message).toBe("Conta ou senha inválidas.");
    expect(result.current.isSubmitting).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });

  it("shows a generic message and stops submitting when login throws", async () => {
    loginWithCredentials.mockRejectedValue(new Error("Network failed"));

    const { result } = renderHook(() => useCredentialsLoginForm());

    await act(() => result.current.submit(formEvent()));

    expect(result.current.message).toBe("Não foi possível entrar agora. Tente novamente.");
    expect(result.current.isSubmitting).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });

  it("navigates to the account page after a successful login", async () => {
    loginWithCredentials.mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useCredentialsLoginForm());

    await act(() => result.current.submit(formEvent()));

    expect(result.current.message).toBeNull();
    expect(result.current.isSubmitting).toBe(false);
    expect(navigate).toHaveBeenCalledWith({ to: "/account" });
  });
});

function formEvent() {
  const form = document.createElement("form");
  const name = document.createElement("input");
  const password = document.createElement("input");

  name.name = "name";
  name.value = "gabriel";
  password.name = "password";
  password.value = "password";
  form.appendChild(name);
  form.appendChild(password);

  return {
    preventDefault: vi.fn(),
    currentTarget: form,
  } as never;
}
