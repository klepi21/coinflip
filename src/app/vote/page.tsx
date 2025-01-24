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
    if (!selectedOption || !isLoggedIn) return;

    try {
      setIsSubmitting(true);

      const { sessionId } = await sendTransactions({
        transactions: [{
          value: '0',
          data: `vote@${selectedOption}`,
          receiver: SC_ADDRESS,
          gasLimit: 10000000,
        }],
        transactionsDisplayInfo: {
          processingMessage: 'Processing vote...',
          errorMessage: 'An error occurred while voting',
          successMessage: 'Vote submitted successfully!'
        }
      });

      await new Promise(resolve => setTimeout(resolve, 1000));
      await refreshAccount();
      await fetchVotes();
      setSelectedOption(null);
    } catch (error) {
      console.error('Error submitting vote:', error);
      toast.error('Failed to submit vote');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="bg-[#1A1A1A] rounded-3xl border border-zinc-800 shadow-xl p-6 space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Current Poll</h2>
            <p className="text-zinc-400">Select an option to cast your vote</p>
          </div>

          <div className="space-y-4">
            {votes.map((vote) => {
              const percentage = totalVotes > 0 ? (vote.total_votes / totalVotes) * 100 : 0;
              const isSelected = selectedOption === vote.option;

              return (
                <button
                  key={vote.option}
                  onClick={() => setSelectedOption(vote.option)}
                  disabled={isSubmitting}
                  className={`w-full p-4 rounded-xl border-2 transition-all ${
                    isSelected 
                      ? 'border-[#C99733] bg-gradient-to-r from-[#C99733]/10 to-[#FFD163]/10' 
                      : 'border-zinc-800 hover:border-[#C99733]/50'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-medium">Option {vote.option}</span>
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
                </button>
              );
            })}
          </div>

          <div className="pt-4">
            <button
              onClick={handleVote}
              disabled={!selectedOption || !isLoggedIn || isSubmitting}
              className={`w-full h-12 rounded-xl font-medium transition-all ${
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

          <div className="text-center text-sm text-zinc-500">
            Total Votes: {totalVotes}
          </div>
        </div>
      </motion.div>
    </div>
  );
} 