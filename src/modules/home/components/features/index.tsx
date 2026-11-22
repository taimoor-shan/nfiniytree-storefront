"use client"

import { clx } from "@medusajs/ui"
import {
  Building2,
  Droplets,
  Pause,
  Play,
  Sparkles,
  TreePine,
} from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { useIntersection } from "@lib/hooks/use-in-view"
import { useMediaQuery } from "@lib/hooks/use-media-query"
import { useTranslation } from "@lib/i18n/client"

type FeaturesProps = {
  /** Category name — when provided, replaces the first feature's title. */
  categoryName?: string
  /** Category description — when provided, replaces the first feature's description. */
  categoryDescription?: string
}

/**
 * How long each feature stays before the strip moves on. A feature is a title
 * and two or three lines of text, so it needs time to be read.
 */
const DWELL_MS = 5000

/**
 * Where the features are a strip: below Tailwind's `sm` (640 px), where the grid
 * used to fall into one column of four. Keep it in step with the `sm:` classes.
 */
const PHONE = "(max-width: 639.98px)"
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)"

/** What holds the strip still: a finger on it, the mouse over it, keyboard focus in it. */
const TOUCH = 1
const HOVER = 2
const FOCUS = 4

/**
 * The selling points under the hero, and under a product.
 *
 * From 640 px up they are a grid, two across and from 1024 px four across.
 * Below 640 px, where that grid fell into one column of four rows about 800 px
 * tall, they are a strip that shows one at a time, swipes sideways and moves on
 * by itself every `DWELL_MS`.
 *
 * The strip is plain CSS scroll snapping on the same four elements, not a
 * carousel library: swiping, momentum and snapping are the browser's, every
 * feature stays in the page for screen readers and for visitors without script,
 * and the grid and the strip cannot disagree because they are one markup. The
 * script only adds what CSS cannot: the timer, the dots and the pause button.
 *
 * The timer runs only while the strip is on screen on a phone-width window. It
 * stops while a finger, the mouse or keyboard focus is on the strip, when the
 * visitor presses pause, and altogether for anyone who asked for reduced motion
 * (who gets no pause button either, since nothing moves). The pause button and
 * the stop on focus are what WCAG 2.2.2 asks of text that moves by itself for
 * more than five seconds.
 *
 * Below 576 px the strip runs the full width of the screen (`-mx-6 px-6`, the
 * page gutter), so a slide leaves at the edge of the screen and not at an
 * invisible line 24 px inside it; `gap-6` is that same gutter, so the next
 * feature is never seen at rest.
 */
const Features = ({ categoryName, categoryDescription }: FeaturesProps) => {
  const { t } = useTranslation()

  const features = [
    {
      icon: Sparkles,
      title: categoryName || t("features.oneOfAKind.title"),
      description: categoryDescription || t("features.oneOfAKind.description"),
    },
    {
      icon: Droplets,
      title: t("features.maintenanceFree.title"),
      description: t("features.maintenanceFree.description"),
    },
    {
      icon: TreePine,
      title: t("features.authenticMaterials.title"),
      description: t("features.authenticMaterials.description"),
    },
    {
      icon: Building2,
      title: t("features.luxurySpaces.title"),
      description: t("features.luxurySpaces.description"),
    },
  ]
  const count = features.length

  const frame = useRef<HTMLDivElement>(null)
  const strip = useRef<HTMLDivElement>(null)

  const phone = useMediaQuery(PHONE)
  const reducedMotion = useMediaQuery(REDUCED_MOTION)
  const onScreen = useIntersection(frame, "0px")

  // The feature in view. It follows the strip's scroll position, so a swipe, a
  // dot and the timer all agree. Then: whether the visitor pressed pause, and
  // what is holding the strip still right now.
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const [holds, setHolds] = useState(0)
  const hold = (what: number) => setHolds((now) => now | what)
  const release = (what: number) => setHolds((now) => now & ~what)

  const syncActive = useCallback(() => {
    const slides = strip.current?.children
    const first = slides?.[0]
    const second = slides?.[1]
    if (
      !strip.current ||
      !(first instanceof HTMLElement) ||
      !(second instanceof HTMLElement)
    ) {
      return
    }

    const step = second.offsetLeft - first.offsetLeft
    if (step > 0) {
      // Clamped: iOS lets the strip rubber-band past either end.
      setActive(
        Math.max(0, Math.min(count - 1, Math.round(strip.current.scrollLeft / step)))
      )
    }
  }, [count])

  const goTo = useCallback(
    (index: number) => {
      const slides = strip.current?.children
      const slide = slides?.[index]
      const first = slides?.[0]
      if (
        !strip.current ||
        !(slide instanceof HTMLElement) ||
        !(first instanceof HTMLElement)
      ) {
        return
      }

      // `scrollTo` on the strip, not `scrollIntoView`, which would move the page too.
      strip.current.scrollTo({
        left: slide.offsetLeft - first.offsetLeft,
        behavior: reducedMotion ? "auto" : "smooth",
      })
    },
    [reducedMotion]
  )

  // Turning the phone, or resizing across the breakpoint, changes the strip's
  // scroll position without scrolling it, so the dot is looked up again.
  useEffect(() => {
    window.addEventListener("resize", syncActive)

    return () => window.removeEventListener("resize", syncActive)
  }, [syncActive])

  const autoplay = phone && onScreen && !reducedMotion && !paused && holds === 0

  useEffect(() => {
    if (!autoplay) return

    // It starts over whenever the feature changes, however it changed, so a
    // swipe or a tap on a dot is never followed at once by the timer's own move.
    const timer = window.setInterval(() => {
      if (!document.hidden) goTo((active + 1) % count)
    }, DWELL_MS)

    return () => window.clearInterval(timer)
  }, [autoplay, active, count, goTo])

  return (
    <section className="content-container pt-12">
      <div
        ref={frame}
        className="max-w-6xl mx-auto"
        // A finger is the whole gesture (`touchend` comes when it lifts, where
        // `pointercancel` comes as soon as the swipe starts); the mouse is only
        // "on it" while it hovers; keyboard focus only counts when it came from
        // the keyboard, not from a tap that left the focus on a dot.
        onTouchStart={() => hold(TOUCH)}
        onTouchEnd={() => release(TOUCH)}
        onTouchCancel={() => release(TOUCH)}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") hold(HOVER)
        }}
        onPointerLeave={() => release(HOVER)}
        onFocus={(event) => {
          if (event.target.matches(":focus-visible")) hold(FOCUS)
        }}
        onBlur={() => release(FOCUS)}
      >
        <div
          ref={strip}
          onScroll={syncActive}
          className="no-scrollbar -mx-6 flex snap-x snap-mandatory gap-6 overflow-x-auto overscroll-x-contain scroll-pl-6 px-6 sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:gap-8 sm:overflow-visible sm:px-0 lg:grid-cols-4"
        >
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="flex basis-full shrink-0 snap-start flex-col items-center gap-4 text-center"
            >
              <div className="w-14 h-14 rounded-full bg-surface-card flex items-center justify-center">
                {/* Decorative. The heading below carries the meaning; lucide
                    renders an <svg> with no title, so without this a screen
                    reader announces an unlabelled graphic before every feature. */}
                <Icon size={24} className="text-ink" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold text-ink">{title}</h3>
              <p className="text-sm text-body leading-relaxed">{description}</p>
            </div>
          ))}
        </div>

        {/* Only where the features are a strip. Each button is the 24x24 target
            WCAG 2.5.8 asks for around an 8px dot, with no negative margin so
            neighbouring targets never overlap: the same dots as the product
            gallery. */}
        <div className="mt-6 flex items-center justify-center sm:hidden">
          {features.map(({ title }, index) => (
            <button
              key={title}
              type="button"
              onClick={() => goTo(index)}
              aria-label={t("features.goTo").replace("{index}", String(index + 1))}
              aria-current={index === active ? "true" : undefined}
              className="flex h-6 w-6 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span
                aria-hidden="true"
                className={clx(
                  "h-2 rounded-full transition-all",
                  index === active ? "w-4 bg-primary" : "w-2 bg-muted-soft"
                )}
              />
            </button>
          ))}

          {!reducedMotion && (
            <button
              type="button"
              onClick={() => setPaused((now) => !now)}
              aria-label={t(paused ? "features.play" : "features.pause")}
              className="ml-2 flex h-6 w-6 items-center justify-center rounded-full text-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {paused ? (
                <Play aria-hidden="true" className="h-3.5 w-3.5 fill-current" />
              ) : (
                <Pause aria-hidden="true" className="h-3.5 w-3.5 fill-current" />
              )}
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

export default Features
