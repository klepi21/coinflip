'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ContractFunction, TypedValue, ResultsParser, OptionValue, U32Value, AddressValue, U64Value, BytesValue } from '@multiversx/sdk-core';
import { getContract, getNetworkProvider } from '@/utils/contract';
import scratchAbi from '@/config/scratch-game.abi.json';

interface Game {
  uniqueId: string;
  id: number;
  player: string;
  amount_played: string;
  amount_won: string | null;
  timestamp: number;
}

const SC_ADDRESS = 'erd1qqqqqqqqqqqqqpgq8dcdymtj8a3wu92z6w25gjw72swnte2zu7zs6cvd7y';

const queryContract = async (
  functionName: string,
  args: TypedValue[] = [],
  returnTypes: any[],
  customAbi?: any,
  customAddress?: string
) => {
  try {
    const contract = customAbi 
      ? getContract(customAddress || SC_ADDRESS)
      : getContract(SC_ADDRESS);
    
    const proxy = getNetworkProvider();

    const query = contract.createQuery({
      func: new ContractFunction(functionName),
      args
    });

    const queryResponse = await proxy.queryContract(query);
    
    if (!queryResponse || !queryResponse.returnData) {
      throw new Error('No response received from the contract');
    }

    return queryResponse;
  } catch (error: any) {
    throw new Error(
      `Failed to query contract endpoint '${functionName}': ${error.message || 'Unknown error'}`
    );
  }
};

export const GameNotifications = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [visibleGames, setVisibleGames] = useState<Game[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const fetchGames = async () => {
    try {
      const contract = getContract(SC_ADDRESS);
      const proxy = getNetworkProvider();

      const query = contract.createQuery({
        func: new ContractFunction('getGames'),
        args: [
          // opt_player: none - 64 zeros for empty address
          BytesValue.fromHex('0000000000000000000000000000000000000000000000000000000000000000'),
          // opt_max_results: some(15) - hex value 0f
          BytesValue.fromHex('0f')
        ]
      });

      const queryResponse = await proxy.queryContract(query);
      //console.log('Raw query response:', queryResponse);

      if (queryResponse?.returnData) {
        const endpointDefinition = contract.getEndpoint('getGames');
        const resultParser = new ResultsParser();
        const results = resultParser.parseQueryResponse(queryResponse, endpointDefinition);
        //console.log('Parsed results:', results);

        // The results are in a VariadicValue which contains an array of Game structs
        const gamesArray = (results as any).firstValue?.items;
        if (gamesArray && Array.isArray(gamesArray)) {
          const processedGames = gamesArray.map((game: any) => {
            const gameFields = game.fields;
            
            // Get the raw values with proper nesting
            const id = gameFields[0].value.value;
            const player = gameFields[1].value.value;
            console.log('Player:', player);
            const amountPlayed = gameFields[2].value.value;
            const amountWon = gameFields[3].value.value?.value; // Option<BigUint>
            const timestamp = gameFields[4].value.value;

            return {
              uniqueId: `${id}-${timestamp}`,
              id: id,
              player: player.toString(), // Ensure it's a string
              amount_played: amountPlayed,
              amount_won: amountWon || null,
              timestamp: Number(timestamp)
            };
          });

          //console.log('Processed games:', processedGames);
          setGames(processedGames);
          setVisibleGames(processedGames.slice(0, 4));
        }
      }
    } catch (error) {
      console.error('Error fetching games:', error);
    }
  };

  useEffect(() => {
    fetchGames();
    // Fetch games every 30 seconds to keep data fresh
    const interval = setInterval(fetchGames, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (games.length === 0) return;

    // Rotate notifications every 4 seconds
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % games.length;
        const endIndex = Math.min(nextIndex + 4, games.length);
        setVisibleGames(games.slice(nextIndex, endIndex));
        return nextIndex;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [games]);

  const formatAddress = (address: string) => {
    if (!address || typeof address !== 'string') return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() / 1000) - timestamp);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="fixed bottom-28 pb-10 left-0 right-0 overflow-hidden z-50 hidden md:block">
      <div className="relative flex gap-4 animate-slide hover:animation-pause">
        {/* First set of notifications */}
        {games.map((game) => (
          <motion.div
            key={`first-${game.uniqueId}`}
            className="flex-shrink-0 bg-[#FD8700] border-2 border-black rounded-xl p-3 w-[220px] h-[94px] shadow-lg"
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-xl bg-black/20">
                <img src="https://bod.gg/assets/bod-coin-BRtRTEUy.svg" alt="BOD Coin" className="text-sm opacity-90" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[16px] text-black font-doggie">
                    {formatAddress(game.player)}
                  </div>
                  <div className="text-lg font-medium font-doggie text-black">
                    {game.amount_won 
                      ? `Won ${(parseInt(game.amount_won) / 1e6).toFixed(2)} USDC`
                      : `Played ${(parseInt(game.amount_played) / 1e6).toFixed(2)} USDC`
                    }
                  </div>
                </div>
              </div>
              <div className="text-[16px] text-black/70 font-doggie">
                {getTimeAgo(game.timestamp)}
              </div>
            </div>
          </motion.div>
        ))}
        {/* Duplicate set of notifications for seamless loop */}
        {games.map((game) => (
          <motion.div
            key={`second-${game.uniqueId}`}
            className="flex-shrink-0 bg-[#FD8700] border-2 border-black rounded-xl p-3 w-[200px] h-[94px] shadow-lg"
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-xl bg-black/20">
                  <img src="https://bod.gg/assets/bod-coin-BRtRTEUy.svg" alt="BOD Coin" className="text-sm opacity-90" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[16px] text-black font-doggie font-black">
                    {formatAddress(game.player)}
                  </div>
                  <div className="text-lg font-medium font-doggie text-black">
                    {game.amount_won 
                      ? `Won ${(parseInt(game.amount_won) / 1e6).toFixed(2)} USDC`
                      : `Played ${(parseInt(game.amount_played) / 1e6).toFixed(2)} USDC`
                    }
                  </div>
                </div>
              </div>
              <div className="text-[16px] text-black/70 font-doggie">
                {getTimeAgo(game.timestamp)}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <style jsx>{`
        @keyframes slide {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-slide {
          animation: slide 120s linear infinite;
          min-width: max-content;
          display: flex;
          width: fit-content;
        }

        .animate-slide:hover {
          animation-play-state: paused;
        }

        @media (max-width: 768px) {
          .animate-slide {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}; 