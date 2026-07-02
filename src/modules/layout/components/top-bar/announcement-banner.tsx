"use client"

import { useState, useEffect, useRef, useCallback } from "react"

const DEFAULT_MESSAGES = [
  "Free shipping on orders over $50",
  "20% off everything this week",
  "New collection now available",
]

type AnnouncementBannerProps = {
  messages?: string[]
}

export default function AnnouncementBanner({
  messages = DEFAULT_MESSAGES,
}: AnnouncementBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLeaving, setIsLeaving] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pauseRef = useRef(false)

  const nextIndex = (currentIndex + 1) % messages.length

  const rotate = useCallback(() => {
    if (pauseRef.current) return
    setIsLeaving(true)

    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length)
      setIsLeaving(false)
    }, 400)
  }, [messages.length])

  const startInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(rotate, 4000)
  }, [rotate])

  useEffect(() => {
    startInterval()
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [startInterval])

  if (messages.length === 0) return null

  return (
    <div
      className="relative overflow-hidden h-full flex-1 flex items-center justify-center text-sm"
      onMouseEnter={() => { pauseRef.current = true }}
      onMouseLeave={() => { pauseRef.current = false }}
      role="marquee"
      aria-live="polite"
    >
      {/* Current message */}
      <span
        className={`absolute whitespace-nowrap transition-none ${
          isLeaving ? "animate-slide-up-out" : ""
        }`}
        aria-hidden={isLeaving}
      >
        {messages[currentIndex]}
      </span>

      {/* Next message — only rendered during transition */}
      {isLeaving && (
        <span className="absolute whitespace-nowrap animate-slide-up-in">
          {messages[nextIndex]}
        </span>
      )}
    </div>
  )
}
