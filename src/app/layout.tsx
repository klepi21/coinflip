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
import { Comic_Neue } from 'next/font/google';
import { Footer } from '@/components/layout/Footer';

const comic = Comic_Neue({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
});

if (typeof window !== 'undefined') {
  window.Buffer = window.Buffer || require('buffer').Buffer;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={comic.className} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="F.0. - Fud Out, a blockchain-based PvP coin flip fighting game" />
        <title>F.0. - Fud Out, a blockchain-based PvP coin flip fighting game</title>
        <meta name="description" content="Experience the thrill of PvP combat with F.0. - Fud Out, a blockchain-based coin flip fighting game. Compete against other players and claim your rewards." />
        <meta property="og:title" content="F.0. - Fud Out, a blockchain-based PvP coin flip fighting game" />
        <meta property="og:description" content="Compete in PvP coin flip battles with F.0. - Fud Out, a blockchain-based fighting game" />
        <meta property="og:image" content="https://fudout.vercel.app/img/fudout.png" />
        <meta property="og:image:alt" content="F.0. - Fud Out Game Logo" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content="https://fudout.vercel.app/fight" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="F.0. - Fud Out, a blockchain-based PvP coin flip fighting game" />
        <meta name="twitter:description" content="Compete in PvP coin flip battles with F.0. - Fud Out, a blockchain-based fighting game" />
        <meta name="twitter:image" content="https://fudout.vercel.app/img/fudout.png" />
        <meta name="twitter:image:alt" content="F.0. - Fud Out Game Logo" />
        <meta name="twitter:url" content="https://fudout.vercel.app/fight" />
        <style>
          {`
            * {
              zoom: 99.5%;
            }
          `}
        </style>
      </head>
      <body className="bg-black">
        <ThemeProvider attribute="class" defaultTheme="light">
          <DappProvider
            environment="mainnet"
            customNetworkConfig={{
              name: 'customConfig',
              apiTimeout: 6000,
              walletConnectV2ProjectId: mvxConfig.walletConnectV2ProjectId
            }}
          >
            <WalletProvider>
              <div className="min-h-screen relative">
                {/* Optional pattern overlay */}
                <div className="fixed inset-0 bg-white/5 pattern-grid-white/5 pointer-events-none" />
                {/* Content */}
                <div className="relative z-10">
                  <Navbar />
                  <main>
                    {children}
                  </main>
                  <WalletModal 
                    isOpen={false}
                    onClose={() => {}}
                  />
                  <SignTransactionsModals />
                </div>
              </div>
            </WalletProvider>
          </DappProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}