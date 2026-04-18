"use client";
import { useEffect } from "react";
import { useAppStore, StoryGroup } from "@/lib/stores/venueStore";
import { getToken } from '@/lib/hooks/getToken';


export function AppInitializer() {
  const {
    loaded,
    setVenues,
    setUserFavorites,
    setCurrentUser,
    setLoaded,
    setEvents,
    setStoryGroups,
    setUserLocation,
    setLocationDenied,
  } = useAppStore();

  useEffect(() => {
    if (loaded) return;
    // ✅ NUEVO: obtener ubicación del usuario
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {
          setLocationDenied(true);
        },
      );
    } else {
      setLocationDenied(true);
    }

    const token = getToken();

    const loadData = async () => {
      // Venues, events y stories en paralelo
      const [venuesRes, eventsRes, storiesRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/venues`),
        fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/events`),
        fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/stories`),
      ]);
      const [venuesData, eventsData, storiesData] = await Promise.all([
        venuesRes.json(),
        eventsRes.json(),
        storiesRes.json(),
      ]);

      // Enriquecer eventos con los datos del venue
      const eventsWithVenues = eventsData.map((event: { venue_id: string; [key: string]: unknown }) => ({
        ...event,
        venues: venuesData.find((v: { id: string; [key: string]: unknown }) => v.id === event.venue_id) || null,
      }));

      // Agrupar stories por venue
      if (Array.isArray(storiesData)) {
        const groupMap = new Map<string, StoryGroup>();
        storiesData.forEach((story: StoryGroup['stories'][number]) => {
          if (!groupMap.has(story.venue_id)) {
            groupMap.set(story.venue_id, {
              venue_id: story.venue_id,
              venue_name: story.venues?.name ?? 'Local',
              venue_avatar: story.venues?.avatar_path,
              stories: [],
            });
          }
          groupMap.get(story.venue_id)!.stories.push(story);
        });
        setStoryGroups(Array.from(groupMap.values()));
      }

      // Mostrar contenido público inmediatamente
      setVenues(venuesData);
      setEvents(eventsWithVenues);
      setLoaded(true);

      // Auth en background, sin bloquear la UI
      if (token) {
        try {
          const [favRes, profileRes] = await Promise.all([
            fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/favorites`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/profile`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
          ]);
          const [favData, profileData] = await Promise.all([
            favRes.json(),
            profileRes.json(),
          ]);
          const favoriteIds = favData.map((f: { venue_id: number }) => f.venue_id);

          setUserFavorites(favoriteIds);
          setCurrentUser(profileData[0]);
          setVenues(
            venuesData.map((v: { id: string; [key: string]: unknown }) => ({
              ...v,
              is_favorite: favoriteIds.includes(v.id),
            })),
          );
        } catch {
          // Auth falló, el contenido público ya está visible
        }
      }
    };

    loadData();
  }, [loaded]);

  return null; // No renderiza nada
}
