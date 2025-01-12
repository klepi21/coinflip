'use client'

import React from 'react';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { WorldMapDemo } from '@/components/ui/world-map-demo';

export const Home = () => {
  return (
    <div className="min-h-screen bg-black">
      <WorldMapDemo />
      
      <div className="flex items-center justify-center -mt-20">
        <Link
          href="/liquid-funds"
          className="group flex items-center gap-2 px-6 py-3 text-white border border-white/20 
                   rounded-xl hover:bg-white/10 transition-all duration-200"
        >
          <span>Explore Funds</span>
          <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
};