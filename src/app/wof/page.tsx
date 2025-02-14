'use client';

import { WheelOfFomo } from '@/components/ui/wheel-of-fomo';
import { RetroGrid } from '@/components/ui/retro-grid';

export default function WofPage() {
  return (
    <main className="relative min-h-screen bg-black">
      <RetroGrid />
      <WheelOfFomo />
    </main>
  );
} 