'use client';

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { RetroGrid } from '@/components/ui/retro-grid';
import Image from "next/image";
import { useWallet } from '@/context/WalletContext';
import { toast, Toaster } from 'sonner';
import { 
  AbiRegistry, 
  SmartContract, 
  Address,
  ResultsParser,
  ContractFunction,
  AddressValue,
  TokenPayment
} from "@multiversx/sdk-core";
import { useGetNetworkConfig } from "@multiversx/sdk-dapp/hooks";
import { ProxyNetworkProvider } from "@multiversx/sdk-network-providers";
import { sendTransactions } from "@multiversx/sdk-dapp/services";
import { refreshAccount } from "@multiversx/sdk-dapp/utils/account";
import flipcoinAbi from '@/config/flipcoin.abi.json';
import { FaucetComponent } from '@/components/ui/faucet';

// Constants
const SC_ADDRESS = 'erd1qqqqqqqqqqqqqpgqwpmgzezwm5ffvhnfgxn5uudza5mp7x6jfhwsh28nqx';
const ADMIN_ADDRESSES = [
  'erd12xqam5lxx6xeteaewx25xarqd3ypleetkv35w40nuqchsxqar9zqkslg66',
  'erd19dgrdm4md8yc7lhvrpgwnnpkzfwlglht8xv6c5nv9lvclx9kp62q2fcjzh',
  'erd1u5p4njlv9rxvzvmhsxjypa69t2dran33x9ttpx0ghft7tt35wpfsxgynw4'
];
const RARE_IDENTIFIER = 'RARE-99e8b0';

interface FaucetInfo {
  token: string;
  amount: string;
  has_enough_balance: boolean;
  can_claim: boolean;
}

interface NetworkStats {
  roundsPassed: number;
  roundsPerEpoch: number;
}

export default function Faucet() {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [faucetInfo, setFaucetInfo] = useState<FaucetInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { isLoggedIn, address } = useWallet();
  const { network } = useGetNetworkConfig();
  const [depositAmount, setDepositAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [networkStats, setNetworkStats] = useState<NetworkStats | null>(null);
  const [countdown, setCountdown] = useState<string>('');

  const fetchFaucetInfo = async () => {
    if (!address) return;

    try {
      const provider = new ProxyNetworkProvider(network.apiAddress);
      const contract = new SmartContract({
        address: new Address(SC_ADDRESS),
        abi: AbiRegistry.create(flipcoinAbi)
      });

      const query = contract.createQuery({
        func: new ContractFunction("getFaucetInfo"),
        args: [new AddressValue(new Address(address))]
      });

      const queryResponse = await provider.queryContract(query);
      const endpointDefinition = contract.getEndpoint("getFaucetInfo");
      const { values } = new ResultsParser().parseQueryResponse(queryResponse, endpointDefinition);
      
      const info = values[0].valueOf();
      setFaucetInfo({
        token: info.token.toString(),
        amount: info.amount.toString(),
        has_enough_balance: info.has_enough_balance,
        can_claim: info.can_claim
      });
    } catch (error) {
      console.error('Error fetching faucet info:', error);
      toast.error('Failed to fetch faucet information');
    }
  };

  const fetchNetworkStats = async () => {
    try {
      const response = await fetch('https://api.multiversx.com/stats');
      const data = await response.json();
      setNetworkStats({
        roundsPassed: data.roundsPassed,
        roundsPerEpoch: data.roundsPerEpoch
      });
    } catch (error) {
      console.error('Error fetching network stats:', error);
    }
  };

  const calculateTimeLeft = () => {
    if (timeLeft === null) return;
    
    const hours = Math.floor(timeLeft / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    const seconds = timeLeft % 60;

    return {
      hours: hours.toString().padStart(2, '0'),
      minutes: minutes.toString().padStart(2, '0'),
      seconds: seconds.toString().padStart(2, '0')
    };
  };

  const calculateCountdown = () => {
    if (!networkStats) return;

    const roundsLeft = networkStats.roundsPerEpoch - networkStats.roundsPassed;
    const secondsLeft = roundsLeft * 6;
    
    const hours = Math.floor(secondsLeft / 3600);
    const minutes = Math.floor((secondsLeft % 3600) / 60);
    const seconds = secondsLeft % 60;

    setCountdown(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
  };

  useEffect(() => {
    if (address) {
      fetchFaucetInfo();
    }
  }, [address, network.apiAddress]);

  useEffect(() => {
    fetchNetworkStats();
    const interval = setInterval(() => {
      fetchNetworkStats();
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (networkStats) {
      calculateCountdown();
      const interval = setInterval(calculateCountdown, 1000);
      return () => clearInterval(interval);
    }
  }, [networkStats]);

  useEffect(() => {
    if (timeLeft === null) return;

    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime === null || prevTime <= 0) return null;
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleClaim = async () => {
    if (!isLoggedIn || !faucetInfo?.can_claim || !faucetInfo?.has_enough_balance) return;

    try {
      setIsLoading(true);
      
      // Show loading toast
      const loadingToastId = toast.loading(
        <div className="flex flex-col space-y-2">
          <p className="font-medium text-white">Processing Claim...</p>
          <p className="text-sm text-zinc-400">Please wait while we process your claim</p>
        </div>,
        {
          style: {
            background: '#1A1A1A',
            border: '1px solid rgba(201, 151, 51, 0.1)',
          }
        }
      );

      const contract = new SmartContract({
        address: new Address(SC_ADDRESS),
        abi: AbiRegistry.create(flipcoinAbi)
      });

      const transaction = {
        value: '0',
        data: 'claim',
        receiver: SC_ADDRESS,
        gasLimit: 70000000,
      };

      const { sessionId } = await sendTransactions({
        transactions: [transaction],
        transactionsDisplayInfo: {
          processingMessage: 'Processing claim transaction',
          errorMessage: 'An error occurred during claiming',
          successMessage: 'Claim successful'
        }
      });

      if (sessionId) {
        // Wait for initial blockchain confirmation
        await new Promise(resolve => setTimeout(resolve, 15000));
        await refreshAccount();

        // Additional wait to ensure smart contract state is updated
        await new Promise(resolve => setTimeout(resolve, 4000));

        // Dismiss loading toast and show success toast
        toast.dismiss(loadingToastId);
        toast.success(
          <div className="flex flex-col space-y-2">
            <p className="font-medium text-white">Claim Successful!</p>
            <p className="text-sm text-zinc-400">Your tokens have been sent to your wallet.</p>
          </div>,
          {
            style: {
              background: '#1A1A1A',
              border: '1px solid rgba(201, 151, 51, 0.1)',
            },
            duration: 5000,
          }
        );

        // Refresh faucet info to update UI
        await fetchFaucetInfo();
      }
    } catch (error) {
      console.error('Claim error:', error);
      toast.error(
        <div className="flex flex-col space-y-2">
          <p className="font-medium text-white">Claim Failed</p>
          <p className="text-sm text-zinc-400">Please try again later.</p>
        </div>,
        {
          style: {
            background: '#1A1A1A',
            border: '1px solid rgba(201, 151, 51, 0.1)',
          }
        }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!isLoggedIn || !depositAmount) {
      toast.error('Please enter an amount');
      return;
    }

    try {
      setIsDepositing(true);
      const contract = new SmartContract({
        address: new Address(SC_ADDRESS),
        abi: AbiRegistry.create(flipcoinAbi)
      });

      const payment = TokenPayment.fungibleFromAmount(
        RARE_IDENTIFIER,
        depositAmount,
        18
      );
      
      const transaction = contract.methods
        .deposit([])
        .withSingleESDTTransfer(payment)
        .withGasLimit(6000000)
        .withChainID(network.chainId)
        .buildTransaction();

      const { sessionId } = await sendTransactions({
        transactions: [transaction],
        transactionsDisplayInfo: {
          processingMessage: 'Processing deposit transaction',
          errorMessage: 'An error occurred during deposit',
          successMessage: 'Successfully deposited tokens!'
        }
      });

      if (sessionId) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await refreshAccount();
        await fetchFaucetInfo();
        setDepositAmount('');
      }
    } catch (error) {
      console.error('Error depositing:', error);
      toast.error('Failed to deposit tokens');
    } finally {
      setIsDepositing(false);
    }
  };

  return (
    <main className="flex-1">
      <FaucetComponent />
    </main>
  );
} 