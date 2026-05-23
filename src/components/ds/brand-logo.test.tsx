import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BrandLogo } from "#/components/ds/brand-logo";

describe("BrandLogo", () => {
  it("uses the cropped BFL logo asset", () => {
    render(<BrandLogo />);

    const logo = screen.getByRole("img", { name: "BFL" });

    expect(logo.getAttribute("src")).toBe("/brand/bfl-logo.png");
    expect(logo.getAttribute("width")).toBe("934");
    expect(logo.getAttribute("height")).toBe("1088");
  });
});
