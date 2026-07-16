import { requireSession, getRole } from "@/lib/session"
import { getResumeStats } from "@/app/actions/admin"
import { DashboardClient } from "./client"

export default async function DashboardPage() {
  const session = await requireSession()
  const role = getRole(session)
  const stats = await getResumeStats()
  return <DashboardClient stats={stats} role={role} />
}
