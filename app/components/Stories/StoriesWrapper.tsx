"use client";

import Stories from '@/components/Stories/stories';
import { useAppStore } from '@/lib/stores/venueStore';

export default function StoriesWrapper() {
  const loaded = useAppStore((s) => s.loaded);
  if (!loaded) return null;
  return <Stories />;
}