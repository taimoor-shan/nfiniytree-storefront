/**
 * Localizable copy for the cookie-consent UI.
 *
 * The OpenConsent components ship with English defaults; pass a localized
 * `CookieConsentCopy` (built from the storefront dictionaries in
 * src/modules/layout/components/cookie-consent) to render in the visitor's
 * language.
 */
export interface CookieConsentCopy {
  /** Banner heading */
  bannerTitle: string
  /** Banner paragraph (before the "Learn more" link) */
  bannerDescription: string
  /** Banner privacy-policy link label */
  learnMore: string
  /** Banner "Customize" button label */
  customize: string
  rejectAll: string
  acceptAll: string
  /** Settings dialog heading */
  settingsTitle: string
  /** Settings dialog subheading */
  settingsDescription: string
  /** Badge next to required categories */
  required: string
  /** Settings dialog primary action */
  savePreferences: string
  /** Prefix of the settings footer note, e.g. "Read our" */
  privacyNote: string
  /** Label of the linked privacy policy */
  privacyPolicy: string
  /** CookieTrigger text ("Cookie Settings") */
  trigger: string
  /** aria-label for the icon CookieTrigger */
  triggerLabel: string
}

export const defaultCookieConsentCopy: CookieConsentCopy = {
  bannerTitle: "Cookie Preferences",
  bannerDescription:
    "We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.",
  learnMore: "Learn more",
  customize: "Customize",
  rejectAll: "Reject All",
  acceptAll: "Accept All",
  settingsTitle: "Cookie Settings",
  settingsDescription: "Manage your cookie preferences below.",
  required: "Required",
  savePreferences: "Save Preferences",
  privacyNote: "Read our",
  privacyPolicy: "Privacy Policy",
  trigger: "Cookie Settings",
  triggerLabel: "Cookie settings",
}
