import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { VisualizationFieldPicker } from "./visualization-field-picker";

globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
Element.prototype.scrollIntoView = vi.fn();

const options = [
  { value: "passing-yards", label: "Jardas passadas", searchTerms: ["passing-yards"] },
  { value: "receiving-yards", label: "Jardas recebidas", searchTerms: ["receiving-yards"] },
];

describe("VisualizationFieldPicker", () => {
  it("searches and selects a single statistic through the shared picker surface", () => {
    const onValueChange = vi.fn();

    render(
      <VisualizationFieldPicker
        value=""
        options={options}
        onValueChange={onValueChange}
        ariaLabel="Estatística"
      />,
    );

    fireEvent.click(screen.getByRole("combobox", { name: "Estatística" }));
    fireEvent.change(screen.getByPlaceholderText("Buscar estatística…"), {
      target: { value: "recebidas" },
    });

    expect(screen.getByRole("option", { name: /Jardas recebidas/ })).toBeTruthy();
    expect(screen.queryByRole("option", { name: /Jardas passadas/ })).toBeNull();

    fireEvent.click(screen.getByRole("option", { name: /Jardas recebidas/ }));
    expect(onValueChange).toHaveBeenCalledWith("receiving-yards");
  });

  it("keeps the picker open while selecting multiple statistics", () => {
    const onValueChange = vi.fn();

    render(
      <VisualizationFieldPicker
        value={[]}
        options={options}
        onValueChange={onValueChange}
        multiple
        ariaLabel="Estatísticas"
      />,
    );

    fireEvent.click(screen.getByRole("combobox", { name: "Estatísticas" }));
    fireEvent.click(screen.getByRole("option", { name: /Jardas passadas/ }));

    expect(onValueChange).toHaveBeenCalledWith(["passing-yards"]);
    expect(screen.getByPlaceholderText("Buscar estatística…")).toBeTruthy();
  });
});
