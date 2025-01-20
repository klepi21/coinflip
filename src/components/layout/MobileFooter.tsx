'use client'

import { Home, Gamepad2, Wallet } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const MobileFooter = () => {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-[#1A1A1A] border-t border-zinc-800 md:hidden">
      <nav className="flex h-full">
        <Link
          href="/"
          className={`flex flex-col items-center justify-center w-full h-full ${
            isActive('/') ? 'text-primary' : 'text-white/60'
          }`}
        >
          <Home className="h-6 w-6" />
          <span className="text-xs mt-1">Home</span>
        </Link>
        <Link
          href="/hot"
          className={`flex flex-col items-center justify-center w-full h-full ${
            isActive('/hot') ? 'text-primary' : 'text-white/60'
          }`}
        >
          <Gamepad2 className="h-6 w-6" />
          <span className="text-xs mt-1">Games</span>
        </Link>
      </nav>
    </div>
  );
}; 