"use client";
import dynamic from 'next/dynamic';

const ProfilePage = dynamic(() => import('@/components/auth/Profile'), { ssr: false });

export default function ProfileWrapper() {
  return <ProfilePage />;
}