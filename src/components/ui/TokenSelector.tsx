import { useState } from 'react';
import Image from 'next/image';
import { Token } from '@/core/ashswap';

interface TokenSelectorProps {
  value: Token | null;
  onChange: (token: Token) => void;
  label: string;
}

export const AVAILABLE_TOKENS: Token[] = [
  {
    identifier: 'USDC-c76f1f',
    name: 'USDC',
    ticker: 'USDC',
    decimals: 6,
  },
  {
    identifier: 'WEGLD-bd4d79',
    name: 'Wrapped EGLD',
    ticker: 'WEGLD',
    decimals: 18,
  },
  {
    identifier: 'ASH-a642d1',
    name: 'AshSwap Token',
    ticker: 'ASH',
    decimals: 18,
  },
  {
    identifier: 'BOD-3e2e7f',
    name: 'Blood of Dragons',
    ticker: 'BOD',
    decimals: 18,
  },
  {
    identifier: 'RARE-99e8b0',
    name: 'RARE',
    ticker: 'RARE',
    decimals: 18,
  }
];

export function TokenSelector({ value, onChange, label }: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-zinc-400 mb-2">{label}</label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 rounded-xl bg-[#1A1A1A] border border-zinc-800 text-white hover:border-[#C99733] transition-colors"
      >
        {value ? (
          <div className="flex items-center gap-2">
            <Image
              src={`https://tools.multiversx.com/assets-cdn/tokens/${value.identifier}/icon.svg`}
              alt={value.name}
              width={24}
              height={24}
              className="rounded-full"
            />
            <span>{value.name}</span>
          </div>
        ) : (
          <span>Select Token</span>
        )}
        <svg
          className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute mt-2 w-full z-50 bg-[#1A1A1A] border border-zinc-800 rounded-xl shadow-xl overflow-hidden">
            {AVAILABLE_TOKENS.map((token) => (
              <button
                key={token.identifier}
                onClick={() => {
                  onChange(token);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 p-3 hover:bg-gradient-to-r from-[#C99733]/20 to-[#FFD163]/20 text-white transition-colors"
              >
                <Image
                  src={`https://tools.multiversx.com/assets-cdn/tokens/${token.identifier}/icon.svg`}
                  alt={token.name}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
                <div className="text-left">
                  <div className="font-medium">{token.name}</div>
                  <div className="text-sm text-zinc-400">{token.ticker}</div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
} 