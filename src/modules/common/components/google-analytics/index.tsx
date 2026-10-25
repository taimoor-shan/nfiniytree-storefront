"use client"

import { ConsentScript } from "@/components/cookie-consent"
import {
  flushPendingEvents,
  GA_DISABLE_KEY,
  GA_MEASUREMENT_ID,
  revokeAnalytics,
} from "@lib/analytics/ga4"

// Runs once the visitor allows analytics. Consent comes before `config`, so
// the page view `config` sends already counts with cookies and keeps the
// visit's source (a page view sent before the grant would be anonymous, and
// the next one would look like a direct visit). `gtag` pushes `arguments`, as
// in Google's own snippet: gtag.js ignores arrays in the data layer.
const INIT = GA_MEASUREMENT_ID
  ? `window[${JSON.stringify(GA_DISABLE_KEY)}]=false;
window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments);}
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied'});
gtag('consent','update',{analytics_storage:'granted'});
gtag('js',new Date());
gtag('config','${GA_MEASUREMENT_ID}');`
  : ""

const TAG = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`

/**
 * Google Analytics 4, loaded only with the visitor's consent ("Analytics" in
 * the cookie banner). Withdrawing consent stops it and deletes its cookies.
 * Page views, including client-side navigation, come from GA's enhanced
 * measurement; the shop's own events go through `trackEvent`.
 *
 * Renders nothing, and nothing at all without a measurement ID (`yarn dev`).
 */
export default function GoogleAnalytics() {
  if (!INIT) return null
  return (
    <>
      <ConsentScript
        id="ga4-init"
        category="analytics"
        onLoad={flushPendingEvents}
        onRevoke={revokeAnalytics}
      >
        {INIT}
      </ConsentScript>
      <ConsentScript id="ga4-tag" category="analytics" src={TAG} />
    </>
  )
}
