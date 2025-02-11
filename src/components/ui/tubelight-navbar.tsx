"use client"

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"

interface NavItem {
  name: string
  url: string
  icon: LucideIcon
}

interface NavBarProps {
  items: NavItem[]
  className?: string
  activeTextColor?: string
}

export function NavBar({ items, className, activeTextColor = 'text-black' }: NavBarProps) {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState(items[0].name);
  const [isMobile, setIsMobile] = useState(false);

  // Set active tab based on current pathname
  useEffect(() => {
    const currentItem = items.find(item => item.url === pathname);
    if (currentItem) {
      setActiveTab(currentItem.name);
    }
  }, [pathname, items]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      className={cn(
        "fixed bottom-0 sm:top-0 left-1/2 -translate-x-1/2 z-50 mb-6 sm:pt-6",
        className,
      )}
    >
      <div className="flex items-center gap-3 bg-white/5 border border-white/10 backdrop-blur-lg py-1 px-1 rounded-full shadow-lg">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.name

          return (
            <Link
              key={item.name}
              href={item.url}
              onClick={() => setActiveTab(item.name)}
              className={cn(
                "relative cursor-pointer text-sm font-semibold px-6 py-2 rounded-full transition-colors",
                "text-white/80 hover:text-white",
                isActive && "bg-gradient-to-r from-[#C99733] to-[#FFD163]",
                isActive && activeTextColor,
              )}
            >
              <span className="hidden md:inline">{item.name}</span>
              <span className="md:hidden">
                <Icon size={18} strokeWidth={2.5} />
              </span>
              {isActive && (
                <motion.div
                  layoutId="lamp"
                  className="absolute inset-0 w-full bg-black/5 rounded-full -z-10"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                >
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-black rounded-t-full">
                    <div className="absolute w-12 h-6 bg-black/20 rounded-full blur-md -top-2 -left-2" />
                    <div className="absolute w-8 h-6 bg-black/20 rounded-full blur-md -top-1" />
                    <div className="absolute w-4 h-4 bg-black/20 rounded-full blur-sm top-0 left-2" />
                  </div>
                </motion.div>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export function TubelightNav() {
  const pathname = usePathname();

  return (
    <nav className="relative flex items-center justify-center gap-4 h-10 bg-black/50 rounded-full border border-zinc-800 px-1 min-w-[600px]">
      <div className="absolute inset-x-0 h-8 top-1/2 -translate-y-1/2 mx-1">
        <div
          className={`absolute h-full bg-gradient-to-r from-[#C99733] to-[#FFD163] rounded-full transition-all duration-300 ${
            pathname === '/' ? 'left-0 w-[calc(20%-3px)]' : 
            pathname === '/vote' ? 'left-[20%] w-[calc(20%-3px)]' : 
            pathname === '/votetoken' ? 'left-[40%] w-[calc(20%-3px)]' :
            pathname === '/faucet' ? 'left-[60%] w-[calc(20%-3px)]' :
            'left-[80%] w-[calc(20%-3px)]'
          }`}
        />
      </div>

      <Link
        href="/"
        className={`relative z-10 px-4 py-2 text-sm font-medium transition-colors text-center w-1/5 whitespace-nowrap ${
          pathname === '/' ? 'text-black' : 'text-white hover:text-zinc-300'
        }`}
      >
        Fight
      </Link>
      <Link
        href="/vote"
        className={`relative z-10 px-4 py-2 text-sm font-medium transition-colors text-center w-1/5 whitespace-nowrap ${
          pathname === '/vote' ? 'text-black' : 'text-white hover:text-zinc-300'
        }`}
      >
        Vote Fighter
      </Link>
      <Link
        href="/votetoken"
        className={`relative z-10 px-4 py-2 text-sm font-medium transition-colors text-center w-1/5 whitespace-nowrap ${
          pathname === '/votetoken' ? 'text-black' : 'text-white hover:text-zinc-300'
        }`}
      >
        Vote Token
      </Link>
      <Link
        href="/faucet"
        className={`relative z-10 px-4 py-2 text-sm font-medium transition-colors text-center w-1/5 whitespace-nowrap ${
          pathname === '/faucet' ? 'text-black' : 'text-white hover:text-zinc-300'
        }`}
      >
        Faucet
      </Link>
      <div className="relative w-1/5">
        <Link
          href="/stats"
          className="relative z-10 px-4 py-2 text-sm font-medium text-zinc-500 cursor-not-allowed text-center block whitespace-nowrap"
          onClick={(e) => e.preventDefault()}
        >
          Stats
          <div className="absolute -top-1 -right-1">
            <div className="bg-[#C99733] text-black text-[10px] px-1 rounded-full">
              SOON
            </div>
          </div>
        </Link>
      </div>
    </nav>
  );
} 