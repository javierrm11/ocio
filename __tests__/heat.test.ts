import { describe, it, expect } from "vitest";
import {
  getHeatStep,
  getHeatCategory,
  getHeatLabel,
  getHeatGradient,
} from "@/components/mapa/utils";

describe("getHeatStep", () => {
  it("returns 0 for 0 check-ins", () => {
    expect(getHeatStep(0)).toBe(0);
  });

  it("returns the number of check-ins when below 10", () => {
    expect(getHeatStep(5)).toBe(5);
    expect(getHeatStep(9)).toBe(9);
  });

  it("caps at 10", () => {
    expect(getHeatStep(10)).toBe(10);
    expect(getHeatStep(50)).toBe(10);
  });
});

describe("getHeatCategory", () => {
  it("classifies 0–3 as 'tranquilo'", () => {
    expect(getHeatCategory(0)).toBe("tranquilo");
    expect(getHeatCategory(3)).toBe("tranquilo");
  });

  it("classifies 4–6 as 'animado'", () => {
    expect(getHeatCategory(4)).toBe("animado");
    expect(getHeatCategory(6)).toBe("animado");
  });

  it("classifies 7–9 as 'muy_animado'", () => {
    expect(getHeatCategory(7)).toBe("muy_animado");
    expect(getHeatCategory(9)).toBe("muy_animado");
  });

  it("classifies 10 as 'lleno'", () => {
    expect(getHeatCategory(10)).toBe("lleno");
  });

  it("covers every integer in 0–10", () => {
    const categories = Array.from({ length: 11 }, (_, i) => getHeatCategory(i));
    // No undefined / unexpected values
    const valid = new Set(["tranquilo", "animado", "muy_animado", "lleno"]);
    categories.forEach((c) => expect(valid.has(c)).toBe(true));
  });
});

describe("getHeatLabel", () => {
  it("returns 'Tranquilo' for low occupancy", () => {
    expect(getHeatLabel(0)).toBe("Tranquilo");
    expect(getHeatLabel(3)).toBe("Tranquilo");
  });

  it("returns 'Animado' for medium occupancy", () => {
    expect(getHeatLabel(5)).toBe("Animado");
  });

  it("returns 'Muy animado' for high occupancy", () => {
    expect(getHeatLabel(8)).toBe("Muy animado");
  });

  it("returns 'Lleno' when at cap (10+)", () => {
    expect(getHeatLabel(10)).toBe("Lleno");
    expect(getHeatLabel(25)).toBe("Lleno"); // capped by getHeatStep
  });
});

describe("getHeatGradient", () => {
  it("returns a green gradient for 0 check-ins", () => {
    expect(getHeatGradient(0)).toContain("emerald");
  });

  it("returns a yellow/orange gradient for 1–4 check-ins", () => {
    const g = getHeatGradient(3);
    expect(g).toMatch(/yellow|orange|amber/);
  });

  it("returns a red/orange gradient for 5+ check-ins", () => {
    const g = getHeatGradient(5);
    expect(g).toMatch(/orange|red|rose/);
  });

  it("always returns a non-empty string", () => {
    [0, 1, 4, 5, 10, 99].forEach((n) => {
      expect(getHeatGradient(n).length).toBeGreaterThan(0);
    });
  });
});
