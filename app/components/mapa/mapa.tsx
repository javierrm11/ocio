import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';

interface Venue {
  id: number;
  latitude: number;
  longitude: number;
  name: string;
  ambience_level: 'low' | 'medium' | 'high';
}

function MyMap() {
  const [venues, setVenues] = useState<Venue[]>([]);

  useEffect(() => {
    fetch('http://localhost:3000/api/venues')
      .then(res => res.json())
      .then(data => setVenues(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <>
      <MapContainer
        center={[37.8787857, -4.766206] as [number, number]}
        zoom={14}
        style={{ height: '100vh', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© OpenStreetMap contributors'
        />

        {venues.map(venue => (
          <CircleMarker
            key={venue.id}
            center={[venue.latitude, venue.longitude] as [number, number]}
            radius={8}
            color={
              venue.ambience_level === 'low'
                ? '#10b981'
                : venue.ambience_level === 'medium'
                ? '#f59e0b'
                : '#ef4444'
            }
            fillColor={
              venue.ambience_level === 'low'
                ? '#6ee7b7'
                : venue.ambience_level === 'medium'
                ? '#fcd34d'
                : '#fca5a5'
            }
            fillOpacity={0.8}
          >
            <Tooltip
              direction="bottom"
              offset={[0, 10] as [number, number]}
              opacity={1}
              permanent
            >
              <strong>{venue.name}</strong>
              <br />
              <small>{venue.ambience_level}</small>
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>

      <style jsx global>{`
        .leaflet-control-zoom {
          position: fixed !important;
          top: 50% !important;
          right: 20px !important;
          left: auto !important;
          transform: translateY(-50%) !important;
          margin: 0 !important;
        }
      `}</style>
    </>
  );
}

export default MyMap;