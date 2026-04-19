"use client";
import { useEffect, useRef } from "react";
import { haversineKm } from "@/lib/utils/distance";
import { Venue } from "@/components/mapa/types";
import { isVenueOpen } from "@/components/mapa/utils";

const PROXIMITY_KM = 0.3;
const DELAY_MS = 1 * 60 * 1000;

interface UseAutoCheckinProps {
  venues: Venue[];
  userLocation: { latitude: number; longitude: number } | null;
  currentProfileId: string | undefined;
  onAutoCheckIn: (venueId: string) => void;
  onAutoCheckOut: (venueId: string) => void;
}

export function useAutoCheckin({
  venues,
  userLocation,
  currentProfileId,
  onAutoCheckIn,
  onAutoCheckOut,
}: UseAutoCheckinProps) {
  const prevNearby = useRef<Set<string>>(new Set());
  const checkInTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const checkOutTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Keep latest callbacks in refs so timers don't capture stale closures
  const onAutoCheckInRef = useRef(onAutoCheckIn);
  const onAutoCheckOutRef = useRef(onAutoCheckOut);
  useEffect(() => { onAutoCheckInRef.current = onAutoCheckIn; }, [onAutoCheckIn]);
  useEffect(() => { onAutoCheckOutRef.current = onAutoCheckOut; }, [onAutoCheckOut]);

  useEffect(() => {
    if (!userLocation || !currentProfileId) return;
    const { latitude, longitude } = userLocation;

    // Venues within 300m that are currently open
    const currentNearby = new Set<string>();
    for (const venue of venues) {
      const dist = haversineKm(latitude, longitude, venue.latitude, venue.longitude);
      if (dist <= PROXIMITY_KM && isVenueOpen(venue)) {
        currentNearby.add(venue.id);
      }
    }

    // Newly entered venues
    for (const venueId of currentNearby) {
      if (!prevNearby.current.has(venueId)) {
        const outTimer = checkOutTimers.current.get(venueId);
        if (outTimer !== undefined) {
          clearTimeout(outTimer);
          checkOutTimers.current.delete(venueId);
        }

        const venue = venues.find((v) => v.id === venueId);
        const isCheckedIn = venue?.check_ins?.some((c: any) => c.profile_id === currentProfileId) ?? false;
        if (!isCheckedIn && !checkInTimers.current.has(venueId)) {
          const id = setTimeout(() => {
            checkInTimers.current.delete(venueId);
            onAutoCheckInRef.current(venueId);
          }, DELAY_MS);
          checkInTimers.current.set(venueId, id);
        }
      }
    }

    // Newly exited venues
    for (const venueId of prevNearby.current) {
      if (!currentNearby.has(venueId)) {
        const inTimer = checkInTimers.current.get(venueId);
        if (inTimer !== undefined) {
          clearTimeout(inTimer);
          checkInTimers.current.delete(venueId);
        }

        const venue = venues.find((v) => v.id === venueId);
        const isCheckedIn = venue?.check_ins?.some((c: any) => c.profile_id === currentProfileId) ?? false;
        if (isCheckedIn && !checkOutTimers.current.has(venueId)) {
          const id = setTimeout(() => {
            checkOutTimers.current.delete(venueId);
            onAutoCheckOutRef.current(venueId);
          }, DELAY_MS);
          checkOutTimers.current.set(venueId, id);
        }
      }
    }

    prevNearby.current = currentNearby;
  }, [userLocation, venues, currentProfileId]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      checkInTimers.current.forEach(clearTimeout);
      checkOutTimers.current.forEach(clearTimeout);
    };
  }, []);
}
