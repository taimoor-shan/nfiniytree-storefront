"use client"

import useToggleState from "@lib/hooks/use-toggle-state"
import LanguageSelect from "@modules/layout/components/language-select"
import { Locale } from "@lib/data/locales"

type NavLanguageSelectProps = {
  locales: Locale[] | null
  currentLocale: string | null
}

const NavLanguageSelect = ({ locales, currentLocale }: NavLanguageSelectProps) => {
  const toggleState = useToggleState()

  if (!locales?.length) {
    return null
  }

  return (
    <div
      className="hidden small:flex items-center h-full"
      onMouseEnter={toggleState.open}
      onMouseLeave={toggleState.close}
    >
      <LanguageSelect
        toggleState={toggleState}
        locales={locales}
        currentLocale={currentLocale}
        label={null}
        buttonClassName="w-auto"
        dropdownWrapperClassName="w-fit min-w-0"
      />
    </div>
  )
}

export default NavLanguageSelect
