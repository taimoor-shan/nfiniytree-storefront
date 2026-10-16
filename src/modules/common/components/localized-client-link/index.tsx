"use client"

import Link from "next/link"
import { useMarketPrefix } from "@lib/context/market-context"
import React from "react"

/**
 * Use this component to create a Next.js `<Link />` that keeps the current market prefix
 * (`/hu`, `/en-hu`) in the url, without having to explicitly pass it as a prop.
 */
const LocalizedClientLink = ({
  children,
  href,
  ...props
}: {
  children?: React.ReactNode
  href: string
  className?: string
  onClick?: () => void
  passHref?: true
  [x: string]: any
}) => {
  const prefix = useMarketPrefix()

  return (
    <Link href={`/${prefix}${href}`} {...props}>
      {children}
    </Link>
  )
}

export default LocalizedClientLink
