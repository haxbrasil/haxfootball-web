import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MetricCard } from "#/components/ds/metric-card";

describe("MetricCard", () => {
  it("renders a metric label, value, and detail", () => {
    render(<MetricCard label="Jogadores" value={12} detail="Perfis cadastrados" />);

    expect(screen.getByText("Jogadores")).not.toBeNull();
    expect(screen.getByText("12")).not.toBeNull();
    expect(screen.getByText("Perfis cadastrados")).not.toBeNull();
  });
});
