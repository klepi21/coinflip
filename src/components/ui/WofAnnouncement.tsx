'use client'

import { HeroPill } from "@/components/ui/hero-pill"

export function WofAnnouncement() {
  return (
    <div className="flex justify-center w-full mb-6 relative z-50">
      <HeroPill 
        href="/wof"
        label="Wheel of FOMO just landed! Try it now"
        announcement="🎡 New Game"
        className="bg-[#C99733]/20 ring-[#FFD163] [&_div]:bg-[#FFD163] [&_div]:text-black [&_p]:text-[#FFD163] [&_svg_path]:fill-[#FFD163] hover:scale-105 transition-transform"
      />
    </div>
  )
} 