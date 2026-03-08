"use client";
import { useEffect } from "react";
import { useAppStore } from "@/lib/stores/venueStore";

export function AppInitializer() {
  const { loaded, setVenues, setUserFavorites, setCurrentUser, setLoaded } = useAppStore();

  useEffect(() => {
    if (loaded) return;

    const token = localStorage.getItem("token") || sessionStorage.getItem("token");

    const loadData = async () => {
      const venuesRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/venues`);
      const venuesData = await venuesRes.json();

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
          const [favData, profileData] = await Promise.all([favRes.json(), profileRes.json()]);
          const favoriteIds = favData.map((f: any) => f.venue_id);

          setUserFavorites(favoriteIds);
          setCurrentUser(profileData[0]);
          setVenues(venuesData.map((v: any) => ({ ...v, is_favorite: favoriteIds.includes(v.id) })));
        } catch {
          setVenues(venuesData);
        }
      } else {
        setVenues(venuesData);
      }

      setLoaded(true);
    };

    loadData();
  }, [loaded]);

  return null; // No renderiza nada
}