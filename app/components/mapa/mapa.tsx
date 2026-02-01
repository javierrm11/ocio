import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';

interface Venue {
  id: number;
  latitude: number;
  longitude: number;
  name: string;
  ambience_level: 'low' | 'medium' | 'high';
  description?: string;
  distance?: string;
  genres?: string[];
  rating?: number;
  image?: string;
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
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/30 bg-opacity-50 z-[989]"
            onClick={closeModal}
          />
          
          {/* Modal Content */}
          <div className="fixed bottom-0 left-0 right-0 z-[1002] animate-slide-up">
            <div className="bg-gray-900 rounded-t-3xl max-w-2xl mx-auto">
              {/* Venue Image */}
              <div className="relative h-64 rounded-t-3xl overflow-hidden">
                <img
                  src={selectedVenue.image || 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800'}
                  alt={selectedVenue.name}
                  className="w-full h-full object-cover"
                />
                
                {/* Close Button */}
                <button
                  onClick={closeModal}
                  className="absolute top-4 right-4 bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70 transition"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <div className={`absolute top-4 left-4 text-white text-xs font-bold px-3 py-1 rounded-full ${
                  selectedVenue.ambience_level === 'low' ? 'bg-green-500' :
                  selectedVenue.ambience_level === 'medium' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}>
                  {selectedVenue.ambience_level === 'low' ? 'Low Ambience'
                   : selectedVenue.ambience_level === 'medium' ? 'Medium Ambience'
                   : 'High Ambience'}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Venue Name */}
                <h2 className="text-white text-2xl font-bold mb-2">
                  {selectedVenue.name}
                </h2>

                {/* Distance */}
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
                  <span>{selectedVenue.distance || '940m away'}</span>
                </div>

                {/* Description */}
                {selectedVenue.description && (
                  <p className="text-gray-400 text-sm mt-4">
                    {selectedVenue?.description}
                  </p>
                )}

                {/* events */}
                {selectedVenue.events && selectedVenue.events.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-white text-lg font-semibold mb-2">Events</h3>
                    <section className="space-y-3">
                      {selectedVenue.events.map((event: any) => (
                        <div key={event.id} className="bg-gray-800 p-4 rounded-lg">
                          <h4 className="text-white font-bold text-md">{event.title}</h4>
                          <p className="text-gray-400 text-sm">{event.description}</p>
                          <p className="text-gray-400 text-sm mt-2">
                            {new Date(event.starts_at).toLocaleString()} - {new Date(event.ends_at).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </section>
                  </div>
                )}


                {/* address*/}
                {selectedVenue.address && (
                  <p className="text-gray-400 text-sm mt-4">
                    Address: {selectedVenue.address}
                  </p>
                )}
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

        /* Prevent body scroll when modal is open */
        body:has(.fixed.bottom-0) {
          overflow: hidden;
        }
      `}</style>
    </>
  );
}

export default MyMap;