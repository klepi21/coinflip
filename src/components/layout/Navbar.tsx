'use client'

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { WalletButton } from '@/components/wallet/WalletButton';
import { Coins, Menu, X, Vote } from 'lucide-react';
import { HyperText } from '../ui/hyper-text';
import Link from 'next/link';
import { useWallet } from '@/context/WalletContext';
import { WalletModal } from '../wallet/WalletModal';
import { HowToPlayModal } from '@/components/ui/how-to-play-modal';
import { cn } from '@/lib/utils';
import { NavBar as TubelightNavbar } from '@/components/ui/tubelight-navbar';
import Image from 'next/image';
import { TubelightNav } from '@/components/ui/tubelight-navbar';

export function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const { isLoggedIn } = useWallet();

  const navItems = [
    { name: 'Fight', url: '/', icon: Coins },
    { name: 'Vote Fighter', url: '/vote', icon: Vote },
    { name: 'Vote Token', url: '/votetoken', icon: Vote },
    { 
      name: 'Stats', 
      url: '/stats', 
      icon: Vote, 
      disabled: true,
      badge: 'SOON'
    }
  ];

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-[100] backdrop-blur-sm"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[60px]">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 text-white font-bold">
              <img src="/img/fologo.png" alt="Logo" className="h-auto w-32" />
            </Link>
            <div className="hidden md:block">
              <TubelightNav />
            </div>
          </div>

          <div className="hidden md:flex-1 md:flex md:justify-end md:items-center">
            <WalletButton />
          </div>

          {/* Mobile Menu Button */}
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

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="absolute top-[60px] left-0 right-0 bg-black/95 backdrop-blur-lg border-t border-white/10 p-4 space-y-4 shadow-xl md:hidden"
        >
          {navItems.map((item) => (
            <div key={item.name} className="relative">
              <Link
                href={item.url}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors",
                  pathname === item.url
                    ? 'bg-white/10 text-white font-medium'
                    : 'text-white/80 hover:text-white hover:bg-white/5',
                  item.disabled && "cursor-not-allowed text-zinc-500 pointer-events-none"
                )}
                onClick={(e) => {
                  if (item.disabled) {
                    e.preventDefault();
                    return;
                  }
                  setIsMobileMenuOpen(false);
                }}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.name}</span>
                {item.badge && (
                  <div className="absolute -top-1 -right-2">
                    <div className="bg-[#C99733] text-black text-[10px] px-1 rounded-full">
                      {item.badge}
                    </div>
                  </div>
                )}
              </Link>
            </div>
          ))}
          
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