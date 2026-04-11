'use client';
import { Suspense } from 'react';
import Anadir from '@/components/anadir/anadir';
import BottomNav from '@/components/Boton/BottomNav';

export default function AnadirPage() {
  return (
    <div className="m-0">
      <Suspense fallback={<div className="min-h-screen bg-ozio-dark" />}>
        <Anadir />
      </Suspense>
    </div>
  );
}
