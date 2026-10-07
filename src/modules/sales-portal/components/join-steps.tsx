import { clx } from "@medusajs/ui"

/** Where an application stands: sent, with the owner's review, contract, then portal access. */
const JoinSteps = ({
  labels,
  current,
}: {
  labels: string[]
  /** The step waiting on someone, counting from 0; earlier ones are done */
  current: number
}) => (
  <ol className="flex flex-col gap-y-3" data-testid="join-steps">
    {labels.map((label, index) => {
      const done = index < current
      const active = index === current

      return (
        <li
          key={label}
          className="flex items-center gap-x-3"
          aria-current={active ? "step" : undefined}
        >
          <span
            aria-hidden="true"
            className={clx(
              "flex h-6 w-6 items-center justify-center rounded-full text-small-regular",
              done && "bg-success/40 text-ink",
              active && "border-2 border-ink text-ink",
              !done && !active && "border border-hairline-strong text-muted"
            )}
          >
            {done ? "✓" : index + 1}
          </span>
          <span
            className={clx(
              "text-base-regular",
              done || active ? "text-ink" : "text-muted"
            )}
          >
            {label}
          </span>
        </li>
      )
    })}
  </ol>
)

export default JoinSteps
