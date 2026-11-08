"use client"

import { useEffect, useReducer } from "react"

const ACTION_DONE = "repaint-guard:action-done"

/**
 * How long after the action came back each nudge fires. A nudge helps only if
 * it comes after the response has been read in full and the router has tried to
 * show it. Measured on a local `next start`: a single nudge at 100 or 200 ms
 * still missed in 2 of 8 runs each, one at 300 ms or later never did (21 runs).
 * The later ones are for a slow connection, where the response takes longer.
 */
const NUDGE_AFTER_MS = [300, 800, 2000, 5000]

/**
 * Call after a Server Action that ends in `refresh()` (every cart change) has
 * returned, from the handler that called it. It is an event, not a state
 * setter, so it still works when the caller's row is gone by then (a deleted
 * line item) and the page is the only thing left to repaint.
 */
export function guardRepaint() {
  window.dispatchEvent(new Event(ACTION_DONE))
}

/**
 * Makes sure the page shows what a Server Action sent back.
 *
 * In a production build (`next build` + `next start`, not `next dev`) the cart
 * page did not always repaint after a cart change: a new quantity, an applied
 * promotion code or a removed one appeared only after the next click or a
 * reload. The action's response was complete and right; React's router update
 * for it was left suspended and nothing woke it up again. Any later React update
 * wakes it, and that is all this does: after `guardRepaint()` it re-renders
 * itself (it draws nothing) a few times. When the page has painted by then, a
 * nudge is a render of an empty component and changes nothing.
 *
 * Measured on a local `next start`, with this guard switched off in the page:
 * a changed quantity painted in 1 of 10 tries and an applied promotion code in
 * none of 3. With it: 12 of 12, and 3 of 3.
 *
 * It matches an open Next.js bug (vercel/next.js#99028: a router payload that
 * arrives and is never committed, on `next start` and not on Vercel). Delete
 * this when the Next.js version in use no longer has it.
 *
 * Mounted once in the root layout, which stays mounted while the visitor moves
 * between pages.
 */
export default function RepaintGuard() {
  const [, nudge] = useReducer((count: number) => count + 1, 0)

  useEffect(() => {
    let timers: number[] = []

    const stop = () => {
      for (const timer of timers) {
        window.clearTimeout(timer)
      }
      timers = []
    }

    // A new change starts the series again from the first nudge
    const start = () => {
      stop()
      timers = NUDGE_AFTER_MS.map((ms) => window.setTimeout(nudge, ms))
    }

    window.addEventListener(ACTION_DONE, start)
    return () => {
      window.removeEventListener(ACTION_DONE, start)
      stop()
    }
  }, [])

  return null
}
