import { Heading } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { translate } from "@/lib/i18n"
import { getLocale } from "@lib/data/locale-actions"
import React from "react"

const Help = async () => {
  const locale = await getLocale()

  return (
    <div className="mt-6">
      <Heading className="text-base-semi">{await translate("order.needHelp", locale)}</Heading>
      <div className="text-base-regular my-2">
        <ul className="gap-y-2 flex flex-col">
          <li>
            <LocalizedClientLink className="hover:underline text-primary" href="/contact">{await translate("nav.contact", locale)}</LocalizedClientLink>
          </li>
          <li>
            <LocalizedClientLink className="hover:underline text-primary" href="/policies/returns">
              {await translate("order.returnsExchanges", locale)}
            </LocalizedClientLink>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default Help
