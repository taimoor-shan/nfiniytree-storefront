"use client"

import { useEffect, useRef, useState } from "react"

type HeaderWrapperProps = {
  topBar: React.ReactNode
  children: React.ReactNode
}

export default function HeaderWrapper({
  topBar,
  children,
}: HeaderWrapperProps) {
  const [hidden, setHidden] = useState(false)
  const [topBarH, setTopBarH] = useState(40)
  const lastY = useRef(0)
  const ticking = useRef(false)

  // Track top bar height responsively
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)")

    const update = () => {
      setTopBarH(mq.matches ? 48 : 40)

      // Mobile: always reset to visible
      if (!mq.matches) {
        setHidden(false)
      }
    }

    update()

    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)")

    const onScroll = () => {
      // Completely disable scroll behavior on mobile
      if (!mq.matches) return

      if (ticking.current) return
      ticking.current = true

      requestAnimationFrame(() => {
        const y = window.scrollY

        if (y <= 40) {
          setHidden(false)
        } else if (y > lastY.current) {
          setHidden(true)
        } else if (y < lastY.current) {
          setHidden(false)
        }

        lastY.current = y
        ticking.current = false
      })
    }

    window.addEventListener("scroll", onScroll, { passive: true })

    return () => {
      window.removeEventListener("scroll", onScroll)
    }
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