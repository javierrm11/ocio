"use client";
import MapWrapper from '@/components/mapa/MapaWrapper';
import Header from '@/components/layout/header';
import BottomNav from '@/components/Boton/BottomNav';
import StoriesWrapper from '@/components/Stories/StoriesWrapper';
import { MapSearchBar } from '@/components/mapa/MapSearchBar';

export default function MapaPage() {
  return (
    <div className="m-0">
      {/* Encabezado de la página */}
      <div className='w-full bg-gradient-to-b from-ozio-darker to-transparent absolute top-0 left-0 z-[991] pointer-events-none'>
        <div className='pointer-events-auto'><Header /></div>
        <div className='pointer-events-auto'><MapSearchBar /></div>
        <StoriesWrapper />
      </div>
      <MapWrapper />
      <BottomNav />
    </div>
  );
}