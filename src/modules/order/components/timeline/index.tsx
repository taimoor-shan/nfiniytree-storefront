"use client"

import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import { getOrderProgress } from "@lib/util/order-progress"
import { useTranslation } from "@lib/i18n/client"

type TimelineProps = {
  order: HttpTypes.StoreOrder
}

const Timeline = ({ order }: TimelineProps) => {
  const { t } = useTranslation()
  const { steps, currentStep, fulfillments } = getOrderProgress(order)

  return (
    <div className="bg-canvas-card border border-hairline rounded-sm p-6">
      {/* ── Progress bar ──────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          {steps.map((step, i) => (
            <div key={step.id} className="flex-1 flex flex-col items-center">
              <div
                className={clx(
                  "w-3 h-3 rounded-full mb-2",
                  step.completed ? "bg-primary" : "bg-ui-bg-interactive-disabled"
                )}
              />
            </div>
          ))}
        </div>
        {/* connecting lines */}
        <div className="relative -mt-5 mb-2 mx-2">
          <div className="absolute top-0 left-2 right-2 h-px bg-ui-bg-interactive-disabled" />
          <div
            className="absolute top-[-6px] left-2 h-px bg-primary transition-all duration-500"
            style={{
              width: `${
                currentStep === "confirmed"
                  ? 0
                  : currentStep === "in_progress"
                    ? 33
                    : currentStep === "shipped"
                      ? 66
                      : 100
              }%`,
            }}
          />
        </div>
        <div className="flex justify-between pt-4">
          {steps.map((step) => (
            <div key={step.id} className="flex-1 text-center">
              <p
                className={clx(
                  "text-compact-small",
                  step.completed ? "text-ink font-medium" : "text-muted"
                )}
              >
                {t(step.labelKey)}
              </p>
              {step.date && (
                <p className="text-xs text-muted mt-0.5">
                  {new Date(step.date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Current step highlight ────────────────────────── */}
      <div className="bg-ui-bg-subtle rounded-sm p-4 mb-6">
        <p className="text-sm text-muted">{t("order.timeline.currentStatus")}</p>
        <p className="text-base text-ink font-medium">
          {t(steps.find((s) => s.id === currentStep)?.labelKey || "")}
        </p>
        {steps.find((s) => s.id === "shipped")?.tracking && (
          <div className="mt-3 pt-3 border-t border-hairline">
            <p className="text-xs text-muted mb-1">
              {t("order.timeline.trackingNumber")}
            </p>
            <p className="text-sm text-ink font-mono">
              {steps.find((s) => s.id === "shipped")!.tracking!.number}
            </p>
            {steps.find((s) => s.id === "shipped")!.tracking!.url && (
              <a
                href={steps.find((s) => s.id === "shipped")!.tracking!.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 text-sm text-primary hover:underline"
              >
                {t("order.timeline.trackShipment")} &rarr;
              </a>
            )}
          </div>
        )}
        {currentStep === "shipped" && !steps.find((s) => s.id === "shipped")?.tracking && (
          <p className="mt-2 text-xs text-muted">
            {t("order.timeline.estimatedDelivery")}
          </p>
        )}
      </div>

      {/* ── Per-fulfillment detail (if multiple) ──────────── */}
      {fulfillments.length > 1 && (
        <div>
          <p className="text-sm text-ink font-medium mb-3">
            {t("order.timeline.shipments")}
          </p>
          <div className="space-y-3">
            {fulfillments.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between bg-ui-bg-subtle rounded-sm p-3"
              >
                <div>
                  <p className="text-compact-small text-ink font-medium">
                    {t(f.status, f.status)}
                  </p>
                  {f.tracking_number && (
                    <p className="text-xs text-muted font-mono mt-0.5">
                      {f.tracking_number}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  {f.shipped_at && (
                    <p className="text-xs text-muted">
                      {t("order.progress.shipped")}{" "}
                      {new Date(f.shipped_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  )}
                  {f.delivered_at && (
                    <p className="text-xs text-muted">
                      {t("order.progress.delivered")}{" "}
                      {new Date(f.delivered_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  )}
                  {f.tracking_url && (
                    <a
                      href={f.tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      {t("order.timeline.track")} &rarr;
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Timeline
