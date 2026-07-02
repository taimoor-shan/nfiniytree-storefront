import React from "react"
import { CreditCard } from "@medusajs/icons"

import Ideal from "@modules/common/icons/ideal"
import Bancontact from "@modules/common/icons/bancontact"
import PayPal from "@modules/common/icons/paypal"
import { Apple } from "lucide-react"

const GooglePayIcon = () => (
  <svg width="32" height="20" viewBox="0 0 32 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="20" rx="3" fill="white" />
    <rect x="0.5" y="0.5" width="31" height="19" rx="2.5" stroke="#E5E7EB" />
    <path d="M11.9688 12.0002C11.9688 12.0002 12.5625 12.8752 14.0312 12.8752C15.6562 12.8752 16.8438 11.5315 16.8438 9.87524C16.8438 8.18774 15.6562 6.87524 14.0312 6.87524C12.4375 6.87524 11.4688 7.93774 11.4688 7.93774L12.3125 8.78149C12.3125 8.78149 13.0625 7.96899 14.0312 7.96899C15.0625 7.96899 15.6562 8.78149 15.6562 9.87524C15.6562 10.9377 15.0312 11.7815 14.0312 11.7815C13.25 11.7815 12.7188 11.2502 12.7188 11.2502V9.93774H14.0312V8.87524H11.5625C11.5312 9.15649 11.5 9.46899 11.5 9.84399C11.5 11.0002 11.9688 12.0002 11.9688 12.0002Z" fill="#4285F4"/>
    <path d="M19.5312 9.87524C19.5312 11.5002 18.4375 12.8752 16.9062 12.8752C15.375 12.8752 14.2812 11.5002 14.2812 9.87524C14.2812 8.21899 15.375 6.87524 16.9062 6.87524C18.4375 6.87524 19.5312 8.21899 19.5312 9.87524ZM18.4375 9.87524C18.4375 8.75024 17.75 7.87524 16.9062 7.87524C16.0312 7.87524 15.375 8.75024 15.375 9.87524C15.375 10.9689 16.0312 11.8752 16.9062 11.8752C17.75 11.8752 18.4375 10.9689 18.4375 9.87524Z" fill="#EA4335"/>
    <path d="M22.0625 12.7815V11.844C21.7812 12.5002 21.0938 12.8752 20.2812 12.8752C19.0312 12.8752 18 11.844 18 10.3752C18 8.87524 19.0312 7.84399 20.2812 7.84399C21.0938 7.84399 21.7812 8.25024 22.0625 8.87524V7.93774H23.0938V12.7815C23.0938 14.1252 22.25 14.844 21.2812 14.844C20.4062 14.844 19.75 14.2815 19.4688 13.6877L20.375 13.3127C20.5312 13.7189 20.875 13.9377 21.2812 13.9377C21.8438 13.9377 22.1875 13.5627 22.1875 12.9377V12.7815ZM22.0938 10.3752C22.0938 9.34399 21.375 8.78149 20.5625 8.78149C19.7188 8.78149 19.0625 9.46899 19.0625 10.3752C19.0625 11.2502 19.7188 11.9377 20.5625 11.9377C21.375 11.9377 22.0938 11.3752 22.0938 10.3752Z" fill="#FBBC04"/>
    <path d="M26.4062 9.40649H24.3125C24.4062 8.65649 25.0625 8.12524 25.7812 8.12524C26.4688 8.12524 26.9688 8.56274 27.125 9.09399L28.0625 8.71899C27.75 7.84399 26.9062 7.15649 25.75 7.15649C24.4062 7.15649 23.2812 8.15649 23.2812 9.87524C23.2812 11.5315 24.3438 12.8752 25.8438 12.8752C27.25 12.8752 28.1875 11.8752 28.1875 10.344C28.1875 10.1565 28.1562 10.0002 28.125 9.84399L26.4062 9.40649ZM25.8125 11.9377C25.125 11.9377 24.5312 11.4377 24.3438 10.6565H27.1562C27.0938 11.4065 26.5 11.9377 25.8125 11.9377Z" fill="#34A853"/>
  </svg>
)

/* Map of payment provider_id to their title and icon. Add in any payment providers you want to use. */
export const paymentInfoMap: Record<
  string,
  { title: string; icon: React.JSX.Element }
> = {
  "pp_stripe_stripe": {
    title: "Credit card",
    icon: <CreditCard />,
  },
  "pp_medusa-payments_default": {
    title: "Credit card",
    icon: <CreditCard />,
  },
  "pp_stripe_applepay": {
    title: "Apple Pay",
    icon: <Apple className="w-5 h-5 text-ink" fill="currentColor" />,
  },
  "pp_stripe_googlepay": {
    title: "Google Pay",
    icon: <GooglePayIcon />,
  },
  "pp_stripe-ideal_stripe": {
    title: "iDeal",
    icon: <Ideal />,
  },
  "pp_stripe-bancontact_stripe": {
    title: "Bancontact",
    icon: <Bancontact />,
  },
  pp_paypal_paypal: {
    title: "PayPal",
    icon: <PayPal />,
  },
  pp_system_default: {
    title: "Manual Payment",
    icon: <CreditCard />,
  },
  // Add more payment providers here
}

// This only checks if it is native stripe or medusa payments for card payments, it ignores the other stripe-based providers
export const isStripeLike = (providerId?: string) => {
  return (
    providerId?.startsWith("pp_stripe_") || providerId?.startsWith("pp_medusa-")
  )
}

export const isApplePay = (providerId?: string) => {
  return providerId === "pp_stripe_applepay" || providerId === "applepay" || providerId === "apple_pay"
}

export const isGooglePay = (providerId?: string) => {
  return providerId === "pp_stripe_googlepay" || providerId === "googlepay" || providerId === "google_pay"
}

export const isPaypal = (providerId?: string) => {
  return providerId?.startsWith("pp_paypal")
}
export const isManual = (providerId?: string) => {
  return providerId?.startsWith("pp_system_default")
}

// Add currencies that don't need to be divided by 100
export const noDivisionCurrencies = [
  "krw",
  "jpy",
  "vnd",
  "clp",
  "pyg",
  "xaf",
  "xof",
  "bif",
  "djf",
  "gnf",
  "kmf",
  "mga",
  "rwf",
  "xpf",
  "htg",
  "vuv",
  "xag",
  "xdr",
  "xau",
]
