'use client'

import { DappProvider } from '@multiversx/sdk-dapp/wrappers';
import { SignTransactionsModals } from '@multiversx/sdk-dapp/UI/SignTransactionsModals';
import { mvxConfig } from '@/config/config';
import { Navbar } from '@/components/layout/Navbar';
import { WalletProvider } from '@/context/WalletContext';
import { WalletModal } from '@/components/wallet/WalletModal';
import './globals.css'

if (typeof window !== 'undefined') {
  window.Buffer = window.Buffer || require('buffer').Buffer;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0A0A0A] text-white">
        <DappProvider
          environment="devnet"
          customNetworkConfig={{
            name: 'customConfig',
            apiTimeout: 6000,
            walletConnectV2ProjectId: mvxConfig.walletConnectV2ProjectId
          }}
        >
          <WalletProvider>
            <Navbar />
            <main>
              {children}
            </main>
            <WalletModal />
            <SignTransactionsModals />
          </WalletProvider>
        </DappProvider>
      </body>
    </html>
  );
}