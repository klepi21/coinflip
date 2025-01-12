'use client'

import React from 'react';
import Link from 'next/link';
import { Cpu } from 'lucide-react';

export const Logo = () => {
  return (
    <Link 
      href="/" 
      className="flex items-center gap-2 text-xl font-bold text-stone-900 dark:text-white hover:opacity-90 transition-opacity"
    >
      <Cpu className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
      <span className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 text-transparent bg-clip-text">
        Cryptomurmura 2.0
      </span>
    </Link>
  );
};