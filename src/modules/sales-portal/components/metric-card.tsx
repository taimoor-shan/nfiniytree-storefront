import { ReactNode } from "react"

/** One number the rep looks for first, with a line saying what it is made of. */
const MetricCard = ({
  label,
  value,
  hint,
  testId,
}: {
  label: string
  value: string
  hint?: ReactNode
  testId?: string
}) => (
  <div className="bg-surface-soft rounded-md p-5 flex flex-col gap-y-1" data-testid={testId}>
    <span className="text-small-regular text-muted">{label}</span>
    <span className="text-xl-semi tabular-nums">{value}</span>
    {hint && <span className="text-small-regular text-muted">{hint}</span>}
  </div>
)

export default MetricCard
