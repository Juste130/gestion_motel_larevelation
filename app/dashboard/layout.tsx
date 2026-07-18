import { SidebarLayout } from "@/components/sidebar-layout"
import { requireSession, getRole } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession()

  const user = {
    name: session.user?.name || "",
    email: session.user?.email || "",
    role: getRole(session),
  }

  const lowStockCount = await prisma.product.count({
    where: { stock: { lte: 3 } }
  })

  return <SidebarLayout user={user} lowStockCount={lowStockCount}>{children}</SidebarLayout>
}
