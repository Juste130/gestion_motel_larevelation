import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { SidebarLayout } from "@/components/sidebar-layout"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/")
  }

  const role = (session.user as any)?.role
  const user = {
    name: session.user?.name || "",
    email: session.user?.email || "",
    role,
  }

  return <SidebarLayout user={user}>{children}</SidebarLayout>
}
