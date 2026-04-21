"use client";
import { useEffect } from "react";
import { useAppStore, StoryGroup } from "@/lib/stores/venueStore";
import { getToken } from '@/lib/hooks/getToken';
import { isNative, getNativeGeolocation } from '@/lib/native/capacitor-bridge';
import { setupPushNotifications } from '@/lib/native/push-setup';


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

    // Geolocalización: usar plugin nativo en Capacitor, browser API en web
    if (isNative()) {
      getNativeGeolocation().then(async (Geo) => {
        if (!Geo) { setLocationDenied(true); return; }
        try {
          await Geo.requestPermissions();
          const pos = await Geo.getCurrentPosition({ enableHighAccuracy: true });
          setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          Geo.watchPosition({ enableHighAccuracy: true }, (position) => {
            if (position) {
              setUserLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
            }
          });
        } catch {
          setLocationDenied(true);
        }
      });
    } else if (navigator.geolocation) {
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

          // Registrar push notifications nativas tras confirmar sesión
          if (profileData[0]?.id) {
            setupPushNotifications(profileData[0].id).catch(() => {});
          }
        } catch {
          // Auth falló, el contenido público ya está visible
        }
      }
    };

    loadData();
  }, [loaded]);

  return null; // No renderiza nada
}
