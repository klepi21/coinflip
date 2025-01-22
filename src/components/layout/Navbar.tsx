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
    { name: 'Fight', url: '/fight', icon: Coins }
  ];

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-[#C99733] to-[#FFD163] backdrop-blur-lg border-b border-black/20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[60px]">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 text-black font-bold">
              <img src="https://tools.multiversx.com/assets-cdn/tokens/MINCU-38e93d/icon.svg" alt="MINCU Logo" className="w-8 h-8" />
              $MINCUFIGHT
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => setIsHowToPlayOpen(true)}
              className="text-black font-medium hover:underline"
            >
              How to Play
            </button>
            <a 
              href="https://xexchange.com/trade?firstToken=EGLD&secondToken=MINCU-38e93d"
              target="_blank"
              rel="noopener noreferrer"
              className="text-black font-medium hover:underline"
            >
              Buy MINCU
            </a>
            <WalletButton />
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-black/20 hover:bg-black/30 transition-colors"
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
            className="md:hidden bg-gradient-to-r from-[#C99733] to-[#FFD163] border-t border-black/20 shadow-lg"
          >
            <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
              {/* How to Play Link for Mobile */}
              <button
                onClick={() => {
                  setIsHowToPlayOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-black/10 hover:bg-black/20 transition-colors text-black font-medium w-full"
              >
                <User className="h-5 w-5" />
                <span>How to Play</span>
              </button>

              {/* Buy Link for Mobile */}
              <a
                href="https://xexchange.com/trade?firstToken=EGLD&secondToken=MINCU-38e93d"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-black/10 hover:bg-black/20 transition-colors text-black font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Coins className="h-5 w-5" />
                <span>Buy $MINCU</span>
              </a>

              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.url}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    pathname === item.url
                      ? 'bg-black/10 text-black font-medium'
                      : 'text-black/80 hover:text-black hover:bg-black/5'
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