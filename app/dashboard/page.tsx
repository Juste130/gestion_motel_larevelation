import { requireSession, getRole } from "@/lib/session"
import { getResumeStats, getLiveDailySummary } from "@/app/actions/admin"
import { DashboardClient } from "./client"

export default async function DashboardPage() {
  const session = await requireSession()
  const role = getRole(session)
  const [stats, liveSummary] = await Promise.all([
    getResumeStats(),
    getLiveDailySummary(),
  ])
  return <DashboardClient stats={stats} role={role} liveSummary={liveSummary} />
}