"use client";
import { CircleMarker, Marker, Tooltip, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";
import { Venue } from "./types";
import { getEventStatus, createVenueIcon } from "./utils";
import { isPremium } from "@/lib/hooks/plan";

function MapFlyToBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 0) {
      map.fitBounds(L.latLngBounds(points), { padding: [60, 60] });
    }
  }, [points, map]);
  return null;
}

interface MapMarkersProps {
  filteredVenues: Venue[];
  userLocation: { latitude: number; longitude: number } | null;
  routePoints: [number, number][];
  onVenueClick: (venue: Venue) => void;
}

export function MapMarkers({
  filteredVenues,
  userLocation,
  routePoints,
  onVenueClick,
}: MapMarkersProps) {
  return (
    <>
      {userLocation && (
        <CircleMarker
          center={[userLocation.latitude, userLocation.longitude]}
          radius={8}
          pathOptions={{
            color: "#3b82f6",
            fillColor: "#60a5fa",
            fillOpacity: 0.9,
            weight: 3,
          }}
        >
          <Tooltip direction="top" offset={[0, -10]} opacity={1}>
            📍 Tu ubicación
          </Tooltip>
        </CircleMarker>
      )}

      {filteredVenues.map((venue) => {
        const eventStatus = getEventStatus(venue);
        const checkinsCount = venue.check_ins?.length || 0;
        return (
          <Marker
            key={`${venue.id}-${checkinsCount}`}
            position={[venue.latitude, venue.longitude] as [number, number]}
            icon={createVenueIcon(
              venue.avatar_path || null,
              checkinsCount,
              eventStatus,
              isPremium(venue),
            )}
            eventHandlers={{ click: () => onVenueClick(venue) }}
          >
            <Tooltip direction="top" opacity={1} className="venue-tooltip">
              <p className="vt-name">{venue.name}</p>
              {eventStatus === "active" && (
                <p className="vt-event vt-event--active">🎉 Evento en curso</p>
              )}
              {eventStatus === "soon" && (
                <p className="vt-event vt-event--soon">🕐 Hoy próximamente</p>
              )}
            </Tooltip>
          </Marker>
        );
      })}

      {routePoints.length > 0 && (
        <>
          <Polyline
            positions={routePoints}
            pathOptions={{ color: "#3b82f6", weight: 5, opacity: 0.85, lineCap: "round", lineJoin: "round" }}
          />
          <MapFlyToBounds points={routePoints} />
        </>
      )}
    </>
  );
}
