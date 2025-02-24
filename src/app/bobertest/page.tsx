'use client';

import { useState, useEffect } from "react";
import { ProxyNetworkProvider } from "@multiversx/sdk-network-providers";
import { 
  AbiRegistry, 
  SmartContract, 
  Address,
  ResultsParser,
  ContractFunction,
  BytesValue,
  U64Value,
  TokenIdentifierValue,
  BigUIntValue,
  AddressValue,
  TokenPayment
} from "@multiversx/sdk-core";
import { useGetNetworkConfig, useGetAccountInfo } from "@multiversx/sdk-dapp/hooks";
import { sendTransactions } from "@multiversx/sdk-dapp/services";
import { refreshAccount } from "@multiversx/sdk-dapp/utils/account";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import Create from '@/components/ui/create';
import BoberGrid from '@/components/ui/BoberGrid';

// Constants
const SC_ADDRESS = 'erd1qqqqqqqqqqqqqpgqwtt3pune4g0ayaykvmg6nvr4ls045lr7gm9s2fj2al';

// Token decimals mapping
const TOKEN_DECIMALS: { [key: string]: number } = {
  'EGLD': 18,
  'BOBER-9eb764': 18,
  'BATEMAN-f6fd19': 18,
  'RARE-99e8b0': 18,
  'BOD-204877': 18,
  'TOM-48414f': 18,
  'VILLER-cab1fb': 18
};

interface Game {
  id: number;
  choice: string;
  token: string;
  value: string;
  valueShort: number;
  creator: string;
  creatorUsername?: string;
  creatorProfile?: string;
}

export default function BoberTest() {
  const [activeGames, setActiveGames] = useState<number>(0);

  return (
    <div className="min-h-screen bg-black pt-[80px]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Half - Create Game */}
          <div className="w-full md:w-1/3">
            <Create />
          </div>

          {/* Right Half - Game Grid */}
          <div className="w-full md:w-2/3">
            <BoberGrid onActiveGamesChange={setActiveGames} />
          </div>
        </div>
      </div>
    </div>
  );
} 