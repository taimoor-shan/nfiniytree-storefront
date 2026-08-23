"use client"

import { HttpTypes } from "@medusajs/types"
import { Container, Heading, Text } from "@medusajs/ui"
import { Radio, RadioGroup } from "@headlessui/react"
import Checkbox from "@modules/common/components/checkbox"
import Input from "@modules/common/components/input"
import MedusaRadio from "@modules/common/components/radio"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useTranslation } from "@/lib/i18n"
import { validateVatNumber } from "@lib/util/vat"
import { validatePhoneNumber } from "@lib/util/phone"
import { sdk } from "@lib/config"
import { getCountryOptions } from "@lib/util/regions"
import { mapKeys } from "lodash"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import AddressSelect from "../address-select"
import CountrySelect from "../country-select"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

const SALUTATIONS = [
  { value: "MS", label: "Ms" },
  { value: "MR", label: "Mr" },
  { value: "MX", label: "Mx" },
] as const

const ShippingAddress = ({
  customer,
  cart,
  checked,
  onChange,
  regions,
}: {
  customer: HttpTypes.StoreCustomer | null
  cart: HttpTypes.StoreCart | null
  checked: boolean
  onChange: () => void
  regions: HttpTypes.StoreRegion[]
}) => {
  const { t } = useTranslation()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const customerMetadata = (customer?.metadata || {}) as Record<string, any>
  const cartAddressMetadata = (cart?.shipping_address?.metadata ||
    {}) as Record<string, any>

  // Fallback address for prefilling a signed-in customer's checkout form:
  // their default shipping address (or the first saved one) when the cart
  // doesn't carry an address yet.
  const defaultShippingAddress =
    customer?.addresses?.find((a) => a.is_default_shipping) ||
    customer?.addresses?.[0]

  const [formData, setFormData] = useState<Record<string, any>>({
    "shipping_address.first_name":
      cart?.shipping_address?.first_name ||
      defaultShippingAddress?.first_name ||
      customer?.first_name ||
      "",
    "shipping_address.last_name":
      cart?.shipping_address?.last_name ||
      defaultShippingAddress?.last_name ||
      customer?.last_name ||
      "",
    "shipping_address.address_1":
      cart?.shipping_address?.address_1 ||
      defaultShippingAddress?.address_1 ||
      "",
    "shipping_address.address_2":
      cart?.shipping_address?.address_2 ||
      defaultShippingAddress?.address_2 ||
      "",
    "shipping_address.company":
      cart?.shipping_address?.company ||
      defaultShippingAddress?.company ||
      customer?.company_name ||
      "",
    "shipping_address.postal_code":
      cart?.shipping_address?.postal_code ||
      defaultShippingAddress?.postal_code ||
      "",
    "shipping_address.city":
      cart?.shipping_address?.city || defaultShippingAddress?.city || "",
    "shipping_address.country_code":
      cart?.shipping_address?.country_code ||
      defaultShippingAddress?.country_code ||
      "",
    "shipping_address.province":
      cart?.shipping_address?.province ||
      defaultShippingAddress?.province ||
      "",
    "shipping_address.phone":
      cart?.shipping_address?.phone ||
      defaultShippingAddress?.phone ||
      customer?.phone ||
      "",
    // Person-level attributes: the signed-in customer's record is the source
    // of truth — a stale cart address must not override it.
    salutation:
      customerMetadata.salutation || cartAddressMetadata.salutation || "",
    customer_type:
      customerMetadata.customer_type ||
      cartAddressMetadata.customer_type ||
      // Legacy accounts created before customer_type existed: a stored VAT
      // number means a business account.
      (customerMetadata.vat_number ? "b2b" : "") ||
      "b2c",
    vat_number:
      cartAddressMetadata.vat_number || customerMetadata.vat_number || "",
    email: cart?.email || customer?.email || "",
  })

  const [createAccount, setCreateAccount] = useState(false)
  const [password, setPassword] = useState("")
  const [passwordRepeat, setPasswordRepeat] = useState("")
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const isBusiness = formData.customer_type === "b2b"

  const [vatError, setVatError] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [isSwitchingRegion, setIsSwitchingRegion] = useState(false)

  // Flat list of all countries across all regions, with their region ids
  const countryOptions = useMemo(() => getCountryOptions(regions), [regions])

  // Async VIES verification state
  const [vatVerificationStatus, setVatVerificationStatus] = useState<
    "idle" | "checking" | "active" | "invalid" | "service_unavailable"
  >("idle")
  const [vatCompanyName, setVatCompanyName] = useState<string>("")
  const abortControllerRef = useRef<AbortController | null>(null)
  const lastVerifiedRef = useRef<{ country: string; vat: string } | null>(null)

  const validateVat = useCallback(
    (vat: string, countryCode: string) => {
      if (!vat || !vat.trim()) {
        setVatError(t("checkout.vatNumberRequired"))
      } else {
        const err = validateVatNumber(countryCode, vat)
        setVatError(err)
      }
    },
    [t]
  )

  const validatePhone = useCallback(
    (phone: string, countryCode: string) => {
      const result = validatePhoneNumber(countryCode, phone)
      if (result.valid) {
        setPhoneError(null)
      } else {
        setPhoneError(
          `${t("checkout.phoneInvalid")} ${t("checkout.phoneFormatHint")} ${
            result.example
          }`
        )
      }
    },
    [t]
  )

  // Re-validate VAT and phone format when country changes
  useEffect(() => {
    const countryCode = formData["shipping_address.country_code"]
    if (countryCode && isBusiness && formData.vat_number) {
      validateVat(formData.vat_number, countryCode)
    }
    if (countryCode && formData["shipping_address.phone"]) {
      validatePhone(formData["shipping_address.phone"], countryCode)
    }
    // Reset async verification when country changes
    setVatVerificationStatus("idle")
    setVatCompanyName("")
    lastVerifiedRef.current = null
    // Cancel any in-flight verification
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData["shipping_address.country_code"]])

  // Async VIES verification (debounced) when VAT or country changes
  useEffect(() => {
    const countryCode = formData["shipping_address.country_code"]
    const vatNumber = formData.vat_number?.trim()

    if (!isBusiness || !countryCode || !vatNumber) {
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

    // Skip if this exact (country, VAT) pair was already verified
    if (
      lastVerifiedRef.current &&
      lastVerifiedRef.current.country === countryCode &&
      lastVerifiedRef.current.vat === vatNumber
    ) {
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
          `/api/validate-vat?country=${encodeURIComponent(
            countryCode
          )}&vat=${encodeURIComponent(vatNumber)}`,
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
        // Memoize to avoid re-verifying the same pair
        lastVerifiedRef.current = { country: countryCode, vat: vatNumber }
      } catch (err: any) {
        if (err?.name === "AbortError") return // stale request, ignore
        setVatVerificationStatus("service_unavailable")
      }
    }, 600) // 600ms debounce

    return () => {
      clearTimeout(timer)
    }
  }, [
    formData.vat_number,
    formData["shipping_address.country_code"],
    isBusiness,
  ])

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
        "shipping_address.address_2": address?.address_2 || "",
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
    // Sync the form with the cart's shipping address. The middleware writes a
    // minimal `{ country_code }` shipping address onto fresh carts — don't let
    // that wipe the customer-profile prefill; only sync when the cart address
    // carries real data.
    if (
      cart &&
      cart.shipping_address &&
      (cart.shipping_address.first_name || cart.shipping_address.address_1)
    ) {
      setFormAddress(cart?.shipping_address, cart?.email)
    }

    if (cart && customer) {
      setFormData((prevState: Record<string, any>) => ({
        ...prevState,
        ...(customer.email && !cart.email
          ? { email: customer.email }
          : undefined),
        ...(customer.first_name && !cart?.shipping_address?.first_name
          ? { "shipping_address.first_name": customer.first_name }
          : undefined),
        ...(customer.last_name && !cart?.shipping_address?.last_name
          ? { "shipping_address.last_name": customer.last_name }
          : undefined),
        ...(customer.phone && !cart?.shipping_address?.phone
          ? { "shipping_address.phone": customer.phone }
          : undefined),
      }))
    }
  }, [cart]) // Add cart as a dependency

  const handleCountryChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    // Prevent concurrent region-switch requests
    if (isSwitchingRegion || !cart) return

    const newCountry = e.target.value
    setFormData({ ...formData, [e.target.name]: newCountry })

    const option = countryOptions.find((o) => o.country === newCountry)
    const needsRegionSwitch = option && option.region !== cart?.region?.id

    if (needsRegionSwitch) {
      setIsSwitchingRegion(true)
    }

    try {
      if (needsRegionSwitch) {
        // Step 1: update the cart's region before writing the address
        // (Medusa rejects country_code if it's not in the current region)
        await sdk.store.cart.update(cart.id, {
          region_id: option!.region,
        })
      }

      // Step 2: set the shipping address country (now valid in the region)
      await sdk.store.cart.update(cart.id, {
        shipping_address: { country_code: newCountry },
      })

      // Auto-select shipping method when exactly one delivery option exists
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
      // Let the user retry — the select re-enables
    } finally {
      if (needsRegionSwitch) {
        setIsSwitchingRegion(false)
      }
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

  const handlePasswordChange = (value: string) => {
    setPassword(value)
    setPasswordError(null)
  }

  const handlePasswordRepeatChange = (value: string) => {
    setPasswordRepeat(value)
    setPasswordError(null)
  }

  const loginReturnUrl = `${pathname}${
    searchParams.toString() ? `?${searchParams.toString()}` : ""
  }`

return (
  <>
    {customer && (addressesInRegion?.length || 0) > 0 && (
      <Container className="mb-6 flex flex-col gap-y-4 p-4 sm:p-5">
        <p className="text-small-regular">
          {t("checkout.useSaved").replace(
            "{name}",
            customer.first_name ?? ""
          )}
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

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
      {/* E-Mail — first field, with an inline login link (Vitra order) */}
      <div className="col-span-1 flex flex-col gap-y-2 mb-6">
        <Input
          label={t("account.email")}
          name="email"
          type="email"
          title={t("common.emailNotValid")}
          autoComplete="email"
          value={formData.email}
          onChange={handleChange}
          required
          data-testid="shipping-email-input"
        />
        {!customer && (
          <div>
            <span className="txt-compact-medium text-ink/70">
              Already have an account?{" "}
            </span>
            <LocalizedClientLink
              href={`/account?returnUrl=${encodeURIComponent(
                loginReturnUrl
              )}`}
              className="text-link hover:underline"
              data-testid="checkout-login-link"
            >
              {t("checkout.logIn")}
            </LocalizedClientLink>
          </div>
        )}
      </div>

      {/* Salutation */}
      <div className="flex flex-col gap-y-2 col-span-1 sm:col-span-2">
        <span className="txt-compact-medium-plus text-ink">
          {t("checkout.salutation")}
        </span>
        <RadioGroup
          value={formData.salutation}
          onChange={(value) =>
            setFormData((prev) => ({ ...prev, salutation: value }))
          }
          className="flex flex-wrap gap-x-6 gap-y-2"
        >
          {SALUTATIONS.map((option) => (
            <Radio
              key={option.value}
              value={option.value}
              data-testid={`salutation-${option.value}`}
              className="flex items-center gap-x-2 text-base-regular cursor-pointer"
            >
              <MedusaRadio checked={formData.salutation === option.value} />
              <span>{option.label}</span>
            </Radio>
          ))}
        </RadioGroup>
        <input type="hidden" name="salutation" value={formData.salutation} />
      </div>

      {/* First / Last name */}
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

      {/* Customer type — the B2C/B2B decision point */}
      <div className="flex flex-col gap-y-2 col-span-1 sm:col-span-2">
        <span className="txt-compact-medium-plus text-ink">
          {t("checkout.youAreA")}
        </span>
        <RadioGroup
          value={formData.customer_type}
          onChange={(value) =>
            setFormData((prev) => ({ ...prev, customer_type: value }))
          }
          className="flex flex-wrap gap-x-6 gap-y-2"
        >
          {(
            [
              { value: "b2c", label: t("checkout.privateCustomer") },
              { value: "b2b", label: t("checkout.businessCustomer") },
            ] as const
          ).map((option) => (
            <Radio
              key={option.value}
              value={option.value}
              data-testid={`customer-type-${option.value}`}
              className="flex items-center gap-x-2 text-base-regular cursor-pointer"
            >
              <MedusaRadio
                checked={formData.customer_type === option.value}
              />
              <span>{option.label}</span>
            </Radio>
          ))}
        </RadioGroup>
        <input
          type="hidden"
          name="customer_type"
          value={formData.customer_type}
        />
      </div>

      {/* Company name — full width: business names run long, and it's the anchor
          of a B2B row, so it shouldn't visually pair with Address Line 1 */}
      <Input
        label={t("addresses.company")}
        name="shipping_address.company"
        value={formData["shipping_address.company"]}
        onChange={handleChange}
        autoComplete="organization"
        required={isBusiness}
        data-testid="shipping-company-input"
     
      />

      {/* Address line 1 / 2 — now pair with each other, not with Company */}
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
        label={t("checkout.additionalAddressInfo")}
        name="shipping_address.address_2"
        autoComplete="address-line2"
        value={formData["shipping_address.address_2"]}
        onChange={handleChange}
        data-testid="shipping-address-2-input"
      />

      {/* Postal code / City pair, then Province / Country pair */}
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
      <Input
        label={t("addresses.provinceState")}
        name="shipping_address.province"
        autoComplete="address-level1"
        value={formData["shipping_address.province"]}
        onChange={handleChange}
        data-testid="shipping-province-input"
      />
      <CountrySelect
        name="shipping_address.country_code"
        autoComplete="country"
        regions={regions}
        disabled={isSwitchingRegion}
        value={formData["shipping_address.country_code"]}
        onChange={handleCountryChange}
        required
        data-testid="shipping-country-select"
      />

      {/* Phone — full width so the helper text and error line don't get
          cramped into a half column */}
      <div className="flex flex-col gap-y-1 sm:col-span-1 col-span-2">
        <Input
          label={t("account.phone")}
          name="shipping_address.phone"
          autoComplete="tel"
          value={formData["shipping_address.phone"]}
          onChange={handleChange}
          data-testid="shipping-phone-input"
        />
        <span className="text-xs text-ui-fg-subtle">
          {t("checkout.phoneHelper")}
        </span>
        {phoneError && (
          <Text className="text-xs text-red-500 mt-1 mb-2">{phoneError}</Text>
        )}
      </div>

      {/* VAT — business customers only, full width for the 4-state
          verification status line */}
      {isBusiness && (
        <div className="col-span-1 sm:col-span-2">
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
            <Text className="text-xs text-red-500 mt-1 mb-2">{vatError}</Text>
          )}

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
      )}

      <div className="mb-4 col-span-1 sm:col-span-2">
        <Checkbox
          label={t("checkout.sameAsBilling")}
          name="same_as_billing"
          checked={checked}
          onChange={onChange}
          data-testid="billing-address-checkbox"
        />
      </div>

      {/* Account — dynamic sign-up: private customers opt in, business customers must create one */}
      {!customer && (
        <section className="flex flex-col gap-y-4 border-t pt-8 col-span-1 sm:col-span-2">
          <Heading level="h3" className="text-2xl-semi">
            {t("checkout.account")}
          </Heading>

          {!isBusiness && (
            <Checkbox
              label={t("checkout.createCustomerAccount")}
              name="create_customer_account"
              checked={createAccount}
              onChange={() => setCreateAccount(!createAccount)}
              data-testid="create-account-checkbox"
            />
          )}
          {(isBusiness || createAccount) && (
            <>
              <p className="text-base-regular">
                {t("checkout.accountDescription")}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={t("checkout.newPassword")}
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  required
                  data-testid="checkout-password-input"
                />
                <Input
                  label={t("checkout.repeatNewPassword")}
                  name="password_repeat"
                  type="password"
                  autoComplete="new-password"
                  value={passwordRepeat}
                  onChange={(e) => handlePasswordRepeatChange(e.target.value)}
                  required
                  data-testid="checkout-password-repeat-input"
                />
              </div>
              <span className="text-xs text-ui-fg-subtle -mt-2">
                {t("checkout.passwordRule")}
              </span>
              {passwordError && (
                <Text className="text-xs text-red-500 -mt-2">
                  {passwordError}
                </Text>
              )}
            </>
          )}
        </section>
      )}
    </div>
  </>
)
}

export default ShippingAddress
