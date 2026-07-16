import { SidebarLayout } from "@/components/sidebar-layout"
import { requireSession, getRole } from "@/lib/session"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession()

  const user = {
    name: session.user?.name || "",
    email: session.user?.email || "",
    role: getRole(session),
  }

  return <SidebarLayout user={user}>{children}</SidebarLayout>
}
