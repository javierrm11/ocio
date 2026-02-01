'use client';
import MyMap from '@/components/mapa/mapa';
import Header from '@/components/layout/header';
import BottomNav from '@/components/Boton/BottomNav';

export default function MapaPage() {
  return (
    <div className="m-0">
      {/* Encabezado de la página */}
      <Header />
      <MyMap />
      <BottomNav />
    </div>
  );
}