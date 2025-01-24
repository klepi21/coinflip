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
import { toast } from "sonner";
import flipcoinAbi from '@/config/flipcoin.abi.json';
import { useWallet } from '@/context/WalletContext';
import { RetroGrid } from '@/components/ui/retro-grid';

// Constants
const SC_ADDRESS = 'erd1qqqqqqqqqqqqqpgqwpmgzezwm5ffvhnfgxn5uudza5mp7x6jfhwsh28nqx';

interface VoteOption {
  option: number;
  total_votes: number;
}

export default function Vote() {
  const [votes, setVotes] = useState<VoteOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalVotes, setTotalVotes] = useState(0);
  const { network } = useGetNetworkConfig();
  const { address } = useGetAccountInfo();
  const { isLoggedIn } = useWallet();

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

    try {
      setIsSubmitting(true);
      
      // RARE token identifier and amount (10 RARE)
      const rareTokenId = 'RARE-99e8b0';
      const amount = '10'; // Just 10 RARE
      
      // Create ESDTTransfer transaction data
      const encodedTokenId = Buffer.from(rareTokenId).toString('hex');
      const data = `ESDTTransfer@${encodedTokenId}@8ac7230489e80000@766f7465@0${selectedOption.toString(16)}`;

      const transaction = {
        value: '0',
        data: data,
        receiver: SC_ADDRESS,
        gasLimit: 10000000,
      };

      console.log('Sending transaction:', transaction);

      const { sessionId } = await sendTransactions({
        transactions: [transaction],
        transactionsDisplayInfo: {
          processingMessage: 'Processing vote transaction...',
          errorMessage: 'An error occurred during voting',
          successMessage: 'Vote submitted successfully!'
        },
        redirectAfterSign: false
      });

      if (sessionId) {
        toast.success('Transaction signed! Processing vote...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        await refreshAccount();
        await fetchVotes();
        setSelectedOption(null);
      }
    } catch (error) {
      console.error('Error submitting vote:', error);
      toast.error('Failed to submit vote. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative h-screen overflow-hidden bg-black">
      <RetroGrid />
      <div className="h-full overflow-auto">
        <div className="container max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="bg-[#1A1A1A]/80 backdrop-blur-sm rounded-3xl border border-zinc-800 shadow-xl p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-bold text-white">Who do you want the next fighter to be?</h2>
                <p className="text-sm sm:text-base text-zinc-400">Select your preferred fighter. You can vote as many times as you like!</p>
                <p className="text-xs sm:text-sm text-[#C99733] mt-2">Each vote costs 10 RARE tokens</p>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {[
                  { option: 1, name: "Beniamin Mincu" },
                  { option: 2, name: "Mihai XOXNO" },
                  { option: 3, name: "Stephan" },
                  { option: 4, name: "Lucian Mincu" }
                ].map((fighter, index) => {
                  const vote = votes.find(v => v.option === fighter.option) || { total_votes: 0 };
                  const percentage = totalVotes > 0 ? (vote.total_votes / totalVotes) * 100 : 0;
                  const isSelected = selectedOption === fighter.option;

                  return (
                    <div
                      key={fighter.option}
                      onClick={() => !isSubmitting && setSelectedOption(fighter.option)}
                      className={`w-full p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-[#C99733] bg-gradient-to-r from-[#C99733]/10 to-[#FFD163]/10' 
                          : 'border-zinc-800 hover:border-[#C99733]/50'
                      }`}
                    >
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
                    ? 'Submit Vote'
                    : 'Select an Option'}
                </button>
              </div>

              <div className="text-center text-sm text-zinc-500 relative z-40">
                Total Votes: {totalVotes}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
} 