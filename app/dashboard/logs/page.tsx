import { redirect } from "next/navigation"
import { requireSession, getRole } from "@/lib/session"
import { getAuditLogs } from "@/app/actions/admin"
import { LogsPageClient } from "./client"

export default async function LogsPage() {
  const session = await requireSession()
  const role = getRole(session)
  if (role !== "ADMIN" && role !== "DG") redirect("/dashboard")

  const logs = await getAuditLogs()
  return <LogsPageClient initialLogs={logs} />
}