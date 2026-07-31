import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, ...props }: React.ComponentProps<"a"> & { to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

import { AdminPage } from "./overview-page";

describe("AdminPage", () => {
  it("uses clickable cards and shows resource counts", () => {
    render(
      <AdminPage
        resources={
          {
            roomPrograms: {
              items: [{ id: "one" }, { id: "two" }],
              page: { limit: 100, nextCursor: null },
            },
          } as never
        }
        sections={[
          {
            key: "room-programs",
            title: "Programas de sala",
            description: "Gerenciar programas.",
            href: "/admin/room-programs",
            permissions: ["room-program:admin"],
          },
        ]}
      />,
    );

    expect(screen.getByRole("heading", { name: "Painel administrativo" })).not.toBeNull();
    expect(screen.getByText("2 programas")).not.toBeNull();
    expect(screen.queryByText("Abrir")).toBeNull();
    const cardLink = screen.getByRole("link", { name: "Abrir Programas de sala" });
    expect(cardLink.getAttribute("href")).toBe("/admin/room-programs");
    expect(cardLink.className).toContain("h-full");
  });
});
