/** What the Medusa sales-commission plugin's /sales-portal API returns. */

export type PortalRep = {
  id: string
  name: string
  email: string
  phone: string | null
}

export type PortalPaymentStatus =
  | "paid"
  | "partial"
  | "unpaid"
  | "overpaid"
  | "none"

/** A month's money in one currency, with what was owed at its start and end. */
export type PortalTotals = {
  currency_code: string
  turnover: number
  level2_turnover: number
  direct: number
  level2: number
  adjustments: number
  total: number
  paid: number
  /** Owed at the start of the month: earned and not yet paid */
  opening: number
  /** Owed at the end of the month */
  closing: number
  status: PortalPaymentStatus
}

/** Where a line stands: not paid for yet, earned, payable, taken back, or paid out. */
export type PortalLineStatus =
  | "pending"
  | "earned"
  | "payable"
  | "reversed"
  | "adjustment"
  | "paid"

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
  status: PortalLineStatus
  /** What is owed in this currency after the line; null for an unpaid order */
  balance: number | null
  /** When the order was in another currency than the rep is paid in */
  order_currency_code: string | null
  order_amount: number | null
  fx_rate: number | null
  note: string | null
}

export type PortalStatement = {
  period: string
  /** The owner has approved the month, so what it earned is payable */
  approved: boolean
  lines: PortalLine[]
  totals: PortalTotals[]
  /** Orders not paid yet, whatever month is shown */
  pending: PortalLine[]
}

export type PortalBalance = {
  currency_code: string
  earned: number
  paid: number
  /** earned - paid */
  balance: number
  approved_earned: number
  /** Earned after the last approved month: not payable yet */
  open_earned: number
  /** What the owner can pay now */
  payable: number
  /** What was paid beyond what is approved: netted from what is earned next */
  to_recover: number
}

export type PortalBalances = {
  approved_through: string | null
  balances: PortalBalance[]
  paid_this_year: Record<string, number>
  /** What unpaid orders would earn if paid now */
  pending: { currency_code: string; amount: number; orders: number }[]
  /** The day the owner usually pays next ("YYYY-MM-DD"), when one is set */
  next_run: string | null
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

export type PortalMoney = { currency_code: string; amount: number }

export type PortalRecruitStatus =
  | "active"
  | "pending_approval"
  | "invited"
  | "expired"
  | "inactive"
  | "declined"

/** Someone this rep invited, as the portal lists them: never their clients. */
export type PortalRecruit = {
  id: string
  name: string
  email: string
  status: PortalRecruitStatus
  invited_at: string
  /** When the invite link stops working; only while it waits to be used */
  expires_at: string | null
  note: string | null
  level2_rate: number | null
  level2_until: string | null
  level2_this_month: PortalMoney[]
  level2_total: PortalMoney[]
}

export type PortalRecruits = {
  recruits: PortalRecruit[]
  limits: { open_invites: number; max_open_invites: number; invite_days: number }
}

export type InviteState =
  | "invited"
  | "expired"
  | "applied"
  | "approved"
  | "declined"

/** What a candidate sees on their invite page. */
export type PortalInvite = {
  state: InviteState
  recruiter_name: string
  name: string
  email: string
  expires_at: string
  applied_at: string | null
}
