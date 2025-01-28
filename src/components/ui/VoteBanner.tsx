'use client'

import { useEffect, useState } from "react"
import { Banner } from "@/components/ui/banner"
import { Button } from "@/components/ui/button"
import { Vote, X } from "lucide-react"
import Link from "next/link"

// Define the vote end date
const voteEndDate = new Date('2025-02-14T23:59:59')

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  isExpired: boolean
}

export function VoteBanner() {
  const [isVisible, setIsVisible] = useState(true)
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  })

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date()
      const difference = voteEndDate.getTime() - now.getTime()

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true })
        return
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      setTimeLeft({
        days,
        hours,
        minutes,
        seconds,
        isExpired: false,
      })
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [])

  if (!isVisible || timeLeft.isExpired) return null

  return (
    <div className="relative z-20 mt-[60px]">
      <Banner variant="muted" className="bg-[#1A1A1A] border-b border-zinc-800">
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
                  Cast your vote and help decide the next epic battle. Vote as many times as you like!
                </p>
              </div>
              <div className="flex gap-3 max-md:flex-wrap">
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
                <Link href="/vote">
                  <Button size="sm" className="bg-gradient-to-r from-[#C99733] to-[#FFD163] text-black">
                    Vote Now
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            className="group -my-1.5 -me-2 size-8 shrink-0 p-0 hover:bg-transparent"
            onClick={() => setIsVisible(false)}
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
    </div>
  )
} 