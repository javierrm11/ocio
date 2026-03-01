import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import { useEffect, useState } from 'react';
import { getPublicImageUrl } from '@/lib/getImageUrl';
import 'leaflet/dist/leaflet.css';

interface Venue {
  id: number;
  latitude: number;
  longitude: number;
  name: string;
  ambience_level: 'low' | 'medium' | 'high';
  description?: string;
  avatar_path?: string;
  distance?: string;
  genres?: string[];
  rating?: number;
  check_ins?: any[];
  is_favorite?: boolean;
}

interface UserProfile {
  id: string;
  username: string;
  role: 'user' | 'venue';
}

function MyMap() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [userFavorites, setUserFavorites] = useState<number[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    try {
      // Ejecutar todos los fetch en paralelo
      const [venuesRes, favoritesRes, profileRes] = await Promise.all([
        fetch('http://localhost:3000/api/venues'),
        fetch('http://localhost:3000/api/favorites', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:3000/api/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      // Parsear todas las respuestas en paralelo
      const [venuesData, favoritesData, profileData] = await Promise.all([
        venuesRes.json(),
        favoritesRes.json(),
        profileRes.json()
      ]);

      // Procesar datos
      const favoriteIds = favoritesData.map((fav: any) => fav.venue_id);
      setUserFavorites(favoriteIds);
      setCurrentUser(profileData[0]);

      // Marcar venues como favoritos
      const venuesWithFavorites = venuesData.map((venue: Venue) => ({
        ...venue,
        is_favorite: favoriteIds.includes(venue.id)
      }));
      
      setVenues(venuesWithFavorites);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVenueClick = (venue: Venue) => {
    setSelectedVenue(venue);
  };

  const closeModal = () => {
    setSelectedVenue(null);
  };

  const onCheckIn = (venueId: any) => {    
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    fetch(`http://localhost:3000/api/checkins`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ venue_id: venueId })
    })
    .then(res => res.json())
    .then(data => { 
      setVenues(venues.map(v => 
        v.id === venueId ? { ...v, check_ins: [...(v.check_ins || []), data] } : v
      ));
      if (selectedVenue && selectedVenue.id === venueId) {
        setSelectedVenue({ ...selectedVenue, check_ins: [...(selectedVenue.check_ins || []), data] });
      }
      closeModal();
    })
    .catch(err => {
      console.error('Error during check-in:', err);
    });
  };

  const onCheckOut = (venueId: any) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    fetch(`http://localhost:3000/api/checkins/${venueId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(res => res.json())
    .then(data => {
      setVenues(venues.map(v => 
        v.id === venueId ? { ...v, check_ins: [] } : v
      ));
      if (selectedVenue && selectedVenue.id === venueId) {
        setSelectedVenue({ ...selectedVenue, check_ins: [] });
      }
      closeModal();
    })
    .catch(err => {
      console.error('Error during check-out:', err);
    });
  };

  const toggleFavorite = (venueId: number, isFavorite: boolean) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (isFavorite) {
      // Quitar de favoritos - DELETE
      fetch(`http://localhost:3000/api/favorites/${venueId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => res.json())
      .then(data => {
        setVenues(venues.map(venue =>
          venue.id === venueId ? { ...venue, is_favorite: false } : venue
        ));
        if (selectedVenue && selectedVenue.id === venueId) {
          setSelectedVenue({ ...selectedVenue, is_favorite: false });
        }
        setUserFavorites(userFavorites.filter(id => id !== venueId));
      })
      .catch(err => {
        console.error('Error removing favorite:', err);
      });
    } else {
      // Agregar a favoritos - POST
      fetch(`http://localhost:3000/api/favorites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ venue_id: venueId })
      })
      .then(res => res.json())
      .then(data => {
        setVenues(venues.map(venue =>
          venue.id === venueId ? { ...venue, is_favorite: true } : venue
        ));
        if (selectedVenue && selectedVenue.id === venueId) {
          setSelectedVenue({ ...selectedVenue, is_favorite: true });
        }
        setUserFavorites([...userFavorites, venueId]);
      })
      .catch(err => {
        console.error('Error adding favorite:', err);
      });
    }
  };

  const isUserProfile = currentUser?.username !== undefined && currentUser?.username !== null;

  // Pantalla de carga
  if (loading) {
    return (
      <div className="fixed inset-0 bg-ozio-dark flex flex-col items-center justify-center z-50">
        <div className="relative">
          {/* Spinner animado */}
          <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-ozio-blue"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-gradient-to-br from-ozio-blue to-ozio-purple rounded-full opacity-50"></div>
          </div>
        </div>
        <p className="text-white text-lg font-semibold mt-6 animate-pulse">
          Cargando mapa...
        </p>
      </div>
    );
  }

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
              venue.check_ins?.length === 0
                ? '#10b981'
                : (venue.check_ins?.length || 0) < 5
                ? '#f59e0b'
                : '#ef4444'
            }
            fillColor={
              venue.check_ins?.length === 0
                ? '#6ee7b7'
                : (venue.check_ins?.length || 0) < 5
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
                    (selectedVenue.check_ins?.length || 0) === 0 ? '#10b981' :
                    (selectedVenue.check_ins?.length || 0) < 5 ? '#f59e0b' :
                    '#ef4444'
                }}>
                  {
                    (selectedVenue.check_ins?.length || 0) === 0 ? 'Low Ambience' :
                    (selectedVenue.check_ins?.length || 0) < 5 ? 'Medium Ambience' :
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
                  {isUserProfile && (
                    selectedVenue.check_ins && selectedVenue.check_ins.length > 0 ? (
                      <button 
                        type="button"
                        className="flex-10 w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-full flex items-center justify-center gap-2 transition"
                        onClick={() => onCheckOut(selectedVenue.id)}
                      >
                        Quitar check-in
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    ) : (
                      <button 
                        type="button"
                        className="flex-10 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-full flex items-center justify-center gap-2 transition"
                        onClick={() => onCheckIn(selectedVenue.id)}
                      >
                        Hacer check-in
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    )
                  )}
                  
                  <button
                    type="button"
                    className={`flex-1 w-full font-semibold py-3 px-6 rounded-full flex items-center justify-center gap-2 transition ${
                      selectedVenue.is_favorite 
                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                        : 'bg-gray-600 hover:bg-gray-700 text-white'
                    }`}
                    onClick={() => toggleFavorite(selectedVenue.id, selectedVenue.is_favorite || false)}
                  >
                    <svg 
                      className="w-5 h-5" 
                      fill={selectedVenue.is_favorite ? "currentColor" : "none"} 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
                      />
                    </svg>
                  </button>

                  <button
                    type="button"
                    className="flex-1 w-full bg-gray-700 hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded-full flex items-center justify-center gap-2 transition"
                    onClick={() => {
                      const url = `http://localhost:3000/venues/${selectedVenue.id}`;
                      window.open(url, '_blank');
                    }}
                  >
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