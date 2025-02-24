'use client';

import { useState, useEffect } from 'react';
import { ProxyNetworkProvider } from "@multiversx/sdk-network-providers";
import { 
  AbiRegistry, 
  SmartContract, 
  Address,
  ResultsParser,
  ContractFunction
} from "@multiversx/sdk-core";
import { useGetNetworkConfig } from "@multiversx/sdk-dapp/hooks";
import flipcoinAbi from '@/config/flipcoin.abi.json';
import Create from '@/components/ui/create';
import GameGrid from '@/components/ui/GameGrid';
import BoberGrid from '@/components/ui/BoberGrid';
import { AnimatedText } from "@/components/ui/animated-underline-text-one";
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { RetroGrid } from '@/components/ui/retro-grid';
import { ParticleButton } from '@/components/ui/particle-button';
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { FudGauge } from '@/components/ui/fud-gauge';
import { VoteBanner } from '@/components/ui/VoteBanner';
import { WofAnnouncement } from '@/components/ui/WofAnnouncement';
import { ToggleLeft, ToggleRight } from 'lucide-react';

// Constants
const SC_ADDRESS = 'erd1qqqqqqqqqqqqqpgqwpmgzezwm5ffvhnfgxn5uudza5mp7x6jfhwsh28nqx';

const CreateDynamic = dynamic(() => import('@/components/ui/create'), { ssr: false });
const GameGridDynamic = dynamic(() => import('@/components/ui/GameGrid'), { ssr: false });
const BoberGridDynamic = dynamic(() => import('@/components/ui/BoberGrid'), { 
  ssr: false,
  loading: () => (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={`placeholder-${index}`} className="relative pb-8">
          <div className="bg-[#1A1A1A] rounded-2xl overflow-hidden shadow-lg animate-pulse">
            <div className="flex relative min-h-[160px] sm:min-h-[200px] bg-[#007E76]">
              <div className="flex-1 p-4 flex flex-col items-center justify-center bg-black/30">
                <div className="w-16 h-16 rounded-full bg-zinc-800 mb-2"></div>
                <div className="h-4 w-20 bg-zinc-800 rounded mb-2"></div>
                <div className="h-4 w-16 bg-zinc-800 rounded"></div>
              </div>
              <div className="flex-1 p-4 flex flex-col items-center justify-center bg-black/30">
                <div className="w-16 h-16 rounded-full bg-zinc-800 mb-2"></div>
                <div className="h-4 w-20 bg-zinc-800 rounded mb-2"></div>
                <div className="h-4 w-16 bg-zinc-800 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
});

export default function Home() {
  const [totalGamesPlayed, setTotalGamesPlayed] = useState<number>(0);
  const [activeGames, setActiveGames] = useState<number>(0);
  const { network } = useGetNetworkConfig();
  const [showTooltip, setShowTooltip] = useState(false);
  const [isButtonClicked, setIsButtonClicked] = useState(false);
  const [showBoberGames, setShowBoberGames] = useState(false);

  const fetchTotalGames = async () => {
    try {
      const provider = new ProxyNetworkProvider(network.apiAddress);
      const contract = new SmartContract({
        address: new Address(SC_ADDRESS),
        abi: AbiRegistry.create(flipcoinAbi)
      });

      const query = contract.createQuery({
        func: new ContractFunction('getId'),
      });

      const queryResponse = await provider.queryContract(query);
      
      if (queryResponse?.returnData?.[0]) {
        const endpointDefinition = contract.getEndpoint('getId');
        const resultParser = new ResultsParser();
        const results = resultParser.parseQueryResponse(queryResponse, endpointDefinition);
        const totalGames = Number(results.values[0].valueOf().toString());
        setTotalGamesPlayed(totalGames);
      } else {
        console.log('No return data from getId');
      }
    } catch (error) {
      console.error('Error fetching total games:', error);
    }
  };

  useEffect(() => {
    fetchTotalGames();
  }, [network.apiAddress]);

  return (
    <main className="relative flex flex-col bg-black min-h-[100vh] px-6">
      <RetroGrid />
      
      <div className="w-full md:container mx-auto flex-1 mb-auto relative z-10">
        {/* Title Section */}
        <div className="flex flex-col items-center py-4 md:py-12">
          <WofAnnouncement />
          
          {/* Toggle Switch - Moved inside title section */}
          <div className="w-full flex justify-end mb-6">
            <button
              onClick={() => setShowBoberGames(!showBoberGames)}
              className={cn(
                "relative transition-all duration-300",
                "flex items-center gap-2 md:gap-3",
                "px-3 md:px-8 py-1.5 md:py-2 rounded-full",
                showBoberGames 
                  ? "bg-gradient-to-r from-[#C99733] to-[#FFD163] text-black"
                  : "bg-zinc-800 text-white"
              )}
            >
              <span className="text-xs md:text-sm font-medium whitespace-nowrap">
                {showBoberGames ? 'FUDOUT Fights' : 'Show Bober'}
              </span>
              {showBoberGames ? (
                <ToggleRight className="w-4 h-4 md:w-5 md:h-5" />
              ) : (
                <ToggleLeft className="w-4 h-4 md:w-5 md:h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Main Content - Split Screen */}
        <div className="flex flex-col md:flex-row gap-8 mt-4">
          {/* Left Half - Create Game */}
          <div className="w-full md:w-1/3">
            <CreateDynamic />
            
            {/* FUD to FOMO Gauge - Only visible on desktop */}
            <div className="hidden md:block mt-6 p-6 bg-[#1A1A1A] backdrop-blur-sm rounded-xl border border-zinc-800 shadow-xl">
              <div className="flex flex-col items-center">
                <h3 className="text-lg font-bold text-white mb-2">MultiversX FUD/FOMO Index</h3>
                <p className="text-sm text-zinc-400 mb-6">Sentiment Analysis: Market Metrics & Social Signals</p>
                <FudGauge value={40} size={280} />
              </div>
            </div>
          </div>

          {/* Right Half - Game Grid and Mobile FUD Gauge */}
          <div className="w-full md:w-2/3" style={{ marginTop: '-86px' }}>
            <AnimatePresence mode="wait">
              {showBoberGames ? (
                <motion.div
                  key="bober"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <BoberGridDynamic onActiveGamesChange={setActiveGames} />
                </motion.div>
              ) : (
                <motion.div
                  key="regular"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <GameGridDynamic onActiveGamesChange={setActiveGames} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      {/* Footer Section */}
      <div className="relative z-20 bg-transparent text-center mt-auto">
        <div className="flex justify-center mb-4">
          <img src="/img/SRBLABS.png" alt="SRBLABS Logo" className="w-20 h-auto mr-4" />
        </div>
        <p className="max-w-full mx-auto mb-2 text-xs text-white/80">Peer-to-peer gaming for true degens—provably fair, unapologetically risky, and absolutely addictive. Just don't forget: 18+ and don't get rugged by your local laws.</p>
      </div>
    </main>
  );
}