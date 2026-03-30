'use client';
import Buscar from '@/components/buscar/buscar';
import Header from '@/components/layout/header';
import BottomNav from '@/components/Boton/BottomNav';

export default function DestacadosPage() {
  return (
    <div className="m-0">
      {/* Encabezado de la página */}
      <Buscar />
      <BottomNav />
    </div>
  );
}