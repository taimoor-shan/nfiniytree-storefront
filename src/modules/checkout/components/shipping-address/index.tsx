"use client"

import { HttpTypes } from "@medusajs/types"
import { Container, Text } from "@medusajs/ui"
import Checkbox from "@modules/common/components/checkbox"
import Input from "@modules/common/components/input"
import { useTranslation } from "@/lib/i18n"
import { validateVatNumber, getVatFormatHint } from "@lib/util/vat"
import { validatePhoneNumber, getPhoneFormatHint } from "@lib/util/phone"
import { sdk } from "@lib/config"
import { mapKeys } from "lodash"
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import AddressSelect from "../address-select"
import CountrySelect from "../country-select"
import { useRouter } from "next/navigation"

const ShippingAddress = ({
  customer,
  cart,
  checked,
  onChange,
}: {
  customer: HttpTypes.StoreCustomer | null
  cart: HttpTypes.StoreCart | null
  checked: boolean
  onChange: () => void
}) => {
  const { t } = useTranslation()
  const router = useRouter()
  const [formData, setFormData] = useState<Record<string, any>>({
    "shipping_address.first_name": cart?.shipping_address?.first_name || "",
    "shipping_address.last_name": cart?.shipping_address?.last_name || "",
    "shipping_address.address_1": cart?.shipping_address?.address_1 || "",
    "shipping_address.company": cart?.shipping_address?.company || "",
    "shipping_address.postal_code": cart?.shipping_address?.postal_code || "",
    "shipping_address.city": cart?.shipping_address?.city || "",
    "shipping_address.country_code": cart?.shipping_address?.country_code || "",
    "shipping_address.province": cart?.shipping_address?.province || "",
    "shipping_address.phone": cart?.shipping_address?.phone || "",
    vat_number: (cart?.shipping_address?.metadata as any)?.vat_number || "",
    email: cart?.email || "",
  })

  const [vatError, setVatError] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)

  // Async VIES verification state
  const [vatVerificationStatus, setVatVerificationStatus] = useState<
    "idle" | "checking" | "active" | "invalid" | "service_unavailable"
  >("idle")
  const [vatCompanyName, setVatCompanyName] = useState<string>("")
  const abortControllerRef = useRef<AbortController | null>(null)

  const validateVat = useCallback(
    (vat: string, countryCode: string) => {
      if (!vat || !vat.trim()) {
        setVatError("VAT number is required")
      } else {
        const err = validateVatNumber(countryCode, vat)
        setVatError(err)
      }
    },
    []
  )

  const validatePhone = useCallback(
    (phone: string, countryCode: string) => {
      const result = validatePhoneNumber(countryCode, phone)
      if (result.valid) {
        setPhoneError(null)
      } else {
        setPhoneError(
          `${t("checkout.phoneInvalid")} ${t("checkout.phoneFormatHint")} ${result.example}`
        )
      }
    },
    [t]
  )

  // Re-validate VAT and phone format when country changes
  useEffect(() => {
    const countryCode = formData["shipping_address.country_code"]
    if (countryCode && formData.vat_number) {
      validateVat(formData.vat_number, countryCode)
    }
    if (countryCode && formData["shipping_address.phone"]) {
      validatePhone(formData["shipping_address.phone"], countryCode)
    }
    // Reset async verification when country changes
    setVatVerificationStatus("idle")
    setVatCompanyName("")
    // Cancel any in-flight verification
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }, [formData["shipping_address.country_code"]])

  // Async VIES verification (debounced) when VAT or country changes
  useEffect(() => {
    const countryCode = formData["shipping_address.country_code"]
    const vatNumber = formData.vat_number?.trim()

    if (!countryCode || !vatNumber) {
      setVatVerificationStatus("idle")
      setVatCompanyName("")
      return
    }

    // Check format first — don't call API for badly formatted numbers
    const formatErr = validateVatNumber(countryCode, vatNumber)
    if (formatErr) {
      setVatVerificationStatus("idle")
      setVatCompanyName("")
      return
    }

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    const timer = setTimeout(async () => {
      try {
        setVatVerificationStatus("checking")
        setVatCompanyName("")

        const res = await fetch(
          `/api/validate-vat?country=${encodeURIComponent(countryCode)}&vat=${encodeURIComponent(vatNumber)}`,
          { signal: controller.signal }
        )

        if (!res.ok) {
          setVatVerificationStatus("service_unavailable")
          return
        }

        const data = await res.json()
        setVatVerificationStatus(data.status)
        if (data.company_name) {
          setVatCompanyName(data.company_name)
        }
      } catch (err: any) {
        if (err?.name === "AbortError") return // stale request, ignore
        setVatVerificationStatus("service_unavailable")
      }
    }, 600) // 600ms debounce

    return () => {
      clearTimeout(timer)
    }
  }, [formData.vat_number, formData["shipping_address.country_code"]])

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const countriesInRegion = useMemo(
    () => cart?.region?.countries?.map((c) => c.iso_2),
    [cart?.region]
  )

  // check if customer has saved addresses that are in the current region
  const addressesInRegion = useMemo(
    () =>
      customer?.addresses.filter(
        (a) => a.country_code && countriesInRegion?.includes(a.country_code)
      ),
    [customer?.addresses, countriesInRegion]
  )

  const setFormAddress = (
    address?: HttpTypes.StoreCartAddress,
    email?: string
  ) => {
    address &&
      setFormData((prevState: Record<string, any>) => ({
        ...prevState,
        "shipping_address.first_name": address?.first_name || "",
        "shipping_address.last_name": address?.last_name || "",
        "shipping_address.address_1": address?.address_1 || "",
        "shipping_address.company": address?.company || "",
        "shipping_address.postal_code": address?.postal_code || "",
        "shipping_address.city": address?.city || "",
        "shipping_address.country_code": address?.country_code || "",
        "shipping_address.province": address?.province || "",
        "shipping_address.phone": address?.phone || "",
      }))

    email &&
      setFormData((prevState: Record<string, any>) => ({
        ...prevState,
        email: email,
      }))
  }

  useEffect(() => {
    // Ensure cart is not null and has a shipping_address before setting form data
    if (cart && cart.shipping_address) {
      setFormAddress(cart?.shipping_address, cart?.email)
    }

    if (cart && !cart.email && customer?.email) {
      setFormAddress(undefined, customer.email)
    }
  }, [cart]) // Add cart as a dependency

  const handleCountryChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newCountry = e.target.value
    setFormData({ ...formData, [e.target.name]: newCountry })

    try {
      await sdk.store.cart.update(cart.id, {
        shipping_address: { country_code: newCountry },
      })

      // Auto-select shipping method when exactly one delivery option exists,
      // so the order summary reactively shows the correct shipping cost.
      const { shipping_options } = await sdk.client.fetch<{
        shipping_options: { id: string; amount?: number }[]
      }>(`/store/shipping-options?cart_id=${cart.id}`)

      const deliveryOptions =
        shipping_options?.filter(
          (so: any) => so.service_zone?.fulfillment_set?.type !== "pickup"
        ) ?? []

      if (deliveryOptions.length === 1) {
        await sdk.store.cart.addShippingMethod(cart.id, {
          option_id: deliveryOptions[0].id,
        })
      }

      router.refresh()
    } catch {
      // Fail silently — user can still submit the form normally
    }
  }

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLInputElement | HTMLSelectElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })

    // Validate VAT in real-time
    if (e.target.name === "vat_number") {
      const countryCode = formData["shipping_address.country_code"]
      validateVat(e.target.value, countryCode)
    }

    // Validate phone in real-time
    if (e.target.name === "shipping_address.phone") {
      const countryCode = formData["shipping_address.country_code"]
      validatePhone(e.target.value, countryCode)
    }
  }

  return (
    <>
      {customer && (addressesInRegion?.length || 0) > 0 && (
        <Container className="mb-6 flex flex-col gap-y-4 p-5">
          <p className="text-small-regular">
            {t("checkout.useSaved").replace("{name}", customer.first_name)}
          </p>
          <AddressSelect
            addresses={customer.addresses}
            addressInput={
              mapKeys(formData, (_, key) =>
                key.replace("shipping_address.", "")
              ) as HttpTypes.StoreCartAddress
            }
            onSelect={setFormAddress}
          />
        </Container>
      )}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label={t("account.firstName")}
          name="shipping_address.first_name"
          autoComplete="given-name"
          value={formData["shipping_address.first_name"]}
          onChange={handleChange}
          required
          data-testid="shipping-first-name-input"
        />
        <Input
          label={t("account.lastName")}
          name="shipping_address.last_name"
          autoComplete="family-name"
          value={formData["shipping_address.last_name"]}
          onChange={handleChange}
          required
          data-testid="shipping-last-name-input"
        />
        <Input
          label={t("addresses.address")}
          name="shipping_address.address_1"
          autoComplete="address-line1"
          value={formData["shipping_address.address_1"]}
          onChange={handleChange}
          required
          data-testid="shipping-address-input"
        />
        <Input
          label={t("addresses.company")}
          name="shipping_address.company"
          value={formData["shipping_address.company"]}
          onChange={handleChange}
          autoComplete="organization"
          required
          data-testid="shipping-company-input"
        />
        <Input
          label={t("addresses.postalCode")}
          name="shipping_address.postal_code"
          autoComplete="postal-code"
          value={formData["shipping_address.postal_code"]}
          onChange={handleChange}
          required
          data-testid="shipping-postal-code-input"
        />
        <Input
          label={t("addresses.city")}
          name="shipping_address.city"
          autoComplete="address-level2"
          value={formData["shipping_address.city"]}
          onChange={handleChange}
          required
          data-testid="shipping-city-input"
        />
        <CountrySelect
          name="shipping_address.country_code"
          autoComplete="country"
          region={cart?.region}
          value={formData["shipping_address.country_code"]}
          onChange={handleCountryChange}
          required
          data-testid="shipping-country-select"
        />
        <Input
          label={t("addresses.provinceState")}
          name="shipping_address.province"
          autoComplete="address-level1"
          value={formData["shipping_address.province"]}
          onChange={handleChange}
          data-testid="shipping-province-input"
        />
      </div>
      <div className="my-8">
        <Checkbox
          label={t("checkout.sameAsBilling")}
          name="same_as_billing"
          checked={checked}
          onChange={onChange}
          data-testid="billing-address-checkbox"
        />
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Input
          label={t("account.email")}
          name="email"
          type="email"
          title="Enter a valid email address."
          autoComplete="email"
          value={formData.email}
          onChange={handleChange}
          required
          data-testid="shipping-email-input"
        />
        <div>
          <Input
            label={t("account.phone")}
            name="shipping_address.phone"
            autoComplete="tel"
            value={formData["shipping_address.phone"]}
            onChange={handleChange}
            data-testid="shipping-phone-input"
          />
          {phoneError && (
            <Text className="text-xs text-red-500 mt-1 mb-2">
              {phoneError}
            </Text>
          )}
        </div>
        <div>
          <Input
            label={t("addresses.vatNumber")}
            name="vat_number"
            autoComplete="off"
            value={formData.vat_number}
            onChange={handleChange}
            required
            data-testid="shipping-vat-input"
            errors={vatError ? { vat_number: vatError } : undefined}
          />
          {vatError && (
            <Text className="text-xs text-red-500 mt-1 mb-2">
              {vatError}
            </Text>
          )}

          {/* Async VIES verification status */}
          {vatVerificationStatus === "checking" && (
            <Text className="text-xs text-ui-fg-subtle mt-1 mb-2">
              {t("checkout.vatVerifying")}
            </Text>
          )}
          {vatVerificationStatus === "active" && (
            <Text className="text-xs text-green-600 mt-1 mb-2">
              ✓ {t("checkout.vatVerified")}
              {vatCompanyName ? ` — ${vatCompanyName}` : ""}
            </Text>
          )}
          {vatVerificationStatus === "invalid" && (
            <Text className="text-xs text-red-500 mt-1 mb-2">
              ✗ {t("checkout.vatNotRegistered")}
            </Text>
          )}
          {vatVerificationStatus === "service_unavailable" && (
            <Text className="text-xs text-amber-600 mt-1 mb-2">
              ⚠ {t("checkout.vatServiceUnavailable")}
            </Text>
          )}
        </div>
      </div>
    </>
  )
}

export default ShippingAddress
