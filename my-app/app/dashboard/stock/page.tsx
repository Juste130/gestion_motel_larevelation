import { requireSession, getRole } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { StockPageClient } from "./client"

export default async function StockPage() {
  const session = await requireSession()
  const role = getRole(session)

  const [products, movements] = await Promise.all([
    prisma.product.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] }),
    prisma.stockMovement.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        product: { select: { name: true, category: true } },
        user: { select: { name: true } }
      }
    })
  ])

  return <StockPageClient products={products} movements={movements} role={role} />
}
