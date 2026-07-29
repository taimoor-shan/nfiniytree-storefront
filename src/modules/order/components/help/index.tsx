"use client"

import { Heading } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useTranslation } from "@/lib/i18n"
import React from "react"

const Help = () => {
  const { t } = useTranslation()

  return (
    <div className="mt-6">
      <Heading className="text-base-semi">{t("order.needHelp")}</Heading>
      <div className="text-base-regular my-2">
        <ul className="gap-y-2 flex flex-col">
          <li>
            <LocalizedClientLink className="hover:underline text-primary" href="/contact">{t("nav.contact")}</LocalizedClientLink>
          </li>
          <li>
            <LocalizedClientLink className="hover:underline text-primary" href="/policies/returns">
              {t("order.returnsExchanges")}
            </LocalizedClientLink>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default Help
