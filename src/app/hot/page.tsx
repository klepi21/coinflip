'use client';

import { Button } from "@/components/ui/button";
import { useState } from "react";
import Create from "@/components/ui/create";
import GameGrid from "@/components/ui/GameGrid";
import { AnimatedText } from "@/components/ui/animated-underline-text-one";

export default function Home() {
  const [showBetSheet, setShowBetSheet] = useState(false);

  return (
    <main className="flex flex-col bg-black px-6 pt-24">
      <div className="w-full max-w-7xl mx-auto">
        {/* Title Section */}
        <div className="flex flex-col items-center mb-12">
          <AnimatedText 
            text="HEADS OR TAILS"
            textClassName="text-4xl md:text-7xl font-bold text-white tracking-wider"
            underlineClassName="text-[#75CBDD]"
            underlinePath="M 0,10 Q 150,0 300,10 Q 450,20 600,10"
            underlineHoverPath="M 0,10 Q 150,20 300,10 Q 450,0 600,10"
            className="w-full md:w-[600px]"
          />
        </div>

        {/* Create Room Button - Only visible on mobile */}
        <Button 
          className="w-full max-w-md py-6 text-lg font-semibold bg-[#75CBDD] hover:bg-[#75CBDD]/90 text-black rounded-full mb-6 md:hidden mx-auto"
          onClick={() => setShowBetSheet(true)}
        >
          create a game
        </Button>

        {/* Stats Section - Only visible on desktop */}
        <div className="hidden md:block mb-8">
          <div className="flex gap-4 mb-4">
            <div className="bg-[#1A1A1A] rounded-full px-8 py-3 border border-zinc-800">
              <span className="text-white font-bold text-xl">16 ACTIVE GAMES</span>
            </div>
            <div className="bg-[#1A1A1A] rounded-full px-8 py-3 border border-zinc-800">
              <span className="text-white font-bold text-xl">211,829 GAMES PLAYED</span>
            </div>
          </div>
        </div>

        {/* Main Content - Split Screen */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Half - Create Game */}
          <div className="w-full md:w-1/3">
            <Create />
          </div>

          {/* Right Half - Game Grid */}
          <div className="w-full md:w-2/3">
            <GameGrid />
          </div>
        </div>
      </div>
    </main>
  );
}