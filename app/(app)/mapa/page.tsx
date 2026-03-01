"use client";
import MyMap from '@/components/mapa/mapa';
import Header from '@/components/layout/header';
import BottomNav from '@/components/Boton/BottomNav';
import StoriesWrapper from '@/components/Stories/StoriesWrapper';

export default function MapaPage() {
  return (
    <div className="m-0">
      {/* Encabezado de la página */}
      <div className='w-full bg-gradient-to-b from-gray-900 to-transparent absolute top-0 left-0 z-991'>
        <Header />
        <StoriesWrapper />
      </div>
      <MyMap />
      <BottomNav />
    </div>
  );
}