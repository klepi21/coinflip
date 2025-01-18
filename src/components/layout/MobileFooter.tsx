'use client'

import { Home, Coins } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const MobileFooter = () => {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/20 backdrop-blur-lg border-t border-white/10 lg:hidden">
      <div className="flex justify-around items-center h-16">
        <Link 
          href="/"
          className={`flex flex-col items-center justify-center w-full h-full ${
            isActive('/') ? 'text-primary' : 'text-white/60'
          }`}
        >
          <Home className="h-6 w-6" />
          <span className="text-xs mt-1 font-doggie">Home</span>
        </Link>

        <Link 
          href="/scratch"
          className={`flex flex-col items-center justify-center w-full h-full ${
            isActive('/scratch') ? 'text-primary' : 'text-white/60'
          }`}
        >
          <Coins className="h-6 w-6" />
          <span className="text-xs mt-1 font-doggie">Scratch</span>
        </Link>
      </div>
    </div>
  );
}; 