// Fallback for unmatched routes in the login slot.
// Without this, any /account/* URL not explicitly defined in @login
// causes a 404 for the entire page.
export default function LoginDefault() {
  return null
}
