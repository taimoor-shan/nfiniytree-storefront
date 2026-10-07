/**
 * The address this server uses to reach Medusa directly.
 *
 * `NEXT_PUBLIC_MEDUSA_BACKEND_URL` is the address the browser sees. In
 * production that is the public domain, where Nginx sends only Medusa's own
 * paths (/store, /auth, /app, ...) to Medusa and everything else to this
 * storefront. The sales commission plugin's routes (/sales-portal/*,
 * /sales-invites/*) are not among them: asked through the public address they
 * get a page of this storefront back instead of JSON. Server code that calls
 * those routes uses `MEDUSA_BACKEND_URL` instead, the address Medusa listens
 * on at the server (http://localhost:9000). Without it the public address is
 * used, which is right for development.
 */
export const serverBackendUrl = (
  env: {
    MEDUSA_BACKEND_URL?: string
    NEXT_PUBLIC_MEDUSA_BACKEND_URL?: string
  } = {
    MEDUSA_BACKEND_URL: process.env.MEDUSA_BACKEND_URL,
    NEXT_PUBLIC_MEDUSA_BACKEND_URL: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL,
  }
): string =>
  (
    env.MEDUSA_BACKEND_URL ||
    env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
    "http://localhost:9000"
  ).replace(/\/+$/, "")

/** Said in the log when a reply meant for Medusa turns out to be a web page. */
export const MISROUTED_HINT =
  "the request seems to reach the storefront, not Medusa. Set MEDUSA_BACKEND_URL to the address Medusa listens on (http://localhost:9000)"
