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
      className="fixed top-0 left-0 right-0 z-40 bg-[#FD8700]/90 backdrop-blur-lg border-b border-black/20 h-18"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <Link href="/" className="flex items-center gap-3">
            <img src="https://bod.gg/assets/bod-solo2-CEyg0yC7.svg" alt="BOD" className="h-16 w-14 mt-4 mr--6" />
            <HyperText
              text="BOD jackpot"
              className="text-base sm:text-lg md:text-2xl font-bold text-black font-doggie "
              duration={1000}
              animateOnLoad={false}
            />
          </Link>
          
        

          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-4">
              <a 
                href="https://x.com/batesondog" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-black hover:text-black/70 transition-colors"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>

              <a 
                href="https://tg.bod.gg" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-black hover:text-black/70 transition-colors"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                </svg>
              </a>
            </div>

            <button
              onClick={() => setIsHowToPlayOpen(true)}
              className="text-black hover:text-black/70 transition-colors font-doggie text-xl"
            >
              how to play?
            </button>

            <a 
              href="https://xexchange.com/trade?firstToken=EGLD&secondToken=BOD-204877"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2 rounded-full bg-[#FFA036] hover:bg-[#FFA036]/80 
                        transition-colors text-black font-doggie text-xl font-bold 
                        border-2 border-black"
            >
              buy BOD
            </a>

            <WalletButton />
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-[#FFA036] hover:bg-[#FFA036]/80 transition-colors border-2 border-black"
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
            className="md:hidden bg-[#FFA036] border-t border-white/20"
          >
            <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.url}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-doggie ${
                    pathname === item.url
                      ? 'bg-[#FD8700] text-black font-medium'
                      : 'text-white/80 hover:text-white hover:bg-[#FD8700]/50'
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