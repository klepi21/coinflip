import { useState, useEffect, useCallback } from 'react';
import { ProxyNetworkProvider } from "@multiversx/sdk-network-providers";
import { 
  AbiRegistry, 
  SmartContract, 
  Address, 
  ResultsParser, 
  ContractFunction,
  BooleanValue,
  U64Value
} from "@multiversx/sdk-core";
import flipcoinAbi from '@/config/flipcoin.abi.json';

// Constants
const SC_ADDRESS = 'erd1qqqqqqqqqqqqqpgqwpmgzezwm5ffvhnfgxn5uudza5mp7x6jfhwsh28nqx';
const GATEWAY_URL = 'https://multiversx-api.beaconx.app/public-mainnet-gateway';

export type Game = {
  id: number;
  creator: string;
  rival: string | null;
  token: string;
  amount: string;
  winner: string | null;
  timestamp: number;
  side: number;
};

export function useGames() {
  const [games, setGames] = useState<Game[]>([]);
  const [totalGamesPlayed, setTotalGamesPlayed] = useState<number>(0);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchGamesAndTotal = useCallback(async () => {
    try {
      if (!isInitialLoading) {
        setIsRefreshing(true);
      }

      const provider = new ProxyNetworkProvider(GATEWAY_URL);
      const contract = new SmartContract({
        address: new Address(SC_ADDRESS),
        abi: AbiRegistry.create(flipcoinAbi)
      });

      // Fetch both games and total count in parallel
      const [gamesQuery, totalQuery] = await Promise.all([
        contract.createQuery({
          func: new ContractFunction('getGames'),
          args: [new BooleanValue(true)]
        }),
        contract.createQuery({
          func: new ContractFunction('getId'),
        })
      ]);

      const [gamesResponse, totalResponse] = await Promise.all([
        provider.queryContract(gamesQuery),
        provider.queryContract(totalQuery)
      ]);

      // Process games
      if (gamesResponse?.returnData) {
        const endpointDefinition = contract.getEndpoint('getGames');
        const resultParser = new ResultsParser();
        const results = resultParser.parseQueryResponse(gamesResponse, endpointDefinition);
        
        const gamesArray = results.values[0]?.valueOf();
        
        if (gamesArray && Array.isArray(gamesArray)) {
          const processedGames = gamesArray.map((game: any) => {
            const rival = game?.rival;
            const winner = game?.winner;
            const creatorAddress = game?.creator?.toString() || '';
            const rivalAddress = rival && typeof rival.isNone === 'function' && !rival.isNone() 
              ? rival.value.toString() 
              : null;
            
            return {
              id: Number(game?.id?.toString() || 0),
              creator: creatorAddress,
              rival: rivalAddress,
              token: game?.token?.toString() || '',
              amount: game?.amount?.toString() || '0',
              side: Number(game?.side?.toString() || 0),
              winner: winner && typeof winner.isNone === 'function' && !winner.isNone() 
                ? winner.value.toString() 
                : null,
              timestamp: Number(game?.timestamp?.toString() || 0)
            } as Game;
          });

          // Update games smoothly
          setGames(prevGames => {
            const updatedGames = [...prevGames];
            
            // Remove completed games smoothly
            const activeGameIds = new Set(processedGames.map(g => g.id));
            const completedGames = updatedGames.filter(g => !activeGameIds.has(g.id));
            completedGames.forEach(game => {
              const index = updatedGames.findIndex(g => g.id === game.id);
              if (index !== -1) {
                updatedGames.splice(index, 1);
              }
            });

            // Update existing games and add new ones smoothly
            processedGames.forEach(newGame => {
              const existingIndex = updatedGames.findIndex(g => g.id === newGame.id);
              if (existingIndex !== -1) {
                if (JSON.stringify(updatedGames[existingIndex]) !== JSON.stringify(newGame)) {
                  updatedGames[existingIndex] = newGame;
                }
              } else {
                updatedGames.push(newGame);
              }
            });

            return updatedGames;
          });
        }
      }

      // Process total games
      if (totalResponse?.returnData?.[0]) {
        const endpointDefinition = contract.getEndpoint('getId');
        const resultParser = new ResultsParser();
        const results = resultParser.parseQueryResponse(totalResponse, endpointDefinition);
        const totalGames = Number(results.values[0].valueOf().toString());
        setTotalGamesPlayed(totalGames);
      }

    } catch (error) {
      // Silent error handling to prevent UI disruption
    } finally {
      setIsInitialLoading(false);
      setIsRefreshing(false);
    }
  }, [isInitialLoading]);

  useEffect(() => {
    fetchGamesAndTotal();
    const interval = setInterval(fetchGamesAndTotal, 30000);
    return () => clearInterval(interval);
  }, [fetchGamesAndTotal]);

  return {
    games,
    totalGamesPlayed,
    isInitialLoading,
    isRefreshing,
    refetchGames: fetchGamesAndTotal
  };
} 