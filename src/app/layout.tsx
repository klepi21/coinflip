'use client'

import { DappProvider } from '@multiversx/sdk-dapp/wrappers';
import { SignTransactionsModals } from '@multiversx/sdk-dapp/UI/SignTransactionsModals';
import { mvxConfig } from '@/config/config';
import { Navbar } from '@/components/layout/Navbar';
import { WalletProvider } from '@/context/WalletContext';
import { WalletModal } from '@/components/wallet/WalletModal';
import './globals.css'
import { ThemeProvider } from 'next-themes'
import Head from 'next/head'

if (typeof window !== 'undefined') {
  window.Buffer = window.Buffer || require('buffer').Buffer;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Liquid Staking Funds on MultiversX" />
        <title>Cryptomurmura2.0 - LSF</title>
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark">
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
              <WalletModal 
                isOpen={false}
                onClose={() => {}}
              />
              <SignTransactionsModals />
            </WalletProvider>
          </DappProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}