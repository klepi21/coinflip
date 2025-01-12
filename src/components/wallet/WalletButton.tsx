'use client'

import { useWallet } from '@/context/WalletContext';
import { Wallet } from 'lucide-react';
import { motion } from 'framer-motion';

export const WalletButton = () => {
  const { isLoggedIn, address, openModal } = useWallet();

  if (isLoggedIn) {
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 
                   text-white rounded-lg transition-colors"
        onClick={openModal}
      >
        <div className="w-2 h-2 rounded-full bg-green-500" />
        <span className="font-mono">
          {`${address.slice(0, 6)}...${address.slice(-4)}`}
        </span>
      </motion.button>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={openModal}
      className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 
                 text-white rounded-lg transition-colors"
    >
      <Wallet className="h-5 w-5" />
      <span>Connect</span>
    </motion.button>
  );
}; 