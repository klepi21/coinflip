'use client'

import { createContext, useContext, ReactNode, useState, useCallback, useEffect } from 'react';
import { useGetLoginInfo, useGetAccountInfo } from '@multiversx/sdk-dapp/hooks';
import { logout } from '@multiversx/sdk-dapp/utils';
import { useRouter } from 'next/navigation';

interface WalletContextType {
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  handleLogout: () => void;
  isLoggedIn: boolean;
  address: string | null;
  isLoading: boolean;
}

const WalletContext = createContext<WalletContextType>({
  isModalOpen: false,
  openModal: () => {},
  closeModal: () => {},
  handleLogout: () => {},
  isLoggedIn: false,
  address: null,
  isLoading: false,
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useGetLoginInfo();
  const { address } = useGetAccountInfo();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  const handleLogout = useCallback(() => {
    logout();
    closeModal();
    router.replace('/hot');
  }, [closeModal, router]);

  useEffect(() => {
    // Redirect to /hot after login
    if (isLoggedIn) {
      router.replace('/hot');
    }
  }, [isLoggedIn, router]);

  return (
    <WalletContext.Provider 
      value={{ 
        isModalOpen, 
        openModal, 
        closeModal, 
        handleLogout,
        isLoggedIn,
        address: address || null,
        isLoading: false
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
}; 