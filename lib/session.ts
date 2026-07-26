import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

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

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { status: true, role: true, name: true, email: true }
  })

  if (!dbUser || dbUser.status !== "ACTIVE") {
    throw new Error("Compte inactif ou non autorisé.")
  }

  return {
    session,
    user: {
      id: session.user.id,
      email: dbUser.email || session.user.email || "",
      name: dbUser.name || session.user.name || "",
      role: dbUser.role || "RECEPTIONIST",
    },
  }
}

/** Returns role from session */
export function getRole(session: Awaited<ReturnType<typeof requireSession>>) {
  return session.user?.role ?? "RECEPTIONIST"
}
