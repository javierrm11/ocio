'use client';
import Eventos from '@/components/eventos/eventos';
import Header from '@/components/layout/header';
import BottomNav from '@/components/Boton/BottomNav';

export default function DestacadosPage() {
  return (
    <div className="m-0">
      {/* Encabezado de la página */}
      <Eventos />
      <BottomNav />
    </div>
  );
}