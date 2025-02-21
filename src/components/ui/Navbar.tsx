"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Coins, Vote, Home, Gamepad2, Wallet, Trophy, Menu } from "lucide-react"
import type { LucideIcon } from 'lucide-react'
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"
import { AnimeNavBar } from './anime-navbar'
import { useWallet } from '@/context/WalletContext'
import { WalletConnectModal } from '@/components/wallet/WalletConnectModal'

interface NavItem {
  name: string
  url: string
  icon: LucideIcon
  disabled?: boolean
  badge?: string
}

interface NavBarProps {
  items: NavItem[]
  className?: string
  activeTextColor?: string
}

const items = [
  {
    name: "Home",
    url: "/",
    icon: Home,
  },
  {
    name: "Games",
    url: "/games",
    icon: Gamepad2,
  },
  {
    name: "Vote",
    url: "/votetoken",
    icon: Trophy,
  },
  {
    name: "Wallet",
    url: "#",
    icon: Wallet,
  },
];

export default function Navbar() {
  const pathname = usePathname();
  const { isLoggedIn } = useWallet();
  const [showWalletModal, setShowWalletModal] = useState(false);

  const defaultActive = pathname === "/" ? "Home" : 
                       pathname === "/games" ? "Games" :
                       pathname === "/votetoken" ? "Vote" : "Home";

  return (
    <>
      <AnimeNavBar items={items} defaultActive={defaultActive} />
      <WalletConnectModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
      />
    </>
  );
} 