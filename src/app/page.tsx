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
          <div className="flex flex-col items-center w-full">
            <p className="text-xl md:text-4xl font-bold text-white text-center">
              Squash Beefs, One Smush at a Time!
            </p>
            
            {/* FUD OUT Button */}
            <div className="relative mt-8 flex flex-col items-center">
              <ParticleButton
                className={cn(
                  "bg-gradient-to-r from-[#C99733] to-[#FFD163] text-black font-bold py-3 px-8 text-lg rounded-xl",
                  isButtonClicked ? "scale-95 opacity-90" : "hover:opacity-90"
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
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full mt-4 p-4 bg-black/90 border border-[#FFD163]/20 rounded-xl text-white text-sm max-w-[300px] text-center backdrop-blur-sm shadow-xl"
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
          </div>

          {/* Right Half - Game Grid */}
          <div className="w-full md:w-2/3" style={{ marginTop: '-86px' }}>
            <GameGridDynamic onActiveGamesChange={setActiveGames} />
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