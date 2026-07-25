import { requireSession, getRole } from "@/lib/session"
import { getDailyBilan, getWeeklyBilan } from "@/app/actions/admin"
import { todayStr } from "@/lib/utils"
import { BilansPageClient } from "./client"

export default async function BilansPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const session = await requireSession()
  const role = getRole(session)
  const resolved = await searchParams
  const date = resolved.date || todayStr()

  const [daily, weekly] = await Promise.all([
    getDailyBilan(date),
    getWeeklyBilan(date),
  ])

  return <BilansPageClient daily={daily} weekly={weekly} date={date} role={role} />
}