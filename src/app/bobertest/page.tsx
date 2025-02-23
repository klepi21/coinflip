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
  AddressValue
} from "@multiversx/sdk-core";
import { useGetNetworkConfig } from "@multiversx/sdk-dapp/hooks";

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
  const { network } = useGetNetworkConfig();
  const [activeGames, setActiveGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const decodeGameData = (data: string[]): Game[] => {
    const games: Game[] = [];
    
    // Process pairs of data (id and game data)
    for (let i = 0; i < data.length; i += 2) {
      try {
        // Decode game ID (base64)
        const idBuffer = Buffer.from(data[i], 'base64');
        const id = parseInt(idBuffer.toString('hex'), 16);

        // Decode game data (base64)
        const gameDataBuffer = Buffer.from(data[i + 1], 'base64');
        
        // Debug the raw buffer
        console.log('Raw buffer:', Array.from(gameDataBuffer));
        
        // Skip the first 8 bytes (game id)
        let offset = 8;
        
        // Read token length (4 bytes)
        const tokenLength = gameDataBuffer.readUInt32BE(offset);
        offset += 4;

        // Skip the extra byte that indicates token length again
        offset += 1;

        // Read token identifier until null terminator
        let tokenEnd = offset;
        while (tokenEnd < gameDataBuffer.length && gameDataBuffer[tokenEnd] !== 0) {
          tokenEnd++;
        }
        const token = gameDataBuffer.slice(offset, tokenEnd).toString('utf8');
        offset = tokenEnd + 1; // Skip the null terminator

        // Choice is 1 byte
        const choice = gameDataBuffer[offset] === 0 ? "HEADS" : "TAILS";
        offset += 1;

        // Value is 32 bytes - need to handle as little endian
        const valueBytes = gameDataBuffer.slice(offset, offset + 32);
        
        // Convert to hex string maintaining byte order
        const valueHex = Array.from(valueBytes)
          .map((byte, index) => ({byte, index}))
          .sort((a, b) => a.index - b.index)
          .map(({byte}) => byte.toString(16).padStart(2, '0'))
          .join('');
        
        // Convert to decimal string
        const valueBigInt = BigInt('0x' + valueHex);
        const value = valueBigInt.toString();
        
        // Convert to token units
        const decimals = TOKEN_DECIMALS[token] || 18;
        const valueShort = Number(valueBigInt) / Math.pow(10, decimals);
        
        offset += 32;

        // Creator is the last 32 bytes
        const creatorBytes = gameDataBuffer.slice(offset, offset + 32);
        // Convert to bech32 address
        const creatorHex = Buffer.from(creatorBytes).toString('hex').replace(/0+$/, '');
        const creator = `erd1${creatorHex}`;

        // Debug logging
        console.log('Decoded game:', {
            id,
            token,
            choice,
            value,
            valueShort,
            creator,
            rawBuffer: gameDataBuffer,
            valueBytes: Array.from(valueBytes),
            valueHex
        });

        games.push({
          id,
          choice,
          token,
          value,
          valueShort,
          creator,
          creatorUsername: "@unknown",
          creatorProfile: "https://media.xoxno.com/utils/defaultProfilePic.webp"
        });
      } catch (error) {
        console.error('Error decoding game data:', error);
      }
    }

    return games;
  };

  const fetchActiveGames = async () => {
    try {
      setIsLoading(true);
      const provider = new ProxyNetworkProvider(network.apiAddress);
      const contract = new SmartContract({
        address: new Address(SC_ADDRESS),
      });

      const query = contract.createQuery({
        func: new ContractFunction("activeGames"),
      });

      const queryResponse = await provider.queryContract(query);
      console.log('Raw contract response:', queryResponse?.returnData);
      
      if (queryResponse?.returnData) {
        const decodedGames = decodeGameData(queryResponse.returnData);
        console.log('Final decoded games:', decodedGames);
        setActiveGames(decodedGames);
      }
    } catch (error) {
      console.error('Error fetching active games:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveGames();
    // Refresh every 10 seconds
    const interval = setInterval(fetchActiveGames, 10000);
    return () => clearInterval(interval);
  }, [network.apiAddress]);

  return (
    <div className="min-h-screen bg-black pt-[80px]">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-[#1A1A1A] rounded-2xl p-6 shadow-xl border border-zinc-800">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-white">Active Games</h1>
            <div className="text-zinc-400">
              {activeGames.length} active game{activeGames.length !== 1 ? 's' : ''}
            </div>
          </div>
          
          {isLoading ? (
            <div className="text-zinc-400">Loading active games...</div>
          ) : activeGames.length > 0 ? (
            <div className="space-y-4">
              <div className="grid gap-4">
                {activeGames.map((game) => (
                  <div 
                    key={game.id}
                    className="bg-black/30 rounded-xl p-4 border border-zinc-800 hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-zinc-400">Game #{game.id}</div>
                        <div className="text-white font-medium mt-1">
                          {game.valueShort.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 3
                          })} {game.token}
                        </div>
                        <div className="text-zinc-400 mt-2">
                          Choice: <span className="text-[#FFD163]">{game.choice}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-zinc-400">Creator</div>
                        <div className="text-white font-medium mt-1">
                          {game.creator.slice(0, 6)}...{game.creator.slice(-4)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-zinc-400">No active games found</div>
          )}
        </div>
      </div>
    </div>
  );
} 