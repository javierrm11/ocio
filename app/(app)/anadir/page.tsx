'use client';
import Anadir from '@/components/anadir/anadir';
import Header from '@/components/layout/header';
import BottomNav from '@/components/Boton/BottomNav';

export default function DestacadosPage() {
  return (
    <div className="m-0">
      {/* Encabezado de la página */}
      <Anadir />
      <BottomNav />
    </div>
  );
}