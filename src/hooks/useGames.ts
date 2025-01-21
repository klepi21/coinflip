import { useState, useEffect, useCallback } from 'react';
import { ProxyNetworkProvider, ApiNetworkProvider } from "@multiversx/sdk-network-providers";
import { 
  AbiRegistry, 
  SmartContract, 
  Address, 
  ResultsParser, 
  ContractFunction,
  BooleanValue
} from "@multiversx/sdk-core";
import { useGetNetworkConfig } from "@multiversx/sdk-dapp/hooks";
import flipcoinAbi from '@/config/flipcoin.abi.json';

// Constants
const SC_ADDRESS = 'erd1qqqqqqqqqqqqqpgqwpmgzezwm5ffvhnfgxn5uudza5mp7x6jfhwsh28nqx';

export type Game = {
  id: number;
  creator: string;
  rival: string | null;
  token: string;
  amount: string;
  winner: string | null;
  timestamp: number;
  creatorHerotag?: string;
  rivalHerotag?: string;
  side: number;
};

export function useGames() {
  const [games, setGames] = useState<Game[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { network } = useGetNetworkConfig();

  const fetchHerotag = async (address: string): Promise<string | undefined> => {
    try {
      const apiNetworkProvider = new ApiNetworkProvider(network.apiAddress);
      const accountInfo = await apiNetworkProvider.getAccount(new Address(address));
      return accountInfo.userName || undefined;
    } catch (error) {
      return undefined;
    }
  };

  const fetchGames = useCallback(async () => {
    try {
      // Only set refreshing state if we already have games
      if (!isInitialLoading) {
        setIsRefreshing(true);
      }

      const provider = new ProxyNetworkProvider(network.apiAddress);
      const contract = new SmartContract({
        address: new Address(SC_ADDRESS),
        abi: AbiRegistry.create(flipcoinAbi)
      });

      const query = contract.createQuery({
        func: new ContractFunction('getGames'),
        args: [new BooleanValue(true)]
      });

      const queryResponse = await provider.queryContract(query);

      if (queryResponse?.returnData) {
        const endpointDefinition = contract.getEndpoint('getGames');
        const resultParser = new ResultsParser();
        const results = resultParser.parseQueryResponse(queryResponse, endpointDefinition);
        
        const gamesArray = results.values[0]?.valueOf();
        
        if (gamesArray && Array.isArray(gamesArray)) {
          const processedGames = await Promise.all(gamesArray.map(async (game: any) => {
            const rival = game?.rival;
            const winner = game?.winner;
            const creatorAddress = game?.creator?.toString() || '';
            const rivalAddress = rival && typeof rival.isNone === 'function' && !rival.isNone() 
              ? rival.value.toString() 
              : null;
            
            const [creatorHerotag, rivalHerotag] = await Promise.all([
              fetchHerotag(creatorAddress),
              rivalAddress ? fetchHerotag(rivalAddress) : undefined
            ]);
            
            return {
              id: Number(game?.id?.toString() || 0),
              creator: creatorAddress,
              creatorHerotag,
              rival: rivalAddress,
              rivalHerotag,
              token: game?.token?.toString() || '',
              amount: game?.amount?.toString() || '0',
              side: Number(game?.side?.toString() || 0),
              winner: winner && typeof winner.isNone === 'function' && !winner.isNone() 
                ? winner.value.toString() 
                : null,
              timestamp: Number(game?.timestamp?.toString() || 0)
            } as Game;
          }));

          // Add console log for active games
          processedGames.forEach(game => {
            if (!game.rival) {  // Only log active (open) games
              console.log(`Game ${game.id} side: ${game.side}`);
            }
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
    } catch (error) {
      // Silent error handling to prevent UI disruption
    } finally {
      setIsInitialLoading(false);
      setIsRefreshing(false);
    }
  }, [network.apiAddress, isInitialLoading]);

  useEffect(() => {
    fetchGames();
    const interval = setInterval(fetchGames, 30000);
    return () => clearInterval(interval);
  }, [fetchGames]);

  const refetchGames = () => {
    fetchGames();
  };

  return {
    games,
    isInitialLoading,
    isRefreshing,
    refetchGames
  };
} 