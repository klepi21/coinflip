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
  BigUIntValue
} from "@multiversx/sdk-core";
import { useGetNetworkConfig, useGetAccountInfo } from "@multiversx/sdk-dapp/hooks";
import { sendTransactions } from "@multiversx/sdk-dapp/services";
import { refreshAccount } from "@multiversx/sdk-dapp/utils/account";
import { toast, Toaster } from "sonner";
import flipcoinAbi from '@/config/flipcoin.abi.json';
import { useWallet } from '@/context/WalletContext';
import { RetroGrid } from '@/components/ui/retro-grid';
import Image from "next/image";
import { useTokenBalance } from '@/hooks/useTokenBalance';

// Constants
const SC_ADDRESS = 'erd1qqqqqqqqqqqqqpgqwpmgzezwm5ffvhnfgxn5uudza5mp7x6jfhwsh28nqx';
const RARE_IDENTIFIER = 'RARE-99e8b0';
const BOD_IDENTIFIER = 'BOD-204877';
const ONE_IDENTIFIER = 'ONE-f9954f';

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
  },
  ONE: {
    id: 'ONE',
    name: 'ONE',
    image: `https://tools.multiversx.com/assets-cdn/tokens/${ONE_IDENTIFIER}/icon.svg`,
    decimals: 18,
    voteAmount: '0.5'
  }
};

interface VoteOption {
  option: number;
  total_votes: number;
}

export default function Vote() {
  const [votes, setVotes] = useState<VoteOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [selectedToken, setSelectedToken] = useState<'RARE' | 'BOD' | 'ONE'>('RARE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const accountInfo = useGetAccountInfo();
  const [totalVotes, setTotalVotes] = useState(0);
  const { network } = useGetNetworkConfig();
  const { address } = useGetAccountInfo();
  const { isLoggedIn } = useWallet();
  const { balance: rareBalance, isLoading: isLoadingRare } = useTokenBalance(address || '', RARE_IDENTIFIER);
  const { balance: bodBalance, isLoading: isLoadingBod } = useTokenBalance(address || '', BOD_IDENTIFIER);
  const { balance: oneBalance, isLoading: isLoadingOne } = useTokenBalance(address || '', ONE_IDENTIFIER);

  const fetchVotes = async () => {
    try {
      const provider = new ProxyNetworkProvider(network.apiAddress);
      const contract = new SmartContract({
        address: new Address(SC_ADDRESS),
        abi: AbiRegistry.create(flipcoinAbi)
      });

      const query = contract.createQuery({
        func: new ContractFunction("getAllVotes"),
      });

      const queryResponse = await provider.queryContract(query);
      const endpointDefinition = contract.getEndpoint("getAllVotes");
      const { values } = new ResultsParser().parseQueryResponse(queryResponse, endpointDefinition);
      
      // Convert the raw values to our VoteOption interface
      const votesData = values[0].valueOf().map((vote: any) => ({
        option: Number(vote.option.toString()),
        total_votes: Number(vote.total_votes.toString())
      }));

      setVotes(votesData);
      
      const total = votesData.reduce((acc: number, curr: VoteOption) => acc + curr.total_votes, 0);
      setTotalVotes(total);
    } catch (error) {
      console.error('Error fetching votes:', error);
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
    const currentBalance = selectedToken === 'RARE' ? rareBalance : 
                          selectedToken === 'BOD' ? bodBalance :
                          oneBalance;
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
      
      const tokenId = selectedToken === 'RARE' ? RARE_IDENTIFIER : 
                     selectedToken === 'BOD' ? BOD_IDENTIFIER :
                     ONE_IDENTIFIER;
      const amount = TOKENS[selectedToken].voteAmount;
      
      // Create ESDTTransfer transaction data
      const encodedTokenId = Buffer.from(tokenId).toString('hex');
      const rawAmount = (BigInt(amount) * BigInt(10 ** 18)).toString(16).padStart(64, '0');
      const data = `ESDTTransfer@${encodedTokenId}@${rawAmount}@766f7465@0${selectedOption.toString(16)}`;

      const transaction = {
        value: '0',
        data: data,
        receiver: SC_ADDRESS,
        gasLimit: 10000000,
      };

      const { sessionId, error } = await sendTransactions({
        transactions: [transaction],
        transactionsDisplayInfo: {
          processingMessage: 'Processing vote transaction',
          errorMessage: 'An error occurred during voting',
          successMessage: 'Vote submitted successfully'
        }
      });

      if (error) {
        toast.dismiss(loadingToastId);
        throw new Error(error);
      }

      // Add delay before checking transaction status
      await new Promise(resolve => setTimeout(resolve, accountInfo.shard === 1 ? 10000 : 25000));
      await refreshAccount();

      // Additional wait to ensure smart contract state is updated
      await new Promise(resolve => setTimeout(resolve, 4000));

      // Dismiss loading toast and show success toast
      toast.dismiss(loadingToastId);
      toast.success(
        <div className="flex flex-col space-y-2">
          <div className="p-4">
            <p className="text-sm font-medium text-white">Vote Successful!</p>
            <p className="mt-1 text-sm text-zinc-400">Your vote has been recorded.</p>
          </div>
          <div className="border-t border-zinc-800 p-2">
            <button
              onClick={() => {
                fetchVotes();
              }}
              className="w-full p-2 text-sm font-medium text-[#C99733] hover:text-[#FFD163] transition-colors rounded-md hover:bg-zinc-800/50"
            >
              Refresh Results
            </button>
          </div>
        </div>,
        {
          style: {
            background: '#1A1A1A',
            border: '1px solid rgba(201, 151, 51, 0.1)',
          },
          duration: 5000,
        }
      );

      // Refresh data
      await fetchVotes();
      setSelectedOption(null);

    } catch (error: any) {
      console.error('Vote error:', error);
      // Don't show error toast since the transaction might still be processing
      if (error?.message?.includes('Request error on url')) {
        toast.info(
          <div className="flex flex-col space-y-2">
            <p className="font-medium text-white">Transaction Processing</p>
            <p className="text-sm text-zinc-400">Please wait for network confirmation</p>
          </div>,
          {
            style: {
              background: '#1A1A1A',
              border: '1px solid rgba(201, 151, 51, 0.1)',
            }
          }
        );
        // Still refresh votes as the transaction might have gone through
        await fetchVotes();
        setSelectedOption(null);
      } else {
        toast.error(
          <div className="flex flex-col space-y-2">
            <p className="font-medium text-white">Error</p>
            <p className="text-sm text-zinc-400">Something went wrong. Please try again.</p>
          </div>,
          {
            style: {
              background: '#1A1A1A',
              border: '1px solid rgba(201, 151, 51, 0.1)',
            }
          }
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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
          className: 'my-toast-class',
        }}
      />
      <div className="h-full overflow-auto">
        <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            <div className="bg-[#1A1A1A]/80 backdrop-blur-sm rounded-3xl border border-zinc-800 shadow-xl p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-bold text-white">Who do you want the next fighters to be?</h2>
                <p className="text-sm sm:text-base text-zinc-400">Select your preferred fighters and token to vote with.</p>
                <div className="flex items-center gap-2 mt-2">
                  <p className="text-xs sm:text-sm text-[#C99733]">Vote with:</p>
                  <div className="flex gap-2">
                    {Object.entries(TOKENS).map(([key, token]) => ( 
                      <button
                        key={key}
                        onClick={() => setSelectedToken(key as 'RARE' | 'BOD' | 'ONE')}
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
                        <span className="font-medium">{token.voteAmount}</span>
                        <span className="hidden md:flex">{token.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {[
                  { option: 1, name: "Beniamin Mincu" },
                  { option: 2, name: "Mihai XOXNO" },
                  { option: 3, name: "Stephen" },
                  { option: 4, name: "Longin ONEDEX" }
                ].map((fighter, index) => {
                  const vote = votes.find(v => v.option === fighter.option) || { total_votes: 0 };
                  const percentage = totalVotes > 0 ? (vote.total_votes / totalVotes) * 100 : 0;
                  const isSelected = selectedOption === fighter.option;

                  return (
                    <div
                      key={fighter.option}
                      onClick={() => !isSubmitting && setSelectedOption(fighter.option)}
                      className={`w-full p-1 rounded-xl border-2 transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-[#C99733] bg-gradient-to-r from-[#C99733]/10 to-[#FFD163]/10' 
                          : 'border-zinc-800 hover:border-[#C99733]/50'
                      }`}
                    >
                      <img src={`/img/option${fighter.option}.png`} alt={`Option ${fighter.option}`} className="hidden md:w-12 md:h-12 md:mr-2" />
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                        
                          <span className="text-white font-medium">{fighter.name}</span>
                          <span className="text-zinc-400">{percentage.toFixed(1)}%</span>
                        </div>
                        <div className="relative h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.5 }}
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#C99733] to-[#FFD163]"
                          />
                        </div>
                        <div className="text-sm text-zinc-400 text-right">
                          {vote.total_votes} votes
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 relative z-50">
                <button
                  onClick={handleVote}
                  disabled={!selectedOption || !isLoggedIn || isSubmitting}
                  className={`w-full h-12 rounded-xl font-medium transition-all relative z-50 ${
                    !selectedOption || !isLoggedIn || isSubmitting
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-[#C99733] to-[#FFD163] text-black hover:opacity-90'
                  }`}
                >
                  {!isLoggedIn 
                    ? 'Connect Wallet to Vote'
                    : isSubmitting
                    ? 'Submitting...'
                    : selectedOption
                    ? `Vote with ${TOKENS[selectedToken].voteAmount} ${selectedToken}`
                    : 'Select an Option'}
                </button>
              </div>

              <div className="text-center text-sm text-zinc-500 relative z-40">
                Total Votes: {totalVotes}
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-zinc-500">Balance:</span>
                {isLoadingRare || isLoadingBod || isLoadingOne ? (
                  <span className="text-zinc-400">Loading...</span>
                ) : (
                  <span className="text-white font-medium">
                    {(selectedToken === 'RARE' ? rareBalance : 
                     selectedToken === 'BOD' ? bodBalance :
                     oneBalance).toFixed(2)} {selectedToken}
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