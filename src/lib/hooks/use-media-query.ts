import { useSyncExternalStore } from "react"

type QueryStore = {
  subscribe: (onChange: () => void) => () => void
  getSnapshot: () => boolean
}

// One store per query, made once. `useSyncExternalStore` unsubscribes and
// subscribes again whenever it is handed a new `subscribe` function, so a store
// built inside the hook would do that on every render.
const stores = new Map<string, QueryStore>()

const storeFor = (query: string): QueryStore => {
  let store = stores.get(query)

  if (!store) {
    store = {
      subscribe: (onChange) => {
        const list = window.matchMedia(query)
        list.addEventListener("change", onChange)

        return () => list.removeEventListener("change", onChange)
      },
      getSnapshot: () => window.matchMedia(query).matches,
    }
    stores.set(query, store)
  }

  return store
}

/**
 * Whether a CSS media query matches right now, kept up to date as the window or
 * the visitor's settings change (`(prefers-reduced-motion: reduce)`, a width...).
 *
 * The server cannot know, so it, and the browser's first render while it hydrates
 * the server's HTML, get `serverValue`; the real answer follows straight after.
 * That is why nothing that is sent in the HTML should depend on this: use it to
 * switch behaviour on or off, and let CSS (`sm:`, `motion-reduce:`) draw the page.
 */
export function useMediaQuery(query: string, serverValue = false): boolean {
  const { subscribe, getSnapshot } = storeFor(query)

  return useSyncExternalStore(subscribe, getSnapshot, () => serverValue)
}
