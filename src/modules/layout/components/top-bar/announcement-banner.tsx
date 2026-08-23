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
    // WCAG 2.2.2: auto-updating content needs a way to stop. Hover-pause alone
    // is mouse-only, so honour the OS reduced-motion setting by not rotating at
    // all — the first message stays put.
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      return
    }

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
      onFocus={() => { pauseRef.current = true }}
      onBlur={() => { pauseRef.current = false }}
      // Deliberately not a live region. These are decorative promo messages, and
      // `aria-live` here meant a screen reader user was interrupted every four
      // seconds for as long as the page stayed open. The current message is
      // still read normally when reached in document order.
      aria-live="off"
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

      {/* Next message — only rendered during transition, and hidden from
          assistive tech so the outgoing/incoming pair is never read twice. */}
      {isLeaving && (
        <span
          aria-hidden="true"
          className="absolute whitespace-nowrap animate-slide-up-in"
        >
          {messages[nextIndex]}
        </span>
      )}
    </div>
  )
}
