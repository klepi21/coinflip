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
import { TokenProvider } from '@/context/TokenContext';
import { VoteBanner } from '@/components/ui/VoteBanner';
import { useState, useEffect } from 'react';
import { AshSwapWidget } from '@/components/ui/ashswapwidget';
import axios from 'axios';
import { Toaster } from 'sonner';
import Script from 'next/script';

const comic = Comic_Neue({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
});

if (typeof window !== 'undefined') {
  window.Buffer = window.Buffer || require('buffer').Buffer;
}

// Add Token type
interface Token {
  identifier: string;
  name: string;
  ticker: string;
  decimals: number;
  balance?: string;
  icon?: string;
}

// Add MxToken type
interface MxToken {
  identifier: string;
  name: string;
  ticker: string;
  decimals: number;
  price: number;
  assets?: {
    website?: string;
    description?: string;
    status?: string;
    pngUrl?: string;
    svgUrl?: string;
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSwapOpen, setIsSwapOpen] = useState(false);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(true);

  // Fetch tokens once when layout loads
  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const response = await axios.get<MxToken[]>('https://api.multiversx.com/tokens?size=500');
        
        const validTokens = response.data
          .filter(token => 
            token.assets && 
            token.ticker !== 'WEGLD-bd4d79' && 
            token.decimals !== undefined
          )
          .map(token => ({
            identifier: token.identifier,
            name: token.name,
            ticker: token.ticker,
            decimals: token.decimals,
            icon: token.assets?.svgUrl || token.assets?.pngUrl || `https://media.elrond.com/tokens/asset/${token.identifier}/logo.svg`
          }));

        setTokens(validTokens);
      } catch (error) {
        console.error('Failed to fetch tokens:', error);
      } finally {
        setIsLoadingTokens(false);
      }
    };

    fetchTokens();
  }, []);

  return (
    <html lang="en" className={comic.className} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="F.0. - Fud Out, a blockchain-based PvP coin flip fighting game" />
        <title>F.O. - Fud Out, a blockchain-based PvP coin flip fighting game</title>
        <meta name="description" content="Experience the thrill of PvP combat with F.0. - Fud Out, a blockchain-based coin flip fighting game. Compete against other players and claim your rewards." />
        <meta property="og:title" content="F.0. - Fud Out, a blockchain-based PvP coin flip fighting game" />
        <meta property="og:description" content="Compete in PvP coin flip battles with F.0. - Fud Out, a blockchain-based fighting game" />
        <meta property="og:image" content="https://fudout.vercel.app/img/fudout.png?v=2" />
        <meta property="og:image:secure_url" content="https://fudout.vercel.app/img/fudout.png?v=2" />
        <meta property="og:image:alt" content="F.0. - Fud Out Game Logo" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content="https://fudout.vercel.app" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="F.0. - Fud Out" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@fudout" />
        <meta name="twitter:title" content="F.0. - Fud Out, a blockchain-based PvP coin flip fighting game" />
        <meta name="twitter:description" content="Compete in PvP coin flip battles with F.0. - Fud Out, a blockchain-based fighting game" />
        <meta name="twitter:image" content="https://fudout.vercel.app/img/fudout.png?v=2" />
        <meta name="twitter:image:alt" content="F.0. - Fud Out Game Logo" />
        <meta name="twitter:url" content="https://fudout.vercel.app" />
        <link rel="canonical" href="https://fudout.vercel.app" />
        <style>
          {`
            * {
              zoom: 99.5%;
            }
          `}
        </style>
        <Script id="dynamic-favicon">
          {`
            function updateFavicon() {
              const favicons = [
                '/img/grm2.png',
                '/img/option2.png',
                '/img/option4.png'
              ];
              const randomIndex = Math.floor(Math.random() * favicons.length);
              const link = document.querySelector("link[rel~='icon']");
              if (!link) {
                const newLink = document.createElement('link');
                newLink.rel = 'icon';
                document.head.appendChild(newLink);
              }
              document.querySelector("link[rel~='icon']").href = favicons[randomIndex];
            }
            // Update favicon every 3 seconds
            setInterval(updateFavicon, 20000);
            // Initial update
            updateFavicon();
          `}
        </Script>
      </head>
      <body className="bg-black">
        <ThemeProvider attribute="class" defaultTheme="light">
          <DappProvider
            environment="mainnet"
            dappConfig={{
              shouldUseWebViewProvider: true,
            }}
            customNetworkConfig={{
              name: 'customConfig',
              walletConnectV2ProjectId: mvxConfig.walletConnectV2ProjectId
            }}
          >
            <WalletProvider>
              <TokenProvider>
                <div className="relative min-h-screen">
                  {/* Optional pattern overlay */}
                  <div className="fixed inset-0 bg-black pointer-events-none" />
                  {/* Content */}
                  <div className="relative z-10">
                    <Navbar />
                    <VoteBanner />
                    <main className="pt-0">
                      {children}
                    </main>
                    <WalletModal 
                      isOpen={false}
                      onClose={() => {}}
                    />
                    <SignTransactionsModals />
                  </div>

                  {/* Swap Button */}
                  <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex items-center mr-4">
                    <button
                      onClick={() => setIsSwapOpen(!isSwapOpen)}
                      style={{ transformOrigin: 'right center' }}
                      className={`
                        bg-[#1a1a1a] text-[#FFB930] px-6 py-1 md:py-3
                        border border-[#FFB930]/20 
                        rounded-xl font-semibold text-lg
                        transform -rotate-90
                        hover:bg-[#2a2a2a] transition-all duration-300
                        shadow-lg hover:shadow-[#FFB930]/10
                        whitespace-nowrap
                        max-md:opacity-80
                      `}
                    >
                      Swap Tokens
                    </button>
                  </div>

                  {/* Right Side Panel */}
                  <div 
                    className={`
                      fixed right-0 top-1/2 -translate-y-1/2 z-50
                      transform transition-transform duration-300 ease-in-out
                      ${isSwapOpen ? 'translate-x-0' : 'translate-x-full'}
                    `}
                  >
                    <div className="relative w-[400px] shadow-xl">
                      {/* Close button - only show when panel is open */}
                      {isSwapOpen && (
                        <button
                          onClick={() => setIsSwapOpen(false)}
                          className="absolute -left-10 top-4 text-[#FFB930] hover:text-[#FFB930]/80 z-50"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      )}
                      <AshSwapWidget availableTokens={tokens} isLoadingTokens={isLoadingTokens} />
                    </div>
                  </div>

                  {/* Semi-transparent backdrop */}
                  {isSwapOpen && (
                    <div 
                      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
                      onClick={() => setIsSwapOpen(false)}
                    />
                  )}
                </div>
              </TokenProvider>
            </WalletProvider>
          </DappProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}