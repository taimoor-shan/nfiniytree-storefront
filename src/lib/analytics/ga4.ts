/**
 * Google Analytics 4: the shop's events, kept behind the visitor's consent.
 *
 * The tag is loaded by `GoogleAnalytics`
 * (`@modules/common/components/google-analytics`) through the cookie banner,
 * only after the visitor allows "Analytics". Until then `trackEvent` sends
 * nothing. An event that happens before the tag runs (a product page opened
 * straight from a search result fires before the banner state is even read)
 * waits on the page and is sent as soon as the tag starts, or is dropped with
 * the page if it never does.
 *
 * Items are identified by the product handle, which is the same in every
 * language, so a product's views, carts and sales add up across markets.
 * Values are the net prices the shop shows; a purchase carries tax and
 * shipping in their own fields.
 */

/**
 * The GA4 property, from `.env.production` and baked in at build time. Empty
 * (or not a `G-` ID) turns analytics off.
 */
export const GA_MEASUREMENT_ID = /^G-[A-Z0-9]+$/.test(
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ""
)
  ? (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID as string)
  : ""

/**
 * GA's own off switch for the property (`window["ga-disable-G-…"]`), which
 * also serves as the tag's state here: `false` once it runs with consent,
 * `true` after consent is withdrawn, absent before either.
 */
export const GA_DISABLE_KEY = `ga-disable-${GA_MEASUREMENT_ID}`

type EventParams = Record<string, unknown>

/** Remembered in the browser, so a reload does not count the event twice. */
export type Once = {
  key: string
  /** `session`: once per browser session; `browser`: once for good. */
  per: "session" | "browser"
}

const pending: { name: string; params: EventParams; once?: Once }[] = []

/** A visitor who never answers the banner sends nothing; this caps what waits meanwhile. */
const MAX_PENDING = 20

const tagState = () =>
  (window as unknown as Record<string, boolean | undefined>)[GA_DISABLE_KEY]

const storageFor = (once: Once): Storage | null => {
  try {
    return once.per === "session" ? window.sessionStorage : window.localStorage
  } catch {
    return null
  }
}

const alreadySent = (once?: Once) => {
  if (!once) return false
  try {
    return storageFor(once)?.getItem(`ga4:${once.key}`) === "1"
  } catch {
    return false
  }
}

const send = (name: string, params: EventParams, once?: Once) => {
  if (alreadySent(once)) return
  window.gtag?.("event", name, params)
  if (!once) return
  try {
    storageFor(once)?.setItem(`ga4:${once.key}`, "1")
  } catch {
    // Private mode or full storage: the event may count twice, nothing worse.
  }
}

/**
 * Sends a GA4 event once the visitor has allowed analytics. Before the tag
 * runs, the event waits; after consent is withdrawn, or without a
 * measurement ID, it is dropped.
 */
export function trackEvent(
  name: string,
  params: EventParams,
  once?: Once
): void {
  if (typeof window === "undefined" || !GA_MEASUREMENT_ID) return
  const state = tagState()
  if (state === false) {
    send(name, params, once)
  } else if (state === undefined && pending.length < MAX_PENDING) {
    pending.push({ name, params, once })
  }
}

/** Sends the events that waited for the tag; `GoogleAnalytics` calls it once the tag runs. */
export function flushPendingEvents(): void {
  for (const { name, params, once } of pending.splice(0)) {
    send(name, params, once)
  }
}

/** Consent withdrawn: the tag stops sending, its cookies go and nothing waits. */
export function revokeAnalytics(): void {
  if (!GA_MEASUREMENT_ID) return
  ;(window as unknown as Record<string, boolean>)[GA_DISABLE_KEY] = true
  pending.length = 0
  const host = window.location.hostname
  for (const cookie of document.cookie.split(";")) {
    const name = cookie.split("=")[0].trim()
    if (!name.startsWith("_ga")) continue
    // GA writes its cookies for the whole domain (`.infinytree.com`).
    for (const domain of [
      "",
      `; domain=${host}`,
      `; domain=.${host.replace(/^www\./, "")}`,
    ]) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain}`
    }
  }
}

/** One product line as GA4 reads it. */
export type Ga4Item = {
  item_id: string
  item_name: string
  item_variant?: string
  price?: number
  quantity: number
}

/** The line-item fields used here; carts and orders both have them. */
type LineItemLike = {
  product_handle?: string | null
  product_id?: string | null
  product_title?: string | null
  title?: string | null
  variant_title?: string | null
  unit_price?: number | null
  quantity?: number | null
  product?: { handle?: string | null } | null
}

export const lineItemToGa4 = (item: LineItemLike): Ga4Item => ({
  item_id: item.product?.handle || item.product_handle || item.product_id || "",
  item_name: item.product_title || item.title || "",
  ...(item.variant_title ? { item_variant: item.variant_title } : {}),
  ...(typeof item.unit_price === "number" ? { price: item.unit_price } : {}),
  quantity: item.quantity || 1,
})

/** The cart or order totals used here: Medusa's net figures, as the cart summary shows them. */
type TotalsLike = {
  currency_code?: string | null
  item_subtotal?: number | null
  discount_subtotal?: number | null
  items?: LineItemLike[] | null
}

/** Goods after discounts, before tax and shipping. */
const netValue = (totals: TotalsLike) =>
  (totals.item_subtotal ?? 0) - (totals.discount_subtotal ?? 0)

/** `begin_checkout`: the cart as the checkout opens. */
export const beginCheckoutParams = (cart: TotalsLike) => ({
  currency: (cart.currency_code || "").toUpperCase(),
  value: netValue(cart),
  items: (cart.items ?? []).map(lineItemToGa4),
})

/** `purchase`: the placed order. */
export const purchaseParams = (
  order: TotalsLike & {
    id: string
    display_id?: number | null
    tax_total?: number | null
    shipping_subtotal?: number | null
  }
) => ({
  // The order number the shop and its emails show.
  transaction_id: String(order.display_id ?? order.id),
  ...beginCheckoutParams(order),
  tax: order.tax_total ?? 0,
  shipping: order.shipping_subtotal ?? 0,
})

/** A price for the visitor's region, as Medusa calculated it. */
type PriceLike = {
  amount?: number | null
  currency_code?: string | null
}

/** `view_item` and `add_to_cart`: one product, optionally one variant of it. */
export const productParams = (
  product: { id: string; handle?: string | null; title?: string | null },
  price: PriceLike | null | undefined,
  variant?: { title?: string | null } | null,
  quantity = 1
) => {
  const amount = price?.amount
  const currency = price?.currency_code
  const money =
    typeof amount === "number" && currency
      ? { amount, currency: currency.toUpperCase() }
      : null
  return {
    ...(money ? { currency: money.currency, value: money.amount * quantity } : {}),
    items: [
      {
        item_id: product.handle || product.id,
        item_name: product.title || "",
        ...(variant?.title ? { item_variant: variant.title } : {}),
        ...(money ? { price: money.amount } : {}),
        quantity,
      },
    ],
  }
}
