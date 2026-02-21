'use client';
import Destacados from '@/components/destacados/destacados';
import Header from '@/components/layout/header';
import BottomNav from '@/components/Boton/BottomNav';

export default function DestacadosPage() {
  return (
    <div className="m-0">
      {/* Encabezado de la página */}
      <div className='w-full bg-gradient-to-b from-gray-900 to-transparent absolute top-0 left-0 z-991'>
        <Header />
      </div>
      <Destacados />
      <BottomNav />
    </div>
  );
}