/** What the Medusa sales-commission plugin's /sales-portal API returns. */

export type PortalRep = {
  id: string
  name: string
  email: string
  phone: string | null
}

export type PortalPaymentStatus = "paid" | "partial" | "unpaid" | "none"

export type PortalTotals = {
  currency_code: string
  turnover: number
  level2_turnover: number
  direct: number
  level2: number
  adjustments: number
  total: number
  paid: number
  status: PortalPaymentStatus
}

export type PortalLine = {
  kind: "commission" | "level2" | "reversal" | "adjustment" | "payout"
  date: string
  currency_code: string
  order_number: number | null
  customer_id: string | null
  client_name: string | null
  referred_rep_name: string | null
  net_value: number | null
  rate: number | null
  amount: number
  note: string | null
}

export type PortalClient = {
  customer_id: string
  client_name: string
  current: boolean
  commission_rate: number | null
  since: string | null
  totals: { currency_code: string; turnover: number; commission: number }[]
}

export type PortalOrder = {
  order_number: number
  paid_at: string
  net_value: number
  currency_code: string
  rate: number
  commission: number
  status: "paid" | "reversed"
}

export type PortalPayout = {
  paid_at: string
  period: string
  amount: number
  currency_code: string
  reference: string | null
}

export type PortalMonth = { period: string; totals: PortalTotals[] }
