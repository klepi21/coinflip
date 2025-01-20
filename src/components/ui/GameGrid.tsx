'use client';

import Image from "next/image";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProxyNetworkProvider } from "@multiversx/sdk-network-providers";
import { 
  AbiRegistry, 
  SmartContract, 
  Address, 
  ResultsParser, 
  ContractFunction,
  BooleanValue,
  U64Value,
  TokenPayment
} from "@multiversx/sdk-core";
import { useGetNetworkConfig, useGetAccountInfo } from "@multiversx/sdk-dapp/hooks";
import { formatAmount } from "@multiversx/sdk-dapp/utils";
import { ApiNetworkProvider } from "@multiversx/sdk-network-providers/out";
import { sendTransactions } from "@multiversx/sdk-dapp/services";
import { refreshAccount } from "@multiversx/sdk-dapp/utils/account";
import flipcoinAbi from '@/config/flipcoin.abi.json';

// Constants
const SC_ADDRESS = 'erd1qqqqqqqqqqqqqpgqjksmaalhed4gu59tfn0gtkscl8s2090du7zs6nrdts';
const GAMES_PER_PAGE = 9;

// Token configuration
const TOKEN_DECIMALS: { [key: string]: number } = {
  'EGLD': 18,
  'USDC': 6,
  'WEGLD': 18,
};

const getTokenDecimals = (token: string): number => {
  const baseToken = token.split('-')[0];
  return TOKEN_DECIMALS[baseToken] || 18; // Default to 18 decimals if not found
};

const formatTokenAmount = (amount: string, token: string): string => {
  const decimals = getTokenDecimals(token);
  return formatAmount({
    input: amount,
    decimals: decimals,
    digits: 2,
    showLastNonZeroDecimal: true,
  });
};

type Game = {
  id: number;
  creator: string;
  rival: string | null;
  token: string;
  amount: string;
  winner: string | null;
  timestamp: number;
  creatorHerotag?: string;
  rivalHerotag?: string;
};

type GameResult = 'win' | 'lose' | null;

type PopupState = {
  isOpen: boolean;
  message: string;
  isLoading: boolean;
  gameResult: GameResult;
};

export default function GameGrid() {
  const [currentPage, setCurrentPage] = useState(1);
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'yours'>('all');
  const [popup, setPopup] = useState<PopupState>({
    isOpen: false,
    message: '',
    isLoading: false,
    gameResult: null
  });
  
  const { network } = useGetNetworkConfig();
  const { address: connectedAddress } = useGetAccountInfo();

  const fetchHerotag = async (address: string): Promise<string | undefined> => {
    try {
      const apiNetworkProvider = new ApiNetworkProvider(network.apiAddress);
      const accountInfo = await apiNetworkProvider.getAccount(new Address(address));
      return accountInfo.userName || undefined;
    } catch (error) {
      console.error('Error fetching herotag:', error);
      return undefined;
    }
  };

  const fetchGames = async () => {
    try {
      setIsLoading(true);

      // Initialize the proxy provider with the network API URL
      const provider = new ProxyNetworkProvider(network.apiAddress);

      // Create ABI registry from the JSON
      const abiRegistry = AbiRegistry.create(flipcoinAbi);

      // Create smart contract instance
      const contract = new SmartContract({
        address: new Address(SC_ADDRESS),
        abi: abiRegistry
      });

      // Query the contract
      const query = contract.createQuery({
        func: new ContractFunction('getGames'),
        args: [new BooleanValue(true)]
      });

      const queryResponse = await provider.queryContract(query);

      if (queryResponse?.returnData) {
        const endpointDefinition = contract.getEndpoint('getGames');
        const resultParser = new ResultsParser();
        const results = resultParser.parseQueryResponse(queryResponse, endpointDefinition);
        
        console.log('Raw results:', results);
        console.log('First value:', results.values[0]?.valueOf());

        // The results are in a VariadicValue which contains an array of Game structs
        const gamesArray = results.values[0]?.valueOf();
        console.log('Games array:', gamesArray);
        
        if (gamesArray && Array.isArray(gamesArray)) {
          const processedGames = await Promise.all(gamesArray.map(async (game: any) => {
            console.log('Processing game:', game);
            
            // Safely access nested properties
            const rival = game?.rival;
            const winner = game?.winner;
            const creatorAddress = game?.creator?.toString() || '';
            const rivalAddress = rival && typeof rival.isNone === 'function' && !rival.isNone() 
              ? rival.value.toString() 
              : null;
            
            // Fetch herotags in parallel
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
              winner: winner && typeof winner.isNone === 'function' && !winner.isNone() 
                ? winner.value.toString() 
                : null,
              timestamp: Number(game?.timestamp?.toString() || 0)
            } as Game;
          }));

          console.log('Processed games:', processedGames);
          setGames(processedGames);
        } else {
          console.log('No valid games array found');
          setGames([]);
        }
      } else {
        console.log('No return data from query');
        setGames([]);
      }
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
    // Fetch games every 30 seconds to keep data fresh
    const interval = setInterval(fetchGames, 30000);
    return () => clearInterval(interval);
  }, [network.apiAddress]);

  const checkGameWinner = async (gameId: number): Promise<string> => {
    const provider = new ProxyNetworkProvider(network.apiAddress);
    const contract = new SmartContract({
      address: new Address(SC_ADDRESS),
      abi: AbiRegistry.create(flipcoinAbi)
    });

    const query = contract.createQuery({
      func: new ContractFunction('getWinner'),
      args: [new U64Value(gameId)]
    });
    const queryResponse = await provider.queryContract(query);
    
    const endpointDefinition = contract.getEndpoint('getWinner');
    const resultParser = new ResultsParser();
    const { values } = resultParser.parseQueryResponse(queryResponse, endpointDefinition);
    
    // Convert the Address value to string properly
    const winnerAddress = values[0].valueOf().toString();
    return winnerAddress;
  };

  const handleJoinGame = async (gameId: number, amount: string, token: string) => {
    try {
      setPopup({
        isOpen: true,
        message: 'Preparing transaction...',
        isLoading: true,
        gameResult: null
      });

      const contract = new SmartContract({
        address: new Address(SC_ADDRESS),
        abi: AbiRegistry.create(flipcoinAbi)
      });

      const transaction = contract.methods
        .join([new U64Value(gameId)])
        .withGasLimit(60000000)
        .withChainID(network.chainId);

      // Handle EGLD vs ESDT tokens
      if (token === 'EGLD') {
        transaction.withValue(amount);
      } else {
        const payment = TokenPayment.fungibleFromAmount(token, amount, 0);
        transaction.withSingleESDTTransfer(payment);
      }

      const tx = transaction.buildTransaction();

      setPopup(prev => ({ ...prev, message: 'Confirming transaction...' }));
      
      await sendTransactions({
        transactions: [tx],
        transactionsDisplayInfo: {
          processingMessage: 'Processing join game transaction',
          errorMessage: 'An error occurred during join game',
          successMessage: 'Join game transaction successful'
        }
      });

      setPopup(prev => ({ ...prev, message: 'Checking winner...' }));

      // Wait for transaction to be completed
      await new Promise(resolve => setTimeout(resolve, 6000));
      await refreshAccount();

      // Get the winner
      const winner = await checkGameWinner(gameId);
      const isWinner = winner.toLowerCase() === connectedAddress?.toLowerCase();
      
      setPopup({
        isOpen: true,
        message: isWinner ? 'Congratulations! You won the game!' : 'Better luck next time!',
        isLoading: false,
        gameResult: isWinner ? 'win' : 'lose'
      });

      // Refresh games list in the background without affecting the popup
      fetchGames().catch(console.error);

    } catch (error) {
      console.error('Error joining game:', error);
      setPopup({
        isOpen: true,
        message: typeof error === 'string' ? error : 'Failed to join game. Please try again.',
        isLoading: false,
        gameResult: null
      });
    }
  };

  // Filter games based on selection
  const filteredGames = filter === 'all' 
    ? games 
    : games.filter(game => game.creator.toLowerCase() === connectedAddress?.toLowerCase());

  const totalPages = Math.ceil(filteredGames.length / GAMES_PER_PAGE);
  const startIndex = (currentPage - 1) * GAMES_PER_PAGE;
  const endIndex = startIndex + GAMES_PER_PAGE;
  const currentGames = filteredGames.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Buttons */}
      <div className="flex justify-center gap-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-6 py-2 rounded-full font-semibold transition-colors ${
            filter === 'all'
              ? 'bg-[#75CBDD] text-black'
              : 'bg-zinc-800 text-white hover:bg-zinc-700'
          }`}
        >
          All Games
        </button>
        <button
          onClick={() => setFilter('yours')}
          className={`px-6 py-2 rounded-full font-semibold transition-colors ${
            filter === 'yours'
              ? 'bg-[#75CBDD] text-black'
              : 'bg-zinc-800 text-white hover:bg-zinc-700'
          }`}
        >
          Your Games
        </button>
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentGames.map((game) => (
          <div key={game.id} className="relative pb-6">
            {/* Main box with players */}
            <div className="bg-[#1A1A1A] rounded-2xl overflow-hidden shadow-lg">
              <div className="flex relative min-h-[140px]">
                {/* Left Player (Creator) */}
                <div className="flex-1 p-4 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-full overflow-hidden mb-2 bg-zinc-800">
                    <Image
                      src="https://png.pngtree.com/png-vector/20220817/ourmid/pngtree-man-avatar-with-circle-frame-vector-ilustration-png-image_6110328.png"
                      alt="Creator"
                      width={24}
                      height={24}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-white text-xs font-medium mb-1 truncate w-full text-center">
                    {game.creatorHerotag || `${game.creator.slice(0, 5)}...${game.creator.slice(-4)}`}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400 text-sm font-medium">
                      {formatTokenAmount(game.amount, game.token)}
                    </span>
                    <Image
                      src={`https://tools.multiversx.com/assets-cdn/devnet/tokens/${game.token}/icon.svg`}
                      alt={game.token}
                      width={20}
                      height={20}
                      className="rounded-full"
                    />
                  </div>
                </div>

                {/* VS Badge */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center border border-zinc-800 shadow-lg">
                    <span className="text-zinc-500 text-xs font-medium">VS</span>
                  </div>
                </div>

                {/* Vertical Divider */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-zinc-800 transform -translate-x-1/2"></div>

                {/* Right Player (Rival) */}
                <div className="flex-1 p-4 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-full overflow-hidden mb-2 bg-zinc-800">
                    <Image
                      src="https://png.pngtree.com/png-vector/20220817/ourmid/pngtree-man-avatar-with-circle-frame-vector-ilustration-png-image_6110328.png"
                      alt="Rival"
                      width={24}
                      height={24}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-white text-xs font-medium mb-1 truncate w-full text-center">
                    {game.rival 
                      ? (game.rivalHerotag || `${game.rival.slice(0, 8)}...${game.rival.slice(-4)}`)
                      : 'Waiting...'}
                  </span>
                  {game.rival && (
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-400 text-sm font-medium">
                        {formatTokenAmount(game.amount, game.token)}
                      </span>
                      <Image
                        src={`https://tools.multiversx.com/assets-cdn/devnet/tokens/${game.token}/icon.svg`}
                        alt={game.token}
                        width={20}
                        height={20}
                        className="rounded-full"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Join Button - Only show if no rival */}
            {!game.rival && (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-[calc(50%)] border-[#1A1A1A]">
                <button 
                  disabled={game.creator.toLowerCase() === connectedAddress?.toLowerCase()}
                  onClick={() => handleJoinGame(game.id, game.amount, game.token)}
                  className={`w-full ${
                    game.creator.toLowerCase() === connectedAddress?.toLowerCase()
                      ? 'bg-zinc-600 cursor-not-allowed'
                      : 'bg-[#75CBDD] hover:bg-[#75CBDD]/90'
                  } text-black font-semibold py-2 px-4 rounded-full text-sm transition-colors shadow-lg border-8 border-black`}
                >
                  {game.creator.toLowerCase() === connectedAddress?.toLowerCase()
                    ? 'Your Game'
                    : 'Join game'
                  }
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-4">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className={`p-2 rounded-full ${
              currentPage === 1 ? 'text-zinc-600' : 'text-white hover:bg-zinc-800'
            }`}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <span className="text-white">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className={`p-2 rounded-full ${
              currentPage === totalPages ? 'text-zinc-600' : 'text-white hover:bg-zinc-800'
            }`}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Result Popup */}
      {popup.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="bg-[#1A1A1A] rounded-3xl p-8 max-w-md w-full mx-4 relative border border-zinc-800 shadow-[0_0_50px_-12px] shadow-[#75CBDD]/20">
            {popup.isLoading ? (
              <div className="flex flex-col items-center gap-6 py-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-zinc-800"></div>
                  <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-[#75CBDD] border-t-transparent animate-spin"></div>
                </div>
                <div className="space-y-2 text-center">
                  <h3 className="text-xl font-bold text-white">{popup.message}</h3>
                  <p className="text-zinc-400 text-sm">Please wait while we process your transaction</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6 py-4">
                {popup.gameResult && (
                  <div className="relative">
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center ${
                      popup.gameResult === 'win' ? 'bg-[#75CBDD]/10' : 'bg-zinc-800/50'
                    }`}>
                      <span className="text-5xl animate-bounce">
                        {popup.gameResult === 'win' ? '🎉' : '🎲'}
                      </span>
                    </div>
                    {popup.gameResult === 'win' && (
                      <div className="absolute -inset-2 rounded-full border-2 border-[#75CBDD]/30 animate-pulse"></div>
                    )}
                  </div>
                )}
                <div className="space-y-2 text-center">
                  <h3 className={`text-2xl font-bold ${
                    popup.gameResult === 'win' ? 'text-[#75CBDD]' : 'text-white'
                  }`}>
                    {popup.gameResult === 'win' 
                      ? 'Congratulations! You Won!' 
                      : popup.gameResult === 'lose'
                      ? 'Better Luck Next Time!'
                      : 'Transaction Status'}
                  </h3>
                  <p className="text-zinc-400">{popup.message}</p>
                </div>
                <button
                  onClick={() => setPopup(prev => ({ ...prev, isOpen: false }))}
                  className="mt-4 group relative px-8 py-3 bg-[#1A1A1A] text-white font-semibold rounded-full overflow-hidden transition-all hover:scale-105"
                >
                  <div className="absolute inset-0 w-0 bg-[#75CBDD] transition-all duration-300 ease-out group-hover:w-full"></div>
                  <span className="relative group-hover:text-black">Close</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 