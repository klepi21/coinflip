'use client'

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { WalletButton } from '@/components/wallet/WalletButton';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useWallet } from '@/context/WalletContext';
import { WalletModal } from '../wallet/WalletModal';
import { HowToPlayModal } from '@/components/ui/how-to-play-modal';
import { cn } from '@/lib/utils';
import { ExpandableTabs } from '@/components/ui/expandable-tabs';
import Image from 'next/image';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const { isLoggedIn } = useWallet();

  const navItems = [
    { title: 'Fight', icon: '⚔️', type: undefined, url: '/' },
    { title: 'Wheel of Fomo', icon: '🎡', type: undefined, url: '/wof' },
    { title: 'Vote Fighter', icon: '🗳️', type: undefined, url: '/vote' },
    { title: 'Vote Token', icon: '🎁', type: undefined, url: '/votetoken' },
    { title: 'Faucet', icon: '🚰', type: undefined, url: '/faucet' },
    { type: 'separator' as const },
    { title: 'FUDerboard', icon: '📊', type: undefined, url: '/fuderboard' }
  ];

  const handleTabChange = (index: number | null) => {
    if (index !== null) {
      const selectedItem = navItems[index];
      if (selectedItem && 'url' in selectedItem && selectedItem.url) {
        router.push(selectedItem.url);
      }
    }
  };

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-[100] backdrop-blur-sm"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-[60px] relative">
          {/* Logo - Left */}
          <div className="absolute left-0">
            <Link href="/" className="flex items-center gap-3 text-white font-bold">
              <img src="/img/fologo.png" alt="Logo" className="h-auto w-32" />
            </Link>
          </div>

          {/* Navigation - Center */}
          <div className="hidden md:flex flex-1 justify-center">
            <ExpandableTabs 
              tabs={navItems}
              className="bg-black/20 border-zinc-800"
              activeColor="text-[#FFD163]"
              activePath={pathname}
              onChange={handleTabChange}
            />
          </div>

          {/* Wallet - Right */}
          <div className="absolute right-0">
            <div className="hidden md:block">
              <WalletButton />
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-white hover:bg-white/5"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="absolute top-[60px] left-0 right-0 bg-black/95 backdrop-blur-lg border-t border-white/10 p-4 space-y-4 shadow-xl md:hidden"
        >
          {navItems.filter(item => item.type !== 'separator' && item.title).map((item) => {
            if (!item.title || !item.url) return null;
            
            return (
              <div key={item.title} className="relative">
                <Link
                  href={item.url}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors",
                    pathname === item.url
                      ? 'bg-gradient-to-r from-[#C99733] to-[#FFD163] text-black font-medium'
                      : 'text-white/80 hover:text-white hover:bg-white/5'
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.title}</span>
                </Link>
              </div>
            );
          })}
          
          <div className="px-4 pt-2">
            <WalletButton className="w-full" />
          </div>
        </motion.div>
      )}

      {/* How to Play Modal */}
      <HowToPlayModal 
        isOpen={isHowToPlayOpen} 
        onClose={() => setIsHowToPlayOpen(false)} 
      />

      {/* Wallet Modal */}
      <WalletModal 
        isOpen={false} 
        onClose={() => {}} 
      />
    </motion.nav>
  );
}