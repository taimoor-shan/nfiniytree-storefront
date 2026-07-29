// Fallback for unmatched routes in the dashboard slot.
// Without this, any /account/* URL not explicitly defined in @dashboard
// causes a 404 for the entire page.
export default function DashboardDefault() {
  return null
}
