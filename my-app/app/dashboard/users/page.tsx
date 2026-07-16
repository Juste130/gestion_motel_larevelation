import { redirect } from "next/navigation"
import { requireSession, getRole } from "@/lib/session"
import { getUsers } from "@/app/actions/admin"
import { UsersPageClient } from "./client"

export default async function UsersPage() {
  const session = await requireSession()
  const role = getRole(session)
  if (role !== "ADMIN" && role !== "DG") redirect("/dashboard")

  const users = await getUsers()
  return <UsersPageClient users={users} currentRole={role} />
}
