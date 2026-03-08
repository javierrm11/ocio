import { useVenueStore } from '@/lib/stores/venueStore';

export function useVenues() {
  const { venues, isLoaded, setVenues, updateVenue, shouldRefetch } = useVenueStore();

  const loadVenues = async (force = false) => {
    if (isLoaded && !shouldRefetch() && !force) return; // ✅ Cache hit, no refetch

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    try {
      const venuesRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/venues`);
      const venuesData = await venuesRes.json();

      if (token) {
        try {
          const [favoritesRes, profileRes] = await Promise.all([
            fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/favorites`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/profile`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
          ]);

          const [favoritesData] = await Promise.all([
            favoritesRes.json(),
            profileRes.json(),
          ]);

          const favoriteIds = favoritesData.map((fav: any) => fav.venue_id);
          setVenues(venuesData.map((venue: any) => ({
            ...venue,
            is_favorite: favoriteIds.includes(venue.id),
          })));
        } catch {
          setVenues(venuesData);
        }
      } else {
        setVenues(venuesData);
      }
    } catch (err) {
      console.error('Error loading venues:', err);
    }
  };

  return { venues, isLoaded, loadVenues, updateVenue };
}