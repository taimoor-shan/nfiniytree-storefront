import { HttpTypes } from "@medusajs/types"

/**
 * Customer-facing status labels as i18n keys — never expose raw Medusa
 * statuses.  Consumers render them through their translation function.
 */
const STATUS_LABEL_KEYS: Record<string, string> = {
  pending: "order.progress.confirmed",
  fulfilled: "order.progress.inProgress",
  shipped: "order.progress.shipped",
  delivered: "order.progress.delivered",
  not_fulfilled: "order.progress.confirmed",
  partially_fulfilled: "order.progress.inProgress",
  partially_shipped: "order.progress.shipped",
  partially_delivered: "order.progress.delivered",
  canceled: "order.progress.canceled",
  requires_action: "order.progress.actionRequired",
}

export interface ProgressStep {
  id: "confirmed" | "in_progress" | "shipped" | "delivered"
  /** i18n key for the step label (e.g. "order.progress.shipped"). */
  labelKey: string
  completed: boolean
  date?: string | null
  tracking?: {
    number: string
    url?: string
  }
}

export interface FulfillmentInfo {
  id: string
  /** i18n key for the fulfillment status label. */
  status: string
  shipped_at?: string | null
  delivered_at?: string | null
  tracking_number?: string
  tracking_url?: string
}

export interface OrderProgress {
  currentStep: ProgressStep["id"]
  steps: ProgressStep[]
  fulfillments: FulfillmentInfo[]
}

function mapStatus(raw: string): string {
  return STATUS_LABEL_KEYS[raw] || raw
}

/**
 * Build a customer-friendly order progress view from a Medusa StoreOrder.
 *
 * Delivery is derived from fulfillments having `delivered_at` OR the
 * aggregated `fulfillment_status` being a delivery variant — this avoids
 * relying solely on carrier webhooks.
 */
export function getOrderProgress(order: HttpTypes.StoreOrder): OrderProgress {
  const rawFulfillments = (order.fulfillments || []) as any[]
  const fulfillmentStatus = (order as any).fulfillment_status

  // ── Per-fulfillment info ──────────────────────────────────
  const fulfillments: FulfillmentInfo[] = rawFulfillments.map((f: any) => ({
    id: f.id,
    status: mapStatus(f.shipped_at ? "shipped" : f.delivered_at ? "delivered" : f.packed_at ? "fulfilled" : "pending"),
    shipped_at: f.shipped_at,
    delivered_at: f.delivered_at,
    tracking_number: f.labels?.[0]?.tracking_number,
    tracking_url: f.labels?.[0]?.tracking_url,
  }))

  // ── Aggregate state ───────────────────────────────────────
  const hasFulfillments = rawFulfillments.length > 0
  const anyShipped = rawFulfillments.some((f: any) => f.shipped_at)
  const allShipped = hasFulfillments && rawFulfillments.every((f: any) => f.shipped_at || f.delivered_at)
  const anyDelivered = rawFulfillments.some((f: any) => f.delivered_at)
  const allDelivered = hasFulfillments && rawFulfillments.every((f: any) => f.delivered_at)

  const isDelivered = allDelivered || fulfillmentStatus === "delivered"
  const isShipped = !isDelivered && (anyShipped || fulfillmentStatus === "shipped" || fulfillmentStatus === "partially_shipped")
  const isInProgress = !isShipped && !isDelivered && (hasFulfillments || fulfillmentStatus === "fulfilled" || fulfillmentStatus === "partially_fulfilled")

  const currentStep: ProgressStep["id"] = isDelivered
    ? "delivered"
    : isShipped
      ? "shipped"
      : isInProgress
        ? "in_progress"
        : "confirmed"

  // ── Build steps ───────────────────────────────────────────
  const steps: ProgressStep[] = [
    {
      id: "confirmed",
      labelKey: "order.progress.confirmed",
      completed: true,
      date: order.created_at,
    },
    {
      id: "in_progress",
      labelKey: "order.progress.inProgress",
      completed: currentStep !== "confirmed",
      date: rawFulfillments[0]?.packed_at || rawFulfillments[0]?.created_at,
    },
    {
      id: "shipped",
      labelKey: "order.progress.shipped",
      completed: currentStep === "shipped" || currentStep === "delivered",
      date: rawFulfillments.find((f: any) => f.shipped_at)?.shipped_at,
      tracking: fulfillments.find((f) => f.tracking_number)
        ? {
            number: fulfillments.find((f) => f.tracking_number)!.tracking_number!,
            url: fulfillments.find((f) => f.tracking_number)!.tracking_url,
          }
        : undefined,
    },
    {
      id: "delivered",
      labelKey: "order.progress.delivered",
      completed: currentStep === "delivered",
      date: rawFulfillments.find((f: any) => f.delivered_at)?.delivered_at,
    },
  ]

  return { currentStep, steps, fulfillments }
}
