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
import { AnimatedText } from "@/components/ui/animated-underline-text-one";
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { RetroGrid } from '@/components/ui/retro-grid';
import { ParticleButton } from '@/components/ui/particle-button';
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { FudGauge } from '@/components/ui/fud-gauge';

// Constants
const SC_ADDRESS = 'erd1qqqqqqqqqqqqqpgqwpmgzezwm5ffvhnfgxn5uudza5mp7x6jfhwsh28nqx';

const CreateDynamic = dynamic(() => import('@/components/ui/create'), { ssr: false });
const GameGridDynamic = dynamic(() => import('@/components/ui/GameGrid'), { ssr: false });

export default function Home() {
  const [totalGamesPlayed, setTotalGamesPlayed] = useState<number>(0);
  const [activeGames, setActiveGames] = useState<number>(0);
  const { network } = useGetNetworkConfig();
  const [showTooltip, setShowTooltip] = useState(false);
  const [isButtonClicked, setIsButtonClicked] = useState(false);

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
    <main className="relative flex flex-col bg-black min-h-[100vh] px-6 pt-20">
      <RetroGrid />
      <div className="w-full md:container mx-auto flex-1 mb-auto relative z-10">
        {/* Title Section */}
        <div className="flex flex-col items-center py-4 md:py-12 mb-16">
          <div className="flex items-center gap-6 justify-center">
            <p className="text-xl md:text-4xl font-bold text-white text-center">
              Squash Beefs, One Smush at a Time!
            </p>
            
            {/* FUD OUT Button */}
            <div className="relative flex items-center">
              <ParticleButton
                className={cn(
                  "bg-gradient-to-r from-[#C99733] to-[#FFD163] text-black font-bold py-3 px-8 text-lg rounded-xl shadow-lg",
                  isButtonClicked ? 
                    "scale-95 opacity-90 shadow-[inset_0_4px_10px_rgba(0,0,0,0.3)]" : 
                    "hover:opacity-90 hover:shadow-[0_0_20px_rgba(201,151,51,0.3)]"
                )}
                successDuration={6000}
                onClick={() => {
                  setIsButtonClicked(true);
                  setShowTooltip(true);
                  setTimeout(() => {
                    setIsButtonClicked(false);
                    setShowTooltip(false);
                  }, 6000);
                }}
              >
                FUD OUT!
              </ParticleButton>
              
              <AnimatePresence>
                {showTooltip && (
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="absolute left-full ml-4 p-4 bg-black/90 border border-[#FFD163]/20 rounded-xl text-white text-sm max-w-[300px] text-center backdrop-blur-sm shadow-xl"
                  >
                    We are sorry for the inconvenience. The FUD only gets out from here and not back in.
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Main Content - Split Screen */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Half - Create Game */}
          <div className="w-full md:w-1/3">
            <CreateDynamic />
            
            {/* FUD to FOMO Gauge - Only visible on desktop */}
            <div className="hidden md:block mt-6 p-6 bg-[#1A1A1A] backdrop-blur-sm rounded-xl border border-zinc-800 shadow-xl">
              <div className="flex flex-col items-center">
                <h3 className="text-lg font-bold text-white mb-2">MultiversX FUD/FOMO Index</h3>
                <p className="text-sm text-zinc-400 mb-6">Sentiment Analysis: Market Metrics & Social Signals</p>
                <FudGauge value={38} size={280} />
              </div>
            </div>
          </div>

          {/* Right Half - Game Grid and Mobile FUD Gauge */}
          <div className="w-full md:w-2/3" style={{ marginTop: '-86px' }}>
            <GameGridDynamic onActiveGamesChange={setActiveGames} />
            
            {/* FUD to FOMO Gauge - Only visible on mobile */}
            <div className="block md:hidden mt-8 p-6 bg-[#1A1A1A] backdrop-blur-sm rounded-xl border border-zinc-800 shadow-xl">
              <div className="flex flex-col items-center">
                <h3 className="text-lg font-bold text-white mb-2">MultiversX FUD/FOMO Index</h3>
                <p className="text-sm text-zinc-400 mb-6">Sentiment Analysis: Market Metrics & Social Signals</p>
                <FudGauge value={38} size={280} />
              </div>
            </div>
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