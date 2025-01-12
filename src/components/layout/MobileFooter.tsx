'use client'

import { useGetLoginInfo } from '@multiversx/sdk-dapp/hooks';
import { Home, User, Wallet, Grid } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const MobileFooter = () => {
  const { isLoggedIn } = useGetLoginInfo();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 lg:hidden">
      <div className="flex justify-around items-center h-16">
        <Link 
          href="/"
          className={`flex flex-col items-center justify-center w-full h-full ${
            isActive('/') ? 'text-stone-900' : 'text-stone-400'
          }`}
        >
          <Home className="h-6 w-6" />
          <span className="text-xs mt-1">Home</span>
        </Link>

        <Link 
          href="/portfolio"
          className={`flex flex-col items-center justify-center w-full h-full ${
            isActive('/portfolio') ? 'text-stone-900' : 'text-stone-400'
          }`}
        >
          <Grid className="h-6 w-6" />
          <span className="text-xs mt-1">Portfolio</span>
        </Link>

        {isLoggedIn ? (
          <Link 
            href="/dashboard"
            className={`flex flex-col items-center justify-center w-full h-full ${
              isActive('/dashboard') ? 'text-stone-900' : 'text-stone-400'
            }`}
          >
            <Wallet className="h-6 w-6" />
            <span className="text-xs mt-1">Wallet</span>
          </Link>
        ) : (
          <button 
            onClick={() => {}} // Add wallet connect handler
            className="flex flex-col items-center justify-center w-full h-full text-stone-400"
          >
            <Wallet className="h-6 w-6" />
            <span className="text-xs mt-1">Connect</span>
          </button>
        )}

        <Link 
          href="/profile"
          className={`flex flex-col items-center justify-center w-full h-full ${
            isActive('/profile') ? 'text-stone-900' : 'text-stone-400'
          }`}
        >
          <User className="h-6 w-6" />
          <span className="text-xs mt-1">Profile</span>
        </Link>
      </div>
    </div>
  );
}; 