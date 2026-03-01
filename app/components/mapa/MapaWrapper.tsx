"use client";
import dynamic from 'next/dynamic';

const MyMap = dynamic(() => import('@/components/mapa/mapa'), { ssr: false });

export default function MapWrapper() {
  return <MyMap />;
}