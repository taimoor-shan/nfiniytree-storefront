import { clx } from "@medusajs/ui"
import React from "react"

export const DataTable = ({
  children,
  ...props
}: {
  children: React.ReactNode
  "data-testid"?: string
}) => (
  <div className="overflow-x-auto" {...props}>
    <table className="w-full text-small-regular">{children}</table>
  </div>
)

export const Th = ({
  children,
  right,
}: {
  children?: React.ReactNode
  right?: boolean
}) => (
  <th
    scope="col"
    className={clx(
      "border-b border-hairline px-3 py-3 font-normal text-muted whitespace-nowrap",
      right ? "text-right" : "text-left"
    )}
  >
    {children}
  </th>
)

export const Td = ({
  children,
  right,
  className,
}: {
  children?: React.ReactNode
  right?: boolean
  className?: string
}) => (
  <td
    className={clx(
      "border-b border-hairline-soft px-3 py-3 align-top whitespace-nowrap",
      right && "text-right tabular-nums",
      className
    )}
  >
    {children}
  </td>
)
