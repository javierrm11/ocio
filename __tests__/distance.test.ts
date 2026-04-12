import { describe, it, expect } from "vitest";
import { haversineKm } from "@/lib/utils/distance";
import { getDistanceKm, parseDistanceToKm } from "@/components/mapa/utils";

// Known reference pairs (verified with third-party tools)
const CORDOBA_MEZQUITA = { lat: 37.87884, lng: -4.77938 };
const CORDOBA_ALCAZAR   = { lat: 37.87583, lng: -4.78139 };
const MADRID_SOL        = { lat: 40.4168,  lng: -3.7038  };
const MADRID_RETIRO     = { lat: 40.4153,  lng: -3.6844  };

describe("haversineKm", () => {
  it("returns 0 for identical coordinates", () => {
    expect(haversineKm(37.8, -4.7, 37.8, -4.7)).toBe(0);
  });

  it("is symmetric", () => {
    const ab = haversineKm(CORDOBA_MEZQUITA.lat, CORDOBA_MEZQUITA.lng, CORDOBA_ALCAZAR.lat, CORDOBA_ALCAZAR.lng);
    const ba = haversineKm(CORDOBA_ALCAZAR.lat, CORDOBA_ALCAZAR.lng, CORDOBA_MEZQUITA.lat, CORDOBA_MEZQUITA.lng);
    expect(ab).toBeCloseTo(ba, 6);
  });

  it("Mezquita → Alcázar is roughly 350 m", () => {
    const km = haversineKm(CORDOBA_MEZQUITA.lat, CORDOBA_MEZQUITA.lng, CORDOBA_ALCAZAR.lat, CORDOBA_ALCAZAR.lng);
    expect(km).toBeGreaterThan(0.3);
    expect(km).toBeLessThan(0.5);
  });

  it("Sol → Retiro is roughly 1.6 km", () => {
    const km = haversineKm(MADRID_SOL.lat, MADRID_SOL.lng, MADRID_RETIRO.lat, MADRID_RETIRO.lng);
    expect(km).toBeGreaterThan(1.4);
    expect(km).toBeLessThan(1.8);
  });

  it("always returns a non-negative value", () => {
    expect(haversineKm(0, 0, 90, 180)).toBeGreaterThanOrEqual(0);
  });
});

describe("getDistanceKm (display string)", () => {
  it('formats sub-km distances as metres: "350m"', () => {
    // ~350 m apart
    const result = getDistanceKm(
      CORDOBA_MEZQUITA.lat, CORDOBA_MEZQUITA.lng,
      CORDOBA_ALCAZAR.lat,  CORDOBA_ALCAZAR.lng,
    );
    expect(result).toMatch(/^\d+m$/);
  });

  it('formats km distances with one decimal: "1.6km"', () => {
    const result = getDistanceKm(
      MADRID_SOL.lat,    MADRID_SOL.lng,
      MADRID_RETIRO.lat, MADRID_RETIRO.lng,
    );
    expect(result).toMatch(/^\d+\.\d{1}km$/);
  });

  it('switches to km format above 1 km', () => {
    const result = getDistanceKm(
      MADRID_SOL.lat,    MADRID_SOL.lng,
      MADRID_RETIRO.lat, MADRID_RETIRO.lng,
    );
    expect(result.endsWith("km")).toBe(true);
  });
});

describe("parseDistanceToKm", () => {
  it("parses '500m' correctly", () => {
    expect(parseDistanceToKm("500m")).toBeCloseTo(0.5);
  });

  it("parses '1.5km' correctly", () => {
    expect(parseDistanceToKm("1.5km")).toBeCloseTo(1.5);
  });

  it("parses '10km' correctly", () => {
    expect(parseDistanceToKm("10km")).toBeCloseTo(10);
  });

  it("returns Infinity for undefined input", () => {
    expect(parseDistanceToKm(undefined)).toBe(Number.POSITIVE_INFINITY);
  });

  it("returns Infinity for non-numeric strings", () => {
    expect(parseDistanceToKm("desconocida")).toBe(Number.POSITIVE_INFINITY);
  });

  it("is case-insensitive for units", () => {
    expect(parseDistanceToKm("2KM")).toBeCloseTo(2);
    expect(parseDistanceToKm("200M")).toBeCloseTo(0.2);
  });
});
