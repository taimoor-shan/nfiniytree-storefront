"use client"

import { useState, useRef, useEffect, useCallback, useId } from "react"

type SimpleDropdownProps = {
  trigger: React.ReactNode
  children: React.ReactNode
  align?: "left" | "right"
  /**
   * Accessible name for the trigger. The visible label is only the *current*
   * value ("English", "Austria"), which does not say what the control does.
   */
  label?: string
}

export default function SimpleDropdown({
  trigger,
  children,
  align = "left",
  label,
}: SimpleDropdownProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const panelId = useId()

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        close()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
    }

    document.addEventListener("click", handleClickOutside, true)
    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("click", handleClickOutside, true)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [open, close])

  return (
    <div className="relative h-full" ref={containerRef}>
      <button
        type="button"
        className="flex items-center gap-x-1.5 h-full text-xs text-on-dark hover:text-on-dark-soft transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-on-dark focus-visible:ring-offset-2 focus-visible:ring-offset-surface-dark"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={label}
      >
        {trigger}
        {/* Chevron */}
        <svg
          aria-hidden="true"
          focusable="false"
          className={`icon icon-chevron-down w-3 h-3 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          viewBox="0 0 24 24"
          stroke="currentColor"
          fill="none"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 9L12 15L18 9"
          />
        </svg>
      </button>

      {/* Dropdown menu. Hidden with `visibility: hidden`, which — unlike
          opacity alone — also takes the buttons out of the tab order. */}
      <div
        id={panelId}
        className={`absolute top-full z-30 min-w-[180px] bg-surface-dark text-on-dark shadow-lg ${
          align === "right" ? "right-0" : "left-0"
        } transition-all duration-200 origin-top ${
          open
            ? "opacity-100 visible translate-y-0 scale-y-100"
            : "opacity-0 invisible -translate-y-1 scale-y-95 pointer-events-none"
        }`}
        onClick={close}
      >
        {children}
      </div>
    </div>
  )
}
