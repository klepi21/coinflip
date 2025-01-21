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

// Constants
const SC_ADDRESS = 'erd1qqqqqqqqqqqqqpgqwpmgzezwm5ffvhnfgxn5uudza5mp7x6jfhwsh28nqx';

const calculateTimeLeft = () => {
  const difference = +new Date('2025-02-01') - +new Date();
  let timeLeft = { hours: '00', minutes: '00', seconds: '00' };

  if (difference > 0) {
    timeLeft = {
      hours: Math.floor((difference / (1000 * 60 * 60))).toString().padStart(2, '0'),
      minutes: Math.floor((difference / 1000 / 60) % 60).toString().padStart(2, '0'),
      seconds: Math.floor((difference / 1000) % 60).toString().padStart(2, '0'),
    };
  }

  return timeLeft;
};

function CountdownBadge() {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-gradient-to-r from-[#C99733] to-[#FFD163] text-black text-xs font-medium px-3 py-1 rounded-full animate-pulse">
      Next $MINCU opponent in {timeLeft.hours}:{timeLeft.minutes}:{timeLeft.seconds}
    </div>
  );
}

const CreateDynamic = dynamic(() => import('@/components/ui/create'), { ssr: false });
const GameGridDynamic = dynamic(() => import('@/components/ui/GameGrid'), { ssr: false });

export default function Hot() {
  const [totalGamesPlayed, setTotalGamesPlayed] = useState<number>(0);
  const [activeGames, setActiveGames] = useState<number>(0);
  const { network } = useGetNetworkConfig();

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
      }
    } catch (error) {
      // console.error('Error fetching total games:', error);
    }
  };

  useEffect(() => {
    fetchTotalGames();
    // Refresh total games count every minute
    const interval = setInterval(fetchTotalGames, 60000);
    return () => clearInterval(interval);
  }, [network.apiAddress]);

  return (
    <main className="flex flex-col bg-black min-h-screen px-6 pt-24 pb-12">
      <div className="w-full max-w-7xl mx-auto flex-1">
        {/* Title Section */}
        <div className="flex flex-col items-center mb-12">
          <div className="flex flex-col items-center w-full">
            <div className="relative w-full md:w-[600px]">
              <AnimatedText 
                text="$MINCU FIGHT"
                textClassName="text-3xl md:text-6xl font-bold text-white tracking-wider"
                underlineClassName="text-gradient-gold"
                underlinePath="M 0,10 Q 150,0 300,10 Q 450,20 600,10"
                underlineHoverPath="M 0,10 Q 150,20 300,10 Q 450,0 600,10"
                className="w-full"
              />
              <div className="absolute right-1 top-1 -translate-y-1/2 ml-8">
                <CountdownBadge />
              </div>
            </div>
            <p className="text-lg md:text-2xl font-semibold text-white mt-4 text-center">
              Fight between $MINCU and Lower Expectations | P2P Game
            </p>
          </div>
        </div>

        {/* Main Content - Split Screen */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Half - Create Game */}
          <div className="w-full md:w-1/3">
            <CreateDynamic />
          </div>

          {/* Right Half - Game Grid */}
          <div className="w-full md:w-2/3">
            <GameGridDynamic onActiveGamesChange={setActiveGames} />
          </div>
        </div>
      </div>
      {/* Footer Section */}
      <div className="relative z-20 bg-black text-center text-white/60 mt-8 py-6 px-4">
        <p className="max-w-2xl mx-auto mb-2">Engage in a provably fair, peer-to-peer gaming experience. Please ensure you are at least 18 years old and comply with your local regulations.</p>
        <p>The Dapp is not affiliated with the $MINCU token.</p>
      </div>
    </main>
  );
}