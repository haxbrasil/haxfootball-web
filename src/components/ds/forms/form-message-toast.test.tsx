import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { FormMessageToast } from "./form-message-toast";

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe("FormMessageToast", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows successful form feedback as a toast", () => {
    render(<FormMessageToast message={{ kind: "success", text: "Alteração salva." }} />);

    expect(toast.success).toHaveBeenCalledWith("Alteração salva.");
  });

  it("shows failed form feedback as an error toast", () => {
    render(<FormMessageToast message={{ kind: "error", text: "Não foi possível salvar." }} />);

    expect(toast.error).toHaveBeenCalledWith("Não foi possível salvar.");
  });
});
