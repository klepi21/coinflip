'use client';

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  Address,
  TokenPayment,
  SmartContract,
  AbiRegistry,
  U64Value,
  ContractFunction,
  ResultsParser
} from "@multiversx/sdk-core";
import { useGetNetworkConfig, useGetAccountInfo } from "@multiversx/sdk-dapp/hooks";
import { sendTransactions } from "@multiversx/sdk-dapp/services";
import { refreshAccount } from "@multiversx/sdk-dapp/utils/account";
import { toast, Toaster } from 'sonner';
import { RetroGrid } from '@/components/ui/retro-grid';
import { GameStatusModal } from '@/components/ui/GameStatusModal';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { useGames } from '@/hooks/useGames';
import Image from "next/image";
import { ProxyNetworkProvider } from "@multiversx/sdk-network-providers";
import flipcoinAbi from '@/config/flipcoin.abi.json';
import { Twitter } from 'lucide-react';

// Constants
const SC_ADDRESS = 'erd1qqqqqqqqqqqqqpgqwpmgzezwm5ffvhnfgxn5uudza5mp7x6jfhwsh28nqx';
const TOKEN_DECIMALS = 18;
const RARE_IDENTIFIER = 'RARE-99e8b0';
const BOD_IDENTIFIER = 'BOD-204877';

const TOKEN_IMAGES: Record<string, string> = {
  [RARE_IDENTIFIER]: `https://tools.multiversx.com/assets-cdn/tokens/${RARE_IDENTIFIER}/icon.svg`,
  [BOD_IDENTIFIER]: `https://tools.multiversx.com/assets-cdn/tokens/${BOD_IDENTIFIER}/icon.svg`,
  'EGLD': 'https://s2.coinmarketcap.com/static/img/coins/200x200/6892.png'
};

const formatTokenAmount = (amount: string, token: string): string => {
  try {
    const BigNumber = require('bignumber.js');
    const value = new BigNumber(amount).dividedBy(new BigNumber(10).pow(TOKEN_DECIMALS));
    return token === 'EGLD' ? value.toFixed(2) : Math.floor(value).toString();
  } catch (error) {
    console.error('Error formatting token amount:', error);
    return '0';
  }
};

export default function GamePage() {
  const searchParams = useSearchParams();
  const gameId = searchParams.get('id');
  const [transactionStep, setTransactionStep] = useState<'signing' | 'processing' | 'checking' | 'revealing'>('signing');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [gameResult, setGameResult] = useState<'win' | 'lose' | null>(null);

  const { network } = useGetNetworkConfig();
  const { address: connectedAddress } = useGetAccountInfo();
  const accountInfo = useGetAccountInfo();
  const { balance: rareBalance, isLoading: isLoadingRare } = useTokenBalance(connectedAddress || '', RARE_IDENTIFIER);
  const { balance: bodBalance, isLoading: isLoadingBod } = useTokenBalance(connectedAddress || '', BOD_IDENTIFIER);
  const { games, isInitialLoading, refetchGames } = useGames();

  const game = games.find(g => g.id === Number(gameId));

  const router = useRouter();

  const canJoinGame = (gameAmount: string, tokenIdentifier: string): boolean => {
    if (!connectedAddress || isLoadingRare || isLoadingBod) return false;
    
    try {
      const currentBalance = tokenIdentifier === RARE_IDENTIFIER ? rareBalance : bodBalance;
      // Convert amounts to numbers for comparison
      const requiredAmount = Number(gameAmount) / (10 ** TOKEN_DECIMALS);
      
      return currentBalance >= requiredAmount;
    } catch (error) {
      console.error('Error checking balance:', error);
      return false;
    }
  };

  const handleJoinGame = async () => {
    if (!game || !connectedAddress) return;

    try {
      setShowStatusModal(true);
      setTransactionStep('signing');
      setGameResult(null);

      const contract = new SmartContract({
        address: new Address(SC_ADDRESS),
        abi: AbiRegistry.create(flipcoinAbi)
      });

      const transaction = contract.methods
        .join([new U64Value(game.id)])
        .withSender(new Address(connectedAddress))
        .withGasLimit(10000000)
        .withChainID(network.chainId);

      if (game.token === 'EGLD') {
        transaction.withValue(game.amount);
      } else {
        const payment = TokenPayment.fungibleFromAmount(game.token, game.amount, 0);
        transaction.withSingleESDTTransfer(payment);
      }

      const tx = transaction.buildTransaction();
      
      const { sessionId } = await sendTransactions({
        transactions: [tx],
        transactionsDisplayInfo: {
          processingMessage: 'Processing game transaction',
          errorMessage: 'An error occurred during game transaction',
          successMessage: 'Transaction successful'
        }
      });

      if (!sessionId) {
        throw new Error('Failed to get transaction session ID');
      }

      // Wait for initial blockchain confirmation
      await new Promise(resolve => setTimeout(resolve, accountInfo.shard === 1 ? 10000 : 25000));
      await refreshAccount();

      setTransactionStep('checking');

      // Additional wait to ensure smart contract state is updated
      await new Promise(resolve => setTimeout(resolve, 4000));

      let retries = 3;
      let winner = null;

      setTransactionStep('revealing');

      while (retries > 0 && !winner) {
        try {
          winner = await checkGameWinner(game.id);
          if (winner) break;
        } catch (error) {
          retries--;
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }

      if (!winner) {
        throw new Error('Could not determine game result');
      }

      const isWinner = winner.toLowerCase() === connectedAddress?.toLowerCase();
      setGameResult(isWinner ? 'win' : 'lose');

      // Refresh all necessary states
      await Promise.all([
        refreshAccount(),
        refetchGames()
      ]);

    } catch (error) {
      console.error('Join game error:', error);
      setShowStatusModal(false);
    }
  };

  const handleCloseStatusModal = () => {
    setShowStatusModal(false);
    setGameResult(null);
    router.push('/');
  };

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

  if (isInitialLoading) {
    return (
      <main className="relative h-screen overflow-hidden bg-black">
        <RetroGrid />
        <div className="h-full overflow-auto pt-24">
          <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-center">
            <div className="text-white">Loading...</div>
          </div>
        </div>
      </main>
    );
  }

  if (!game) {
    return (
      <main className="relative h-screen overflow-hidden bg-black">
        <RetroGrid />
        <div className="h-full overflow-auto pt-24">
          <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#1A1A1A]/80 backdrop-blur-sm rounded-3xl border border-zinc-800 shadow-xl p-8 text-center"
            >
              <h2 className="text-2xl font-bold text-white mb-4">Game Not Found</h2>
              <p className="text-zinc-400">This game doesn't exist or has already been played.</p>
            </motion.div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative h-screen overflow-hidden bg-black">
      <RetroGrid />
      <Toaster 
        theme="dark" 
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1A1A1A',
            border: '1px solid rgba(201, 151, 51, 0.1)',
            color: 'white',
            zIndex: 200,
          },
          className: 'my-toast-class',
        }}
        richColors
      />
      <div className="h-full overflow-auto pt-24">
        <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            {/* Game Card */}
            <div className="relative bg-[#1A1A1A]/80 backdrop-blur-sm rounded-3xl border border-zinc-800 shadow-xl p-6">
              {/* Game Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Game #{game.id}</h3>
                  <p className="text-sm text-zinc-400">
                    Created by: {game.creator.slice(0, 8)}...{game.creator.slice(-4)}
                  </p>
                </div>
                <div className="text-right flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full overflow-hidden">
                    <Image
                      src={TOKEN_IMAGES[game.token] || TOKEN_IMAGES['EGLD']}
                      alt={game.token}
                      width={24}
                      height={24}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-lg font-bold text-[#C99733]">
                    {formatTokenAmount(game.amount, game.token)} {game.token.split('-')[0]}
                  </div>
                </div>
              </div>

              {/* Game Content */}
              <div className="relative aspect-video bg-black/20 rounded-xl overflow-hidden mb-6">
                <div className="absolute inset-0">
                  <Image
                    src="/img/pick.jpg"
                    alt="Fight Background"
                    width={800}
                    height={400}
                    className="w-full h-full object-cover opacity-50"
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-between px-12">
                  <div className="text-center">
                    <div className="w-64 h-64 mx-auto mb-4">
                      <Image
                        src={game.side === 0 ? '/img/grm.png?v=3' : '/img/sasu.png?v=3'}
                        alt={game.side === 0 ? 'GRM' : 'SASU'}
                        width={128}
                        height={128}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="text-white font-bold">{game.side === 0 ? 'GRM' : 'SASU'}</div>
                  </div>
                  <div className="text-center">
                    <div className="w-64 h-64 mx-auto mb-4">
                      <Image
                        src={game.side === 0 ? '/img/sasu.png?v=3' : '/img/grm.png?v=3'}
                        alt={game.side === 0 ? 'SASU' : 'GRM'}
                        width={128}
                        height={128}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="text-white font-bold">{game.side === 0 ? 'SASU' : 'GRM'}</div>
                  </div>
                </div>

                {/* Twitter Share Button - Moved to bottom right */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const text = `Join me in this epic battle on F.0! 🎮\nPrize pool: ${Number(game.amount) / (10 ** TOKEN_DECIMALS)} ${game.token.split('-')[0]}\n`;
                    const url = `${window.location.origin}/game?id=${game.id}`;
                    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
                  }}
                  className="absolute bottom-4 right-4 p-2 bg-black/50 hover:bg-[#C99733] rounded-full transition-colors z-10 backdrop-blur-sm group"
                  title="Share on Twitter"
                >
                  <Twitter className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Join Button */}
              {!game.rival && (
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-1/2">
                  {!connectedAddress ? (
                    <button 
                      disabled
                      className="w-full bg-zinc-600 cursor-not-allowed text-black font-semibold py-3 px-6 rounded-full text-sm transition-colors shadow-lg border-8 border-black"
                    >
                      Connect Wallet
                    </button>
                  )  : (
                    <button 
                      onClick={handleJoinGame}
                      disabled={!canJoinGame(game.amount, game.token)}
                      className={`w-full font-semibold py-3 px-6 rounded-full text-sm transition-colors shadow-lg border-8 border-black ${
                        canJoinGame(game.amount, game.token)
                          ? 'bg-gradient-to-r from-[#C99733] to-[#FFD163] hover:opacity-90 text-black'
                          : 'bg-zinc-600 cursor-not-allowed text-zinc-400'
                      }`}
                      title={!canJoinGame(game.amount, game.token) ? `Insufficient balance (${game.amount})` : ''}
                    >
                      {canJoinGame(game.amount, game.token) ? 'Join game' : 'Insufficient balance'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <GameStatusModal
        isOpen={showStatusModal}
        onClose={handleCloseStatusModal}
        currentStep={transactionStep}
        gameResult={gameResult}
      />
    </main>
  );
} 