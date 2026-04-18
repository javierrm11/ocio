"use client";
import dynamic from 'next/dynamic';
import { MapLoader } from './MapLoader';

const MyMap = dynamic(() => import('@/components/mapa/mapa'), {
  ssr: false,
  loading: () => <MapLoader />,
});

export default function MapWrapper() {
  return <MyMap />;
}