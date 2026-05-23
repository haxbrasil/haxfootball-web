import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Scoreline } from "#/components/ds/scoreline";

describe("Scoreline", () => {
  it("renders numeric or string scores", () => {
    render(<Scoreline red="14" blue={7} />);

    expect(screen.getByText("14")).not.toBeNull();
    expect(screen.getByText("7")).not.toBeNull();
  });

  it("renders placeholders when a score is missing", () => {
    render(<Scoreline red={null} blue={undefined} />);

    expect(screen.getAllByText("-")).toHaveLength(2);
  });
});
