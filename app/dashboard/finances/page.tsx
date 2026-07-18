import { requireSession, getRole } from "@/lib/session"
import { getCashMovements } from "@/app/actions/admin"
import { FinancesClient } from "./client"

export default async function FinancesPage() {
  const session = await requireSession()
  const role = getRole(session)
  const movements = await getCashMovements()
  return <FinancesClient movements={movements} role={role} />
}
