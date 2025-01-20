'use client'

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { WalletButton } from '../wallet/WalletButton';
import { Coins, Menu, X, User } from 'lucide-react';
import { HyperText } from '../ui/hyper-text';
import Link from 'next/link';
import { useWallet } from '@/context/WalletContext';
import { WalletModal } from '../wallet/WalletModal';
import { HowToPlayModal } from '@/components/ui/how-to-play-modal';
import { cn } from '@/lib/utils';

export const Navbar = () => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const { isLoggedIn } = useWallet();

  const navItems = [
    { name: 'Scratch', url: '/scratch', icon: Coins }
  ];

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-40 bg-[#75CBDD]/90 backdrop-blur-lg border-b border-black/20 h-10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <WalletButton />
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-[#75CBDD] hover:bg-[#75CBDD]/80 transition-colors border-2 border-black"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6 text-black" />
            ) : (
              <Menu className="h-6 w-6 text-black" />
            )}
          </button>

          <WalletModal
            isOpen={isProfileOpen}
            onClose={() => setIsProfileOpen(false)}
          />

          <HowToPlayModal 
            isOpen={isHowToPlayOpen}
            onClose={() => setIsHowToPlayOpen(false)}
          />
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#75CBDD] border-t border-white/20"
          >
            <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.url}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-doggie ${
                    pathname === item.url
                      ? 'bg-[#75CBDD] text-black font-medium'
                      : 'text-white/80 hover:text-white hover:bg-[#75CBDD]/50'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              ))}
              
              <div className="px-4 pt-2">
                <WalletButton className="w-full" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};