import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"

export default async function DashboardIndex() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect("/")
  }

  const role = (session.user as any)?.role

  if (role === "DG" || role === "ADMIN") {
    redirect("/dashboard/admin")
  } else {
    redirect("/dashboard/reception")
  }
}
