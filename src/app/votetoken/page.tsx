'use client';

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ProxyNetworkProvider } from "@multiversx/sdk-network-providers";
import { 
  AbiRegistry, 
  SmartContract, 
  Address, 
  ResultsParser,
  ContractFunction,
  BigUIntValue,
  TokenPayment
} from "@multiversx/sdk-core";
import { useGetNetworkConfig, useGetAccountInfo } from "@multiversx/sdk-dapp/hooks";
import { sendTransactions } from "@multiversx/sdk-dapp/services";
import { refreshAccount } from "@multiversx/sdk-dapp/utils/account";
import { toast, Toaster } from 'sonner';
import { RetroGrid } from '@/components/ui/retro-grid';
import flipcoinAbi from '@/config/flipcoin.abi.json';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { useWallet } from '@/context/WalletContext';
import Image from "next/image";

// Constants
const SC_ADDRESS = 'erd1qqqqqqqqqqqqqpgqwpmgzezwm5ffvhnfgxn5uudza5mp7x6jfhwsh28nqx';
const RARE_IDENTIFIER = 'RARE-99e8b0';
const BOD_IDENTIFIER = 'BOD-204877';
const VOTE_MULTIPLIERS = [1, 3, 5, 10, 15];

// Token data with images
const TOKENS = {
  RARE: {
    id: 'RARE',
    name: 'RARE',
    image: `https://tools.multiversx.com/assets-cdn/tokens/${RARE_IDENTIFIER}/icon.svg`,
    decimals: 18,
    voteAmount: '10'
  },
  BOD: {
    id: 'BOD',
    name: 'BOD',
    image: `https://tools.multiversx.com/assets-cdn/tokens/${BOD_IDENTIFIER}/icon.svg`,
    decimals: 18,
    voteAmount: '10000'
  }
};

interface VoteOption {
  name: string;
  votes: number;
  image: string;
  option: number;
}

export default function VoteTokenPage() {
  const [votes, setVotes] = useState<VoteOption[]>([
    { name: 'KWAK', votes: 0, image: 'https://tools.multiversx.com/assets-cdn/tokens/KWAK-469ab0/icon.svg', option: 1 },
    { name: 'ONE', votes: 0, image: 'https://tools.multiversx.com/assets-cdn/tokens/ONE-f9954f/icon.svg', option: 2 },
    { name: 'TOM', votes: 0, image: 'https://tools.multiversx.com/assets-cdn/tokens/TOM-48414f/icon.svg', option: 3 },
    { name: 'JEX', votes: 0, image: 'https://tools.multiversx.com/assets-cdn/tokens/JEX-9040ca/icon.svg', option: 4 }
  ]);
  const [selectedOption, setSelectedOption] = useState<VoteOption | null>(null);
  const [selectedToken, setSelectedToken] = useState<'RARE' | 'BOD'>('RARE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [multiplier, setMultiplier] = useState(1);

  const { network } = useGetNetworkConfig();
  const { address } = useGetAccountInfo();
  const { isLoggedIn } = useWallet();
  const { balance: rareBalance, isLoading: isLoadingRare } = useTokenBalance(address || '', RARE_IDENTIFIER);
  const { balance: bodBalance, isLoading: isLoadingBod } = useTokenBalance(address || '', BOD_IDENTIFIER);

  const fetchVotes = async () => {
    try {
      const provider = new ProxyNetworkProvider(network.apiAddress);
      const contract = new SmartContract({
        address: new Address(SC_ADDRESS),
        abi: AbiRegistry.create(flipcoinAbi)
      });

      const query = contract.createQuery({
        func: new ContractFunction("getAllTokenVotes"),
      });

      const queryResponse = await provider.queryContract(query);
      const endpointDefinition = contract.getEndpoint("getAllTokenVotes");
      const { values } = new ResultsParser().parseQueryResponse(queryResponse, endpointDefinition);
      
      // Update votes with the fetched data
      const updatedVotes = [...votes];
      const voteData = values[0].valueOf();
      
      voteData.forEach((vote: any, index: number) => {
        if (updatedVotes[index]) {
          updatedVotes[index].votes = Number(vote.total_votes.toString());
        }
      });

      setVotes(updatedVotes);
    } catch (error) {
      console.error('Error fetching votes:', error);
      toast.error('Failed to fetch votes');
    }
  };

  useEffect(() => {
    fetchVotes();
  }, [network.apiAddress]);

  const handleVote = async () => {
    if (!selectedOption || !isLoggedIn) {
      toast.error('Please connect your wallet and select an option');
      return;
    }

    // Check balance based on selected token
    const currentBalance = selectedToken === 'RARE' ? rareBalance : bodBalance;
    const requiredAmount = Number(TOKENS[selectedToken].voteAmount);
    
    if (currentBalance < requiredAmount) {
      toast.error(`Insufficient ${selectedToken} balance. You need ${requiredAmount} ${selectedToken} to vote.`);
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Show loading toast
      const loadingToastId = toast.loading(
        <div className="flex flex-col space-y-2">
          <p className="font-medium text-white">Processing Vote...</p>
          <p className="text-sm text-zinc-400">Please wait while we submit your vote</p>
        </div>,
        {
          style: {
            background: '#1A1A1A',
            border: '1px solid rgba(201, 151, 51, 0.1)',
          }
        }
      );
      
      const tokenId = selectedToken === 'RARE' ? RARE_IDENTIFIER : BOD_IDENTIFIER;
      const amount = TOKENS[selectedToken].voteAmount;
      
      // Create ESDTTransfer transaction data
      const encodedTokenId = Buffer.from(tokenId).toString('hex');
      const rawAmount = (BigInt(amount) * BigInt(10 ** 18)).toString(16).padStart(64, '0');
      const optionHex = selectedOption.option.toString(16).padStart(2, '0');
      const data = `ESDTTransfer@${encodedTokenId}@${rawAmount}@766f7465546f6b656e@${optionHex}`;

      const transactions = Array(multiplier).fill({
        value: '0',
        data: data,
        receiver: SC_ADDRESS,
        gasLimit: 10000000,
      });

      const { sessionId } = await sendTransactions({
        transactions,
        transactionsDisplayInfo: {
          processingMessage: `Voting ${multiplier} time${multiplier > 1 ? 's' : ''} for ${selectedToken}...`,
          errorMessage: 'An error has occurred during voting',
          successMessage: `Successfully voted ${multiplier} time${multiplier > 1 ? 's' : ''}!`
        }
      });

      if (sessionId) {
        setIsSubmitting(true);
        await refreshAccount();
        await fetchVotes();
        toast.dismiss(loadingToastId);
        toast.success('Vote submitted successfully!');
        setSelectedOption(null);
      }
    } catch (error) {
      console.error('Error voting:', error);
      toast.error('Failed to submit vote');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalVotes = votes.reduce((sum, option) => sum + option.votes, 0);

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
          },
        }}
      />
      <div className="h-full overflow-auto pt-24">
        <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            <div className="bg-[#1A1A1A]/80 backdrop-blur-sm rounded-3xl border border-zinc-800 shadow-xl p-6 space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">Vote for Next Token</h2>
                <p className="text-zinc-400">Choose your favorite token to be added next!</p>
                <div className="flex items-center gap-2 mt-2">
                  <p className="text-xs sm:text-sm text-[#C99733]">Vote with:</p>
                  <div className="flex gap-2">
                    {Object.entries(TOKENS).map(([key, token]) => ( 
                      <button
                        key={key}
                        onClick={() => setSelectedToken(key as 'RARE' | 'BOD')}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                          selectedToken === key 
                            ? 'bg-gradient-to-r from-[#C99733] to-[#FFD163] border-black text-black' 
                            : 'border-zinc-800 hover:border-[#C99733] text-white' 
                        }`}
                      >
                        <div className="w-5 h-5 rounded-full overflow-hidden">
                          <Image
                            src={token.image}
                            alt={token.name}
                            width={20}
                            height={20}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="font-medium">{token.voteAmount} {token.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {votes.map((option) => {
                  const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
                  const isSelected = selectedOption?.name === option.name;

                  return (
                    <button
                      key={option.name}
                      onClick={() => setSelectedOption(option)}
                      disabled={isSubmitting}
                      className={`relative group p-4 rounded-xl border transition-all ${
                        isSelected 
                          ? 'bg-gradient-to-r from-[#C99733]/20 to-[#FFD163]/20 border-[#C99733]' 
                          : 'bg-black/20 border-zinc-800 hover:border-[#C99733]/50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-black/20">
                          {/* Replace with actual token images */}
                          <div className="w-full h-full flex items-center justify-center text-[#C99733]">
                            <Image src={option.image} alt={option.name} width={20} height={20} className="w-full h-full object-cover" />
                          </div>
                        </div>
                        <div className="flex-1 text-left">
                          <h3 className="text-lg font-bold text-white mb-1">{option.name}</h3>
                          <div className="w-full bg-black/20 rounded-full h-2 mb-2">
                            <div
                              className="bg-gradient-to-r from-[#C99733] to-[#FFD163] h-2 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <p className="text-sm text-zinc-400">
                            {option.votes} votes ({percentage.toFixed(1)}%)
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Add Vote Multiplier Selection */}
              <div className="mt-8">
                <label className="block text-zinc-400 text-sm mb-2">How many votes to cast?</label>
                <div className="flex gap-1">
                  {VOTE_MULTIPLIERS.map((mult) => (
                    <button
                      key={mult}
                      onClick={() => setMultiplier(mult)}
                      className={`flex-1 h-10 rounded-xl text-sm ${
                        multiplier === mult 
                          ? 'bg-gradient-to-r from-[#C99733] to-[#FFD163] text-black' 
                          : 'bg-zinc-800 text-white'
                      } font-medium transition-all`}
                    >
                      {mult}x
                    </button>
                  ))}
                </div>
              </div>

              {!isLoggedIn ? (
                <div className="text-center">
                  <p className="text-zinc-400 mb-4">Connect your wallet to vote</p>
                </div>
              ) : (
                <div className="flex justify-center">
                  <button
                    onClick={handleVote}
                    disabled={!selectedOption || isSubmitting}
                    className={`w-full h-12 mt-8 rounded-xl font-medium transition-all ${
                      !selectedOption || isSubmitting
                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-[#C99733] to-[#FFD163] hover:opacity-90 text-black'
                    }`}
                  >
                    {isSubmitting 
                      ? 'Processing...' 
                      : selectedOption 
                        ? `Vote ${multiplier}x for ${selectedOption.name}` 
                        : 'Select a token to vote'}
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs">
                <span className="text-zinc-500">Balance:</span>
                {isLoadingRare || isLoadingBod ? (
                  <span className="text-zinc-400">Loading...</span>
                ) : (
                  <span className="text-white font-medium">
                    {(selectedToken === 'RARE' ? rareBalance : bodBalance).toFixed(2)} {selectedToken}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
} 