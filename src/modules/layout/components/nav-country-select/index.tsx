"use client"

import { HttpTypes } from "@medusajs/types"

import useToggleState from "@lib/hooks/use-toggle-state"
import CountrySelect from "@modules/layout/components/country-select"

type NavCountrySelectProps = {
  regions: HttpTypes.StoreRegion[] | null
}

const NavCountrySelect = ({ regions }: NavCountrySelectProps) => {
  const toggleState = useToggleState()

  if (!regions?.length) {
    return null
  }

  return (
    <div
      className="hidden small:flex items-center h-full"
      onMouseEnter={toggleState.open}
      onMouseLeave={toggleState.close}
    >
      <CountrySelect
        toggleState={toggleState}
        regions={regions}
        label={null}
        buttonClassName="w-auto"
        dropdownWrapperClassName="w-fit min-w-0"
      />
    </div>
  )
}

export default NavCountrySelect

