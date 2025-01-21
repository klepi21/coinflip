'use client'

import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal = ({ isOpen, onClose }: HowToPlayModalProps) => {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative overflow-hidden rounded-3xl bg-[#FD8803] p-8 md:p-10 
                       shadow-2xl border-2 border-black max-w-xl w-full mx-4"
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 p-2 rounded-full bg-black/10 hover:bg-black/20 transition-colors"
            >
              <X className="h-5 w-5 text-black" />
            </button>

            <div className="space-y-6">
              <Dialog.Title className="text-3xl font-bold text-black  gie">
                how to play
              </Dialog.Title>

              <div className="space-y-6">
                <div className="flex items-center gap-6 text-black  gie">
                  <span className="text-3xl">1.</span>
                  <p className="text-xl">connect your wallet</p>
                </div>
                <div className="flex items-center gap-6 text-black  gie">
                  <span className="text-3xl">2.</span>
                  <p className="text-xl">select an amount</p>
                </div>
                <div className="flex items-center gap-6 text-black  gie">
                  <span className="text-3xl">3.</span>
                  <p className="text-xl">buy and scratch tickets</p>
                </div>
                <div className="flex items-center gap-6 text-black  gie">
                  <span className="text-3xl">4.</span>
                  <p className="text-xl">if you find 3 identical symbols, you win the associated prize</p>
                </div>
                <div className="flex items-center gap-6 text-black  gie">
                  <span className="text-3xl">5.</span>
                  <p className="text-xl">if you're lucky, you can even win the Jackpot at any time!</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full bg-[#FFA036] hover:bg-[#FFA036]/80 text-black rounded-full 
                            px-8 py-4 text-xl font-semibold transition-all duration-300 
                            border-2 border-black  gie mt-8"
              >
                got it!
              </button>
            </div>
          </motion.div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}; 