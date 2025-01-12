'use client'

import React from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { WalletButton } from '../wallet/WalletButton';
import { NavBar } from '../ui/tubelight-navbar';
import { Home, Coins } from 'lucide-react';
import { HyperText } from '../ui/hyper-text';
import Link from 'next/link';

export const Navbar = () => {
  const pathname = usePathname();

  const navItems = [
    { name: 'Home', url: '/', icon: Home },
    { name: 'Liquid Funds', url: '/liquid-funds', icon: Coins }
  ];

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-40 bg-transparent"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center">
            <HyperText
              text="CRYPTOMURMURA2.0"
              className="text-lg font-bold text-white"
              duration={1000}
              animateOnLoad={false}
            />
          </Link>
          
          <div className="flex-1 flex justify-center">
            <NavBar 
              items={navItems} 
              className="!static !transform-none !mb-0 !pt-0" 
            />
          </div>

          <div className="flex items-center gap-4">
            <WalletButton />
          </div>
        </div>
      </div>
    </motion.nav>
  );
};