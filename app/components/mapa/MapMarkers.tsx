"use client";
import { CircleMarker, Tooltip, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect, useRef } from "react";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
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

function VenueClusterLayer({
  venues,
  onVenueClick,
}: {
  venues: Venue[];
  onVenueClick: (venue: Venue) => void;
}) {
  const map = useMap();
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    if (clusterRef.current) {
      map.removeLayer(clusterRef.current);
    }

    const cluster = L.markerClusterGroup({
      maxClusterRadius: 55,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      disableClusteringAtZoom: 16,
      iconCreateFunction: (c) => {
        const n = c.getChildCount();
        return L.divIcon({
          html: `<div style="
            width:38px;height:38px;border-radius:50%;
            background:rgba(10,14,26,0.93);
            border:2px solid rgba(99,102,241,0.75);
            box-shadow:0 0 16px rgba(99,102,241,0.45);
            display:flex;align-items:center;justify-content:center;
            color:#fff;font-weight:700;font-size:13px;
            font-family:inherit;
          ">${n}</div>`,
          className: "",
          iconSize: L.point(38, 38),
          iconAnchor: L.point(19, 19),
        });
      },
    });

    for (const venue of venues) {
      const eventStatus = getEventStatus(venue);
      const count = venue.check_ins?.length || 0;
      const marker = L.marker([venue.latitude, venue.longitude], {
        icon: createVenueIcon(venue.avatar_path || null, count, eventStatus, isPremium(venue)),
      });

      marker.on("click", () => onVenueClick(venue));

      let tooltipHtml = `<p class="vt-name">${venue.name}</p>`;
      if (eventStatus === "active")
        tooltipHtml += `<p class="vt-event vt-event--active">🎉 Evento en curso</p>`;
      else if (eventStatus === "soon")
        tooltipHtml += `<p class="vt-event vt-event--soon">🕐 Hoy próximamente</p>`;

      marker.bindTooltip(tooltipHtml, {
        direction: "top",
        className: "venue-tooltip",
        opacity: 1,
      });

      cluster.addLayer(marker);
    }

    map.addLayer(cluster);
    clusterRef.current = cluster;

    return () => {
      map.removeLayer(cluster);
    };
  }, [map, venues, onVenueClick]);

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

      <VenueClusterLayer venues={filteredVenues} onVenueClick={onVenueClick} />

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
