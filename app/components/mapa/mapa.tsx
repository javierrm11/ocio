import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import { useEffect, useState } from 'react';
import { getPublicImageUrl } from '@/lib/getImageUrl';
import 'leaflet/dist/leaflet.css';
import { on } from 'events';

interface Venue {
  id: number;
  latitude: number;
  longitude: number;
  name: string;
  ambience_level: 'low' | 'medium' | 'high';
  description?: string;
  avatar_path?: string; // Path guardado en la BD
  distance?: string;
  genres?: string[];
  rating?: number;
  check_ins?: number;
}

function MyMap() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);

  useEffect(() => {
    fetch('http://localhost:3000/api/venues')
      .then(res => res.json())
      .then(data => setVenues(data))
      .catch(err => console.error(err));
  }, []);

  const handleVenueClick = (venue: Venue) => {
    setSelectedVenue(venue);
  };

  const closeModal = () => {
    setSelectedVenue(null);
  };

  const onCheckIn = (venueId:any) => {    
    // llamar a la API para hacer check-in
    fetch(`http://localhost:3000/api/checkins`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ venue_id: venueId })
    })
    .then(res => res.json())
    .then(data => { 
      closeModal();
    })
    .catch(err => {
      console.error('Error during check-in:', err);
    });
  };

  const onCheckOut = (id:any) => {
    // llamar a la API para quitar check-in
    fetch(`http://localhost:3000/api/checkins/${id}`, {
      method: 'DELETE',
    })
    .then(res => res.json())
    .then(data => {
      closeModal();
    })
    .catch(err => {
      console.error('Error during check-out:', err);
    });
  };

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
              venue.check_ins.length === 0
                ? '#10b981'
                : venue.check_ins.length < 5
                ? '#f59e0b'
                : '#ef4444'
            }
            fillColor={
              venue.check_ins.length === 0
                ? '#6ee7b7'
                : venue.check_ins.length < 5
                ? '#fcd34d'
                : '#fca5a5'
            }
            fillOpacity={0.8}
            eventHandlers={{
              click: () => handleVenueClick(venue)
            }}
          >
            <Tooltip
              direction="bottom"
              offset={[0, 10] as [number, number]}
              opacity={1}
              permanent
            >
              <p 
                style={{ cursor: 'pointer', margin: 0 }}
                onClick={() => handleVenueClick(venue)}
              >
                {venue.name}
              </p>
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Modal */}
      {selectedVenue && (
        <>
          <div 
            className="fixed inset-0 bg-black/40 z-[989]"
            onClick={closeModal}
          />
          
          <div 
          className="fixed bottom-0 left-0 right-0 z-[1002] animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
            <div className="bg-gray-900 rounded-t-3xl max-w-2xl mx-auto">
              <div className="relative h-64 rounded-t-3xl overflow-hidden">
                <img
                  src={selectedVenue.avatar_path}
                  alt={selectedVenue.name}
                  className="w-full h-full object-cover"
                />
                
                <button
                  onClick={closeModal}
                  className="absolute top-4 right-4 bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70 transition"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <div className="absolute top-4 left-4 text-white text-xs font-bold px-3 py-1 rounded-full" style={{
                  backgroundColor:
                    selectedVenue.check_ins.length === 0 ? '#10b981' :
                    selectedVenue.check_ins.length < 5 ? '#f59e0b' :
                    '#ef4444'
                }}>
                  {
                    selectedVenue.check_ins.length === 0 ? 'Low Ambience' :
                    selectedVenue.check_ins.length < 5 ? 'Medium Ambience' :
                    'High Ambience'
                  }
                </div>
              </div>

              <div className="p-6">
                <h2 className="text-white text-2xl font-bold mb-2">
                  {selectedVenue.name}
                </h2>

                <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
                  <span>{selectedVenue.distance || '940m away'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
                  {selectedVenue.check_ins && selectedVenue.check_ins.length > 0 ? (
                    <button 
                    type="button"
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-full flex items-center justify-center gap-2 transition"
                    onClick={() => onCheckOut(selectedVenue.id)}
                    >
                    Quitar check-in
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    </button>
                  ) : (
                    <button 
                    type="button"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-full flex items-center justify-center gap-2 transition"
                    onClick={() => onCheckIn(selectedVenue.id)}
                    >
                    Hacer check-in
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    </button>
                  )}
                  <button
                    type="button"
                    className="w-full bg-gray-700 hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded-full flex items-center justify-center gap-2 transition"
                    onClick={() => {
                      const url = `http://localhost:3000/venues/${selectedVenue.id}`;
                      window.open(url, '_blank');
                    }}>
                    Visitar
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 015.656 0l4 4a4 4 0 11-5.656 5.656l-1.102-1.101" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <style jsx global>{`
        .leaflet-control-zoom {
          position: fixed !important;
          top: 50% !important;
          right: 20px !important;
          left: auto !important;
          transform: translateY(-50%) !important;
          margin: 0 !important;
        }

        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
}

export default MyMap;
