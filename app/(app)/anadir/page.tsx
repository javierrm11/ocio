'use client';
import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Anadir from '@/components/anadir/anadir';
import { useAppStore } from '@/lib/stores/venueStore';
import { getToken } from '@/lib/hooks/getToken';

export default function AnadirPage() {
  const router = useRouter();
  const currentUser = useAppStore((s) => s.currentUser);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/profile');
      return;
    }
    if (currentUser && currentUser.role !== 'venue') {
      router.replace('/profile');
    }
  }, [currentUser, router]);

  if (!currentUser || currentUser.role !== 'venue') {
    return <div className="min-h-screen bg-ozio-dark" />;
  }

  return (
    <div className="m-0">
      <Suspense fallback={<div className="min-h-screen bg-ozio-dark" />}>
        <Anadir />
      </Suspense>
    </div>
  );
}
