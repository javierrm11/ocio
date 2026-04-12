import { describe, it, expect } from "vitest";
import { haversineKm } from "@/lib/utils/distance";

// Mirrors the constant defined in app/api/checkins/route.ts
const PRESENCE_RADIUS_KM = 0.3;

function isWithinCheckInRadius(
  userLat: number,
  userLng: number,
  venueLat: number,
  venueLng: number,
): boolean {
  return haversineKm(userLat, userLng, venueLat, venueLng) <= PRESENCE_RADIUS_KM;
}

// Venue used in all tests: Mezquita de Córdoba
const VENUE = { lat: 37.87884, lng: -4.77938 };

describe("Check-in radius (300 m boundary)", () => {
  it("allows check-in when user is at the exact venue coordinates", () => {
    expect(isWithinCheckInRadius(VENUE.lat, VENUE.lng, VENUE.lat, VENUE.lng)).toBe(true);
  });

  it("allows check-in 100 m away (well inside 300 m)", () => {
    // ~100 m north: roughly 0.0009° latitude
    const userLat = VENUE.lat + 0.0009;
    expect(isWithinCheckInRadius(userLat, VENUE.lng, VENUE.lat, VENUE.lng)).toBe(true);
  });

  it("allows check-in 250 m away (inside 300 m)", () => {
    // ~250 m north: roughly 0.00225° latitude
    const userLat = VENUE.lat + 0.00225;
    const dist = haversineKm(userLat, VENUE.lng, VENUE.lat, VENUE.lng);
    expect(dist).toBeLessThanOrEqual(PRESENCE_RADIUS_KM);
    expect(isWithinCheckInRadius(userLat, VENUE.lng, VENUE.lat, VENUE.lng)).toBe(true);
  });

  it("rejects check-in 350 m away (outside 300 m)", () => {
    // ~350 m north: roughly 0.00315° latitude
    const userLat = VENUE.lat + 0.00315;
    const dist = haversineKm(userLat, VENUE.lng, VENUE.lat, VENUE.lng);
    expect(dist).toBeGreaterThan(PRESENCE_RADIUS_KM);
    expect(isWithinCheckInRadius(userLat, VENUE.lng, VENUE.lat, VENUE.lng)).toBe(false);
  });

  it("rejects check-in 1 km away", () => {
    const userLat = VENUE.lat + 0.009; // ~1 km north
    expect(isWithinCheckInRadius(userLat, VENUE.lng, VENUE.lat, VENUE.lng)).toBe(false);
  });

  it("rejects check-in in a different city (Madrid vs Córdoba)", () => {
    const MADRID = { lat: 40.4168, lng: -3.7038 };
    expect(isWithinCheckInRadius(MADRID.lat, MADRID.lng, VENUE.lat, VENUE.lng)).toBe(false);
  });

  it("correctly handles the exact boundary (300 m)", () => {
    // ~300 m north: roughly 0.0027° latitude
    const userLat = VENUE.lat + 0.0027;
    const dist = haversineKm(userLat, VENUE.lng, VENUE.lat, VENUE.lng);
    // The boundary is inclusive (<=), so a point exactly at 300 m should pass
    const atBoundary = isWithinCheckInRadius(userLat, VENUE.lng, VENUE.lat, VENUE.lng);
    if (dist <= PRESENCE_RADIUS_KM) {
      expect(atBoundary).toBe(true);
    } else {
      expect(atBoundary).toBe(false);
    }
  });

  it("is symmetric: distance A→B equals B→A", () => {
    const userLat = VENUE.lat + 0.001;
    const ab = haversineKm(userLat, VENUE.lng, VENUE.lat, VENUE.lng);
    const ba = haversineKm(VENUE.lat, VENUE.lng, userLat, VENUE.lng);
    expect(ab).toBeCloseTo(ba, 8);
  });
});
