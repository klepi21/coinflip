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

// Constants
const SC_ADDRESS = 'erd1qqqqqqqqqqqqqpgqwpmgzezwm5ffvhnfgxn5uudza5mp7x6jfhwsh28nqx';

const CreateDynamic = dynamic(() => import('@/components/ui/create'), { ssr: false });
const GameGridDynamic = dynamic(() => import('@/components/ui/GameGrid'), { ssr: false });

export default function Fight() {
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
        console.log('Total games fetched:', totalGames);
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
    <main className="relative flex flex-col bg-black min-h-[100vh] px-6 pt-24">
      <RetroGrid />
      <div className="w-full max-w-7xl mx-auto flex-1 mb-auto relative z-10">
        {/* Title Section */}
        <div className="flex flex-col items-center mb-12">
          <div className="flex flex-col items-center w-full">
            <p className="text-lg md:text-2xl font-semibold text-white mt-4 text-center">
              Settle the Fight, One Battle at a Time!
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
      <div className="relative z-20 bg-transparent text-center text-white/80 mt-auto">
        <p className="max-w-2xl mx-auto mb-2">Engage in a provably fair, peer-to-peer gaming experience. Please ensure you are at least 18 years old and comply with your local regulations.</p>
      </div>
    </main>
  );
}