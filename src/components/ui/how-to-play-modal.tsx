'use client'

import React from 'react';
import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal = ({ isOpen, onClose }: HowToPlayModalProps) => {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto w-full max-w-[340px] rounded-xl bg-gradient-to-r from-[#C99733] to-[#FFD163] p-4 shadow-xl border-2 border-black">
          <div className="flex justify-between items-center mb-3">
            <Dialog.Title className="text-lg font-bold text-black">How to Play</Dialog.Title>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-black/10 hover:bg-black/20 transition-colors"
            >
              <X className="h-4 w-4 text-black" />
            </button>
          </div>

          <div className="space-y-3 text-black">
            <div className="space-y-1">
              <h3 className="font-semibold text-base">👋 Welcome to MINCU Fight!</h3>
            </div>

            <div className="space-y-2">
              <div className="p-2.5 bg-black/10 rounded-lg border border-black/20">
                <h4 className="font-semibold text-sm">1. Create or Join a Game 🎮</h4>
                <p className="mt-0.5 text-sm">
                  • Create: Set bet amount & pick side<br/>
                  • Join: Find an open game & join<br/>
                  • Have enough MINCU ready!
                </p>
              </div>

              <div className="p-2.5 bg-black/10 rounded-lg border border-black/20">
                <h4 className="font-semibold text-sm">2. The Game Process 🤝</h4>
                <p className="mt-0.5 text-sm">
                  • Creator: Wait for opponent<br/>
                  • Joiner: Game starts instantly<br/>
                  • Winner picked randomly
                </p>
              </div>

              <div className="p-2.5 bg-black/10 rounded-lg border border-black/20">
                <h4 className="font-semibold text-sm">3. Rewards 💰</h4>
                <p className="mt-0.5 text-sm">
                  • Win = 1.95x your bet<br/>
                  • Example: 1000 → 1950 MINCU<br/>
                  • Auto-sent to your wallet
                </p>
              </div>
            </div>

            <div className="p-2.5 bg-black/20 rounded-lg border border-black/20">
              <p className="font-semibold text-sm">💡 Tips:</p>
              <ul className="mt-0.5 space-y-0.5 text-sm">
                <li>• Can cancel if no one joined</li>
                <li>• Higher bets = bigger wins</li>
                <li>• Keep enough MINCU ready</li>
              </ul>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}; 