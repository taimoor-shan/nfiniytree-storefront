"use client"

import { HttpTypes } from "@medusajs/types"
import Input from "@modules/common/components/input"
import { useTranslation } from "@/lib/i18n"
import React, { useState } from "react"
import CountrySelect from "../country-select"

const BillingAddress = ({
  cart,
  customer,
  regions,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
  regions: HttpTypes.StoreRegion[]
}) => {
  const { t } = useTranslation()

  // Fallback address for prefilling a signed-in customer's billing form:
  // their default billing address (or any saved one) when the cart doesn't
  // carry a billing address yet.
  const defaultBillingAddress =
    customer?.addresses?.find((a) => a.is_default_billing) ||
    customer?.addresses?.find((a) => a.is_default_shipping) ||
    customer?.addresses?.[0]

  const [formData, setFormData] = useState<any>({
    "billing_address.first_name":
      cart?.billing_address?.first_name ||
      defaultBillingAddress?.first_name ||
      customer?.first_name ||
      "",
    "billing_address.last_name":
      cart?.billing_address?.last_name ||
      defaultBillingAddress?.last_name ||
      customer?.last_name ||
      "",
    "billing_address.address_1":
      cart?.billing_address?.address_1 ||
      defaultBillingAddress?.address_1 ||
      "",
    "billing_address.address_2":
      cart?.billing_address?.address_2 ||
      defaultBillingAddress?.address_2 ||
      "",
    "billing_address.company":
      cart?.billing_address?.company ||
      defaultBillingAddress?.company ||
      customer?.company_name ||
      "",
    "billing_address.postal_code":
      cart?.billing_address?.postal_code ||
      defaultBillingAddress?.postal_code ||
      "",
    "billing_address.city":
      cart?.billing_address?.city ||
      defaultBillingAddress?.city ||
      "",
    "billing_address.country_code":
      cart?.billing_address?.country_code ||
      defaultBillingAddress?.country_code ||
      "",
    "billing_address.province":
      cart?.billing_address?.province ||
      defaultBillingAddress?.province ||
      "",
    "billing_address.phone":
      cart?.billing_address?.phone ||
      defaultBillingAddress?.phone ||
      customer?.phone ||
      "",
  })

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLInputElement | HTMLSelectElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label={t("account.firstName")}
          name="billing_address.first_name"
          autoComplete="given-name"
          value={formData["billing_address.first_name"]}
          onChange={handleChange}
          required
          data-testid="billing-first-name-input"
        />
        <Input
          label={t("account.lastName")}
          name="billing_address.last_name"
          autoComplete="family-name"
          value={formData["billing_address.last_name"]}
          onChange={handleChange}
          required
          data-testid="billing-last-name-input"
        />
        <Input
          label={t("addresses.address")}
          name="billing_address.address_1"
          autoComplete="address-line1"
          value={formData["billing_address.address_1"]}
          onChange={handleChange}
          required
          data-testid="billing-address-input"
        />
        <Input
          label={t("checkout.additionalAddressInfo")}
          name="billing_address.address_2"
          autoComplete="address-line2"
          value={formData["billing_address.address_2"]}
          onChange={handleChange}
          data-testid="billing-address-2-input"
        />
        <Input
          label={t("addresses.company")}
          name="billing_address.company"
          value={formData["billing_address.company"]}
          onChange={handleChange}
          autoComplete="organization"
          data-testid="billing-company-input"
        />
        <Input
          label={t("addresses.postalCode")}
          name="billing_address.postal_code"
          autoComplete="postal-code"
          value={formData["billing_address.postal_code"]}
          onChange={handleChange}
          required
          data-testid="billing-postal-input"
        />
        <Input
          label={t("addresses.city")}
          name="billing_address.city"
          autoComplete="address-level2"
          value={formData["billing_address.city"]}
          onChange={handleChange}
        />
        <CountrySelect
          name="billing_address.country_code"
          autoComplete="country"
          regions={regions}
          value={formData["billing_address.country_code"]}
          onChange={handleChange}
          required
          data-testid="billing-country-select"
        />
        <Input
          label={t("addresses.provinceState")}
          name="billing_address.province"
          autoComplete="address-level1"
          value={formData["billing_address.province"]}
          onChange={handleChange}
          data-testid="billing-province-input"
        />
        <Input
          label={t("account.phone")}
          name="billing_address.phone"
          type="tel"
          autoComplete="tel"
          value={formData["billing_address.phone"]}
          onChange={handleChange}
          data-testid="billing-phone-input"
        />
      </div>
    </>
  )
}

export default BillingAddress
