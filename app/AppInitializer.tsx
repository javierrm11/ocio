"use client";
import { useEffect } from "react";
import { useAppStore } from "@/lib/stores/venueStore";

export function AppInitializer() {
  const {
    loaded,
    setVenues,
    setUserFavorites,
    setCurrentUser,
    setLoaded,
    setEvents,
    setUserLocation,
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
          // fallback Córdoba
          setUserLocation({
            latitude: 37.8787857,
            longitude: -4.766206,
          });
        },
      );
    } else {
      setUserLocation({
        latitude: 37.8787857,
        longitude: -4.766206,
      });
    }

    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");

    const loadData = async () => {
      const venuesRes = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/venues`,
      );
      const venuesData = await venuesRes.json();
      const eventsRes = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/events`,
      );
      const eventsData = await eventsRes.json();

      // ✅ Enriquecer eventos con los datos del venue
      const eventsWithVenues = eventsData.map((event: any) => ({
        ...event,
        venues: venuesData.find((v: any) => v.id === event.venue_id) || null,
      }));

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
          const favoriteIds = favData.map((f: any) => f.venue_id);

          setUserFavorites(favoriteIds);
          setCurrentUser(profileData[0]);
          setVenues(
            venuesData.map((v: any) => ({
              ...v,
              is_favorite: favoriteIds.includes(v.id),
            })),
          );
          setEvents(eventsWithVenues); // 👈
        } catch {
          setVenues(venuesData);
          setEvents(eventsWithVenues); // 👈
        }
      } else {
        setVenues(venuesData);
        setEvents(eventsWithVenues); // 👈
      }

      setLoaded(true);
    };

    loadData();
  }, [loaded]);

  return null; // No renderiza nada
}
