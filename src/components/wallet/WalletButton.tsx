'use client'

import { useWallet } from '@/context/WalletContext';
import { useState } from 'react';
import { WalletConnectModal } from './WalletConnectModal';

export const WalletButton = ({ className = '' }: { className?: string }) => {
  const { isLoggedIn, address, openModal } = useWallet();
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  if (isLoggedIn) {
    return (
      <button
        onClick={openModal}
        className={`px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl 
                   text-white font-medium transition-colors ${className}`}
      >
        {address?.slice(0, 6)}...{address?.slice(-4)}
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsConnectModalOpen(true)}
        className={`px-4 py-2 bg-transparent border border-white/20 hover:border-white/40 
                   rounded-xl text-white font-medium transition-all duration-200 
                   hover:bg-white/5 ${className}`}
      >
        Connect Wallet
      </button>

      <WalletConnectModal 
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
      />
    </>
  );
}; 