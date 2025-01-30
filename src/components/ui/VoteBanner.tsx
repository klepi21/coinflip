'use client'

import { useEffect, useState } from "react"
import { Banner } from "@/components/ui/banner"
import { Button } from "@/components/ui/button"
import { Vote, X } from "lucide-react"
import Link from "next/link"

// Define the vote end dates
const fighterVoteEndDate = new Date('2025-02-14T23:59:59')
const tokenVoteEndDate = new Date('2025-02-01T22:01:00') // Fixed end date and time

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  isExpired: boolean
}

function calculateTimeLeft(endDate: Date): TimeLeft {
  const now = new Date()
  const difference = endDate.getTime() - now.getTime()

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true }
  }

  const days = Math.floor(difference / (1000 * 60 * 60 * 24))
  const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((difference % (1000 * 60)) / 1000)

  return {
    days,
    hours,
    minutes,
    seconds,
    isExpired: false,
  }
}

function CountdownDisplay({ timeLeft }: { timeLeft: TimeLeft }) {
  return (
    <div className="flex items-center divide-x divide-[#C99733]/20 rounded-lg bg-gradient-to-r from-[#C99733]/10 to-[#FFD163]/10 text-sm tabular-nums">
      {timeLeft.days > 0 && (
        <span className="flex h-8 items-center justify-center p-2 text-white">
          {timeLeft.days}
          <span className="text-[#C99733]">d</span>
        </span>
      )}
      <span className="flex h-8 items-center justify-center p-2 text-white">
        {timeLeft.hours.toString().padStart(2, "0")}
        <span className="text-[#C99733]">h</span>
      </span>
      <span className="flex h-8 items-center justify-center p-2 text-white">
        {timeLeft.minutes.toString().padStart(2, "0")}
        <span className="text-[#C99733]">m</span>
      </span>
      <span className="flex h-8 items-center justify-center p-2 text-white">
        {timeLeft.seconds.toString().padStart(2, "0")}
        <span className="text-[#C99733]">s</span>
      </span>
    </div>
  )
}

export function VoteBanner() {
  const [isFighterVisible, setIsFighterVisible] = useState(true)
  const [isTokenVisible, setIsTokenVisible] = useState(true)
  const [fighterTimeLeft, setFighterTimeLeft] = useState<TimeLeft>(calculateTimeLeft(fighterVoteEndDate))
  const [tokenTimeLeft, setTokenTimeLeft] = useState<TimeLeft>(calculateTimeLeft(tokenVoteEndDate))

  useEffect(() => {
    const timer = setInterval(() => {
      setFighterTimeLeft(calculateTimeLeft(fighterVoteEndDate))
      setTokenTimeLeft(calculateTimeLeft(tokenVoteEndDate))
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  if ((!isFighterVisible && !isTokenVisible) || (fighterTimeLeft.isExpired && tokenTimeLeft.isExpired)) return null

  return (
    <div className="relative z-20 mt-[60px] -mb-10 md:-mb-20">
      <div className="container max-w-3xl mx-auto px-4">
        <div className="flex flex-col space-y-4">
          {/* Fighter Vote Banner - Temporarily Hidden */}
          {/* {isFighterVisible && !fighterTimeLeft.isExpired && (
            <Banner variant="muted" className="w-full bg-[#1A1A1A] border border-zinc-800 rounded-xl">
              <div className="flex w-full gap-2 md:items-center">
                <div className="flex grow gap-3 md:items-center">
                  <div
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#C99733]/20 to-[#FFD163]/20 max-md:mt-0.5"
                    aria-hidden="true"
                  >
                    <Vote className="text-[#C99733]" size={16} strokeWidth={2} />
                  </div>
                  <div className="flex grow flex-col justify-between gap-3 md:flex-row md:items-center">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium text-white">Vote for your next fighters!</p>
                      <p className="text-sm text-zinc-400">
                        Cast your vote and help decide the next epic battle.
                      </p>
                    </div>
                    <div className="flex gap-3 max-md:flex-wrap">
                      <CountdownDisplay timeLeft={fighterTimeLeft} />
                      <Link href="/vote">
                        <Button size="sm" className="bg-gradient-to-r from-[#C99733] to-[#FFD163] text-black whitespace-nowrap">
                          Vote Now
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  className="group -my-1.5 -me-2 size-8 shrink-0 p-0 hover:bg-transparent"
                  onClick={() => setIsFighterVisible(false)}
                  aria-label="Close banner"
                >
                  <X
                    size={16}
                    strokeWidth={2}
                    className="text-zinc-400 opacity-60 transition-opacity group-hover:opacity-100"
                    aria-hidden="true"
                  />
                </Button>
              </div>
            </Banner>
          )} */}

          {/* Token Vote Banner */}
          {isTokenVisible && !tokenTimeLeft.isExpired && (
            <Banner variant="muted" className="w-full bg-[#1A1A1A] border border-zinc-800 rounded-xl">
              <div className="flex w-full gap-2 md:items-center">
                <div className="flex grow gap-3 md:items-center">
                  <div
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#C99733]/20 to-[#FFD163]/20 max-md:mt-0.5"
                    aria-hidden="true"
                  >
                    <Vote className="text-[#C99733]" size={16} strokeWidth={2} />
                  </div>
                  <div className="flex grow flex-col justify-between gap-3 md:flex-row md:items-center">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium text-white">Vote for next token!</p>
                      <p className="text-sm text-zinc-400">
                        Choose your favorite token to be added next.
                      </p>
                    </div>
                    <div className="flex gap-3 max-md:flex-wrap">
                      <CountdownDisplay timeLeft={tokenTimeLeft} />
                      <Link href="/votetoken">
                        <Button size="sm" className="bg-gradient-to-r from-[#C99733] to-[#FFD163] text-black whitespace-nowrap">
                          Vote Now
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  className="group -my-1.5 -me-2 size-8 shrink-0 p-0 hover:bg-transparent"
                  onClick={() => setIsTokenVisible(false)}
                  aria-label="Close banner"
                >
                  <X
                    size={16}
                    strokeWidth={2}
                    className="text-zinc-400 opacity-60 transition-opacity group-hover:opacity-100"
                    aria-hidden="true"
                  />
                </Button>
              </div>
            </Banner>
          )}
        </div>
      </div>
    </div>
  )
} 