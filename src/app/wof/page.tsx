'use client';

import { WheelOfFomo } from '@/components/ui/wheel-of-fomo';
import { RetroGrid } from '@/components/ui/retro-grid';

export default function WofPage() {
  return (
    <main className="relative min-h-screen bg-black">
      <RetroGrid />
      <div className="h-30 mt-10" />
      <WheelOfFomo />
    </main>
  );
} 