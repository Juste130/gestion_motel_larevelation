import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export interface AuthenticatedUser {
  id: string
  email: string
  name: string
  role: "ADMIN" | "DG" | "RECEPTIONIST" | string
}

/** Returns the typed session, redirecting to /login if not authenticated (for RSC / pages) */
export async function requireSession() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user || !session.user.id) {
    redirect("/login")
  }
  return session
}

/** Returns the typed session user for Server Actions, throwing an Error if unauthorized */
export async function getSessionUser(): Promise<{ session: any; user: AuthenticatedUser }> {
  const session = await getServerSession(authOptions)
  if (!session || !session.user || !session.user.id) {
    throw new Error("Non autorisé")
  }
  return {
    session,
    user: {
      id: session.user.id,
      email: session.user.email || "",
      name: session.user.name || "",
      role: session.user.role || "RECEPTIONIST",
    },
  }
}

/** Returns role from session */
export function getRole(session: Awaited<ReturnType<typeof requireSession>>) {
  return session.user?.role ?? "RECEPTIONIST"
}
