import { requireSession, getRole } from "@/lib/session"
import { getClosures, getLiveDailySummary } from "@/app/actions/admin"
import { BilansPageClient } from "./client"

export default async function BilansPage() {
  const session = await requireSession()
  const role = getRole(session)
  const closures = await getClosures()
  const liveSummary = await getLiveDailySummary()
  return <BilansPageClient closures={closures} role={role} liveSummary={liveSummary} />
}