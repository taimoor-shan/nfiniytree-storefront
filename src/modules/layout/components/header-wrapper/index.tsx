"use client"

import { useEffect, useRef, useState } from "react"

type HeaderWrapperProps = {
  topBar: React.ReactNode
  children: React.ReactNode
}

export default function HeaderWrapper({ topBar, children }: HeaderWrapperProps) {
  const [hidden, setHidden] = useState(false)
  const [topBarH, setTopBarH] = useState(40) // mobile default
  const lastY = useRef(0)
  const ticking = useRef(false)

  // Track top bar height responsively (40px mobile, 48px >= 1024px)
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)")
    const update = () => setTopBarH(mq.matches ? 48 : 40)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return
      ticking.current = true

      requestAnimationFrame(() => {
        const y = window.scrollY

        if (y <= 40) {
          // At the very top — always show top bar
          setHidden(false)
        } else if (y > lastY.current) {
          // Scrolling down — hide top bar, nav slides up
          setHidden(true)
        } else if (y < lastY.current) {
          // Scrolling up — show top bar, nav slides back down
          setHidden(false)
        }

        lastY.current = y
        ticking.current = false
      })
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <div
      className="sticky top-0 inset-x-0 z-50 will-change-transform"
      style={{
        transform: `translateY(${hidden ? -topBarH : 0}px)`,
        transition: "transform 0.3s ease",
      }}
    >
      {topBar}
      {children}
    </div>
  )
}
