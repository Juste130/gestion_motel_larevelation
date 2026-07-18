import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

/** Returns the typed session, redirecting to /login if not authenticated */
export async function requireSession() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")
  return session
}

/** Returns role from session */
export function getRole(session: Awaited<ReturnType<typeof requireSession>>) {
  return session.user?.role ?? "RECEPTIONIST"
}
