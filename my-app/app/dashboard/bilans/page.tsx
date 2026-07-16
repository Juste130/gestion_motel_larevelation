import { requireSession, getRole } from "@/lib/session"
import { getClosures } from "@/app/actions/admin"
import { BilansPageClient } from "./client"

export default async function BilansPage() {
  const session = await requireSession()
  const role = getRole(session)
  const closures = await getClosures()
  return <BilansPageClient closures={closures} role={role} />
}
