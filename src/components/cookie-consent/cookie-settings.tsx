"use client"

import * as React from "react"
import { clx, Switch } from "@medusajs/ui"
import { Check, Shield } from "lucide-react"
import Modal from "@modules/common/components/modal"
import Divider from "@modules/common/components/divider"
import { useCookieConsent, defaultCategories } from "./cookie-provider"
import type { ConsentCategory } from "./types"
import { getDefaultCategories, getAllAcceptedCategories } from "./utils"
import { CookieConsentCopy, defaultCookieConsentCopy } from "./copy"

export interface CookieSettingsProps {
  className?: string
  /**
   * Localized strings. Defaults to English; pass the storefront's localized
   * copy via the boundary component.
   */
  copy?: CookieConsentCopy
}

/**
 * Settings dialog opened from the banner and the footer trigger. Uses the
 * storefront's own Modal (z-index and close button already match the design
 * system and the localized `common.close` label).
 */
export function CookieSettings({
  className,
  copy = defaultCookieConsentCopy,
}: CookieSettingsProps) {
  const {
    isSettingsOpen,
    closeSettings,
    state,
    updateConsent,
    config,
    acceptAll,
    rejectAll,
  } = useCookieConsent()

  const categories = config.categories ?? defaultCategories

  const [localCategories, setLocalCategories] = React.useState(state.categories)

  // Sync local state when modal opens or when state changes
  React.useEffect(() => {
    if (isSettingsOpen) {
      setLocalCategories(state.categories)
    }
  }, [isSettingsOpen, state.categories])

  const handleToggle = (key: ConsentCategory, checked: boolean) => {
    setLocalCategories((prev) => ({
      ...prev,
      [key]: checked,
    }))
  }

  // Close first: consent is persisted locally and synchronously, and the
  // audit post (tracker.ts) must not keep the dialog open on a slow network.
  const handleSave = () => {
    closeSettings()
    void updateConsent(localCategories)
  }

  const handleAcceptAll = () => {
    // Update local state immediately for UI feedback
    setLocalCategories(getAllAcceptedCategories())
    closeSettings()
    void acceptAll()
  }

  const handleRejectAll = () => {
    // Update local state immediately for UI feedback
    setLocalCategories(getDefaultCategories())
    closeSettings()
    void rejectAll()
  }

  return (
    <Modal isOpen={isSettingsOpen} close={closeSettings} size="medium">
      <Modal.Title>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-card">
            <Shield className="h-5 w-5 text-primary-text" />
          </div>
          <span className="font-display">{copy.settingsTitle}</span>
        </div>
      </Modal.Title>
      <Modal.Description>{copy.settingsDescription}</Modal.Description>

      <div className={clx("max-h-[60vh] space-y-4 overflow-y-auto py-2", className)}>
        {categories.map((category) => {
          const isEnabled = localCategories[category.key]
          const isRequired = category.required

          return (
            <div
              key={category.key}
              className={clx(
                "flex items-start justify-between gap-4 rounded-lg border p-4 transition-colors",
                isEnabled ? "border-primary/20 bg-primary/5" : "border-hairline"
              )}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <label
                    htmlFor={`cookie-${category.key}`}
                    className="cursor-pointer text-sm font-medium text-ink"
                  >
                    {category.title}
                  </label>
                  {isRequired && (
                    <span className="rounded bg-surface-card px-2 py-0.5 text-xs text-muted">
                      {copy.required}
                    </span>
                  )}
                </div>
                <p className="text-sm leading-relaxed text-body">
                  {category.description}
                </p>
              </div>
              <Switch
                id={`cookie-${category.key}`}
                checked={isEnabled}
                onCheckedChange={(checked) =>
                  handleToggle(category.key, checked)
                }
                disabled={isRequired}
                className="mt-0.5 data-[state=checked]:!bg-primary-strong"
              />
            </div>
          )
        })}
      </div>

      <Divider />

      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={handleRejectAll}
          className="btn-primary-outlined w-full sm:w-auto"
        >
          {copy.rejectAll}
        </button>
        <button
          type="button"
          onClick={handleAcceptAll}
          className="btn-primary-outlined w-full sm:w-auto"
        >
          {copy.acceptAll}
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="btn-primary gap-2 w-full sm:w-auto"
        >
          <Check className="h-4 w-4" />
          {copy.savePreferences}
        </button>
      </div>

      {config.privacyPolicyUrl && (
        <p className="mt-4 text-center text-xs text-muted">
          {copy.privacyNote}{" "}
          <a
            href={config.privacyPolicyUrl}
            className="text-primary-text underline underline-offset-4 transition-colors hover:text-primary-hover"
            target="_blank"
            rel="noopener noreferrer"
          >
            {copy.privacyPolicy}
          </a>
        </p>
      )}
    </Modal>
  )
}
